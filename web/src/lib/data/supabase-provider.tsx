"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { resolveLoginEmail } from "@/lib/auth/actions";
import { StoreContextProvider } from "@/lib/data/context";
import {
  customerToRow,
  fieldToRow,
  harvestToRow,
  mapCustomer,
  mapField,
  mapHarvest,
  mapMill,
  mapOilInventory,
  mapOilSale,
  mapOliveSale,
  mapProfile,
  mapSeason,
  mapTx,
  millToRow,
  oilInventoryToRow,
  oilSaleToRow,
  oliveSaleToRow,
  seasonToRow,
  txToRow,
} from "@/lib/data/mappers";
import {
  computeDashboardStats,
  computeFieldCratesBySeason,
  computeHarvestsByField,
  computeOilYieldBySeason,
  searchCustomersList,
} from "@/lib/data/stats";
import {
  fetchCoreAppData,
  fetchFullAppData,
  fetchRemainingAppData,
  profileFromAuthUser,
} from "@/lib/data/fetch-app-data";
import { emptyData, type StoreApi } from "@/lib/data/types";
import { createClient } from "@/lib/supabase/client";
import type { AppData, Profile } from "@/lib/types";

function authErrorMessage(message: string): string {
  if (message.toLowerCase().includes("invalid login credentials")) {
    return "Λάθος στοιχεία σύνδεσης.";
  }
  if (message.toLowerCase().includes("user already registered")) {
    return "Το όνομα χρήστη ή το email χρησιμοποιείται ήδη.";
  }
  return message || "Σφάλμα αυθεντικοποίησης.";
}

export function SupabaseStoreProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [dataReady, setDataReady] = useState(true);
  const [data, setData] = useState<AppData>(emptyData);
  const [userId, setUserId] = useState<string | null>(null);
  const hydrateGen = useRef(0);

  const hydrateInBackground = useCallback(async (uid: string) => {
    const gen = ++hydrateGen.current;
    setDataReady(false);
    try {
      const [core, rest] = await Promise.all([
        fetchCoreAppData(uid),
        fetchRemainingAppData(uid),
      ]);
      if (gen !== hydrateGen.current) return;
      setData((prev) => ({
        ...prev,
        ...core,
        ...rest,
      }));
      setUserId(uid);
    } finally {
      if (gen === hydrateGen.current) setDataReady(true);
    }
  }, []);

  const reload = useCallback(async (uid: string) => {
    setDataReady(false);
    const next = await fetchFullAppData(uid);
    setData(next);
    setUserId(uid);
    setDataReady(true);
  }, []);

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (cancelled) return;
      if (session?.user) {
        const uid = session.user.id;
        setUserId(uid);
        setData((prev) => ({
          ...prev,
          profile: profileFromAuthUser(session.user),
        }));
        setReady(true);
        void hydrateInBackground(uid);
      } else {
        setData(emptyData());
        setUserId(null);
        setDataReady(true);
        setReady(true);
      }
    })();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUserId(session.user.id);
        setData((prev) => ({
          ...prev,
          profile: profileFromAuthUser(session.user),
        }));
        void hydrateInBackground(session.user.id);
      } else {
        setData(emptyData());
        setUserId(null);
        setDataReady(true);
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [hydrateInBackground]);

  const api = useMemo<StoreApi>(() => {
    const profile =
      userId && data.profile?.id === userId ? data.profile : null;
    const activeSeason = profile
      ? (data.seasons.find((s) => s.isActive) ?? null)
      : null;

    const requireUser = (): Profile => {
      if (!profile) throw new Error("Not authenticated");
      return profile;
    };

    const syncSeasonsActive = (activeId: string) => {
      setData((prev) => ({
        ...prev,
        seasons: prev.seasons.map((s) => ({
          ...s,
          isActive: s.id === activeId,
        })),
      }));
    };

    return {
      ready,
      dataReady,
      data,
      profile,
      activeSeason,

      register: async (input) => {
        if (input.password.length < 6) {
          return {
            ok: false,
            error: "Ο κωδικός πρέπει να έχει τουλάχιστον 6 χαρακτήρες.",
          };
        }
        const supabase = createClient();
        const { data: authData, error } = await supabase.auth.signUp({
          email: input.email,
          password: input.password,
          options: {
            data: {
              username: input.username,
              full_name: input.fullName,
            },
          },
        });
        if (error) {
          return { ok: false, error: authErrorMessage(error.message) };
        }
        if (!authData.session?.user) {
          return {
            ok: false,
            error:
              "Επιβεβαιώστε το email ή απενεργοποιήστε την επιβεβαίωση email στο Supabase για τοπική ανάπτυξη.",
          };
        }
        await reload(authData.session.user.id);
        return { ok: true };
      },

      login: async (input) => {
        const resolved = await resolveLoginEmail(input.usernameOrEmail);
        if (!resolved.ok) {
          return { ok: false, error: resolved.error };
        }
        const supabase = createClient();
        const { error } = await supabase.auth.signInWithPassword({
          email: resolved.email,
          password: input.password,
        });
        if (error) {
          return { ok: false, error: authErrorMessage(error.message) };
        }
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session?.user) await reload(session.user.id);
        return { ok: true };
      },

      logout: async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        setData(emptyData());
        setUserId(null);
        setDataReady(true);
      },

      saveSeason: (s) => {
        const user = requireUser();
        void (async () => {
          const supabase = createClient();
          const row = seasonToRow(user.id, s);
          if (s.id) {
            const { data: updated, error } = await supabase
              .from("seasons")
              .update(row)
              .eq("id", s.id)
              .select()
              .single();
            if (error || !updated) return;
            setData((prev) => ({
              ...prev,
              seasons: prev.seasons.map((x) =>
                x.id === s.id ? mapSeason(updated) : x,
              ),
            }));
            if (s.isActive) {
              const { data: activeRow } = await supabase.rpc("activate_season", {
                p_season_id: s.id,
              });
              if (activeRow) syncSeasonsActive(s.id);
            }
          } else {
            const { data: inserted, error } = await supabase
              .from("seasons")
              .insert(row)
              .select()
              .single();
            if (error || !inserted) return;
            setData((prev) => ({
              ...prev,
              seasons: [...prev.seasons, mapSeason(inserted)],
            }));
            if (s.isActive) {
              await supabase.rpc("activate_season", { p_season_id: inserted.id });
              syncSeasonsActive(inserted.id);
            }
          }
        })();
      },

      deleteSeason: (id) => {
        requireUser();
        setData((prev) => ({
          ...prev,
          seasons: prev.seasons.filter((s) => s.id !== id),
          harvests: prev.harvests.filter((h) => h.seasonId !== id),
          mill: prev.mill.filter((m) => m.seasonId !== id),
          oilSales: prev.oilSales.filter((s) => s.seasonId !== id),
          oliveSales: prev.oliveSales.filter((s) => s.seasonId !== id),
          transactions: prev.transactions.filter((t) => t.seasonId !== id),
          oilInventory: prev.oilInventory.filter((o) => o.seasonId !== id),
        }));
        void createClient().from("seasons").delete().eq("id", id);
      },

      activateSeason: (id) => {
        requireUser();
        void (async () => {
          const supabase = createClient();
          const { data: row, error } = await supabase.rpc("activate_season", {
            p_season_id: id,
          });
          if (error || !row) return;
          syncSeasonsActive(id);
        })();
      },

      saveField: (f) => {
        const user = requireUser();
        void (async () => {
          const supabase = createClient();
          const row = fieldToRow(user.id, f);
          if (f.id) {
            const { data: updated, error } = await supabase
              .from("fields")
              .update(row)
              .eq("id", f.id)
              .select()
              .single();
            if (error || !updated) return;
            setData((prev) => ({
              ...prev,
              fields: prev.fields.map((x) =>
                x.id === f.id ? mapField(updated) : x,
              ),
            }));
          } else {
            const { data: inserted, error } = await supabase
              .from("fields")
              .insert(row)
              .select()
              .single();
            if (error || !inserted) return;
            setData((prev) => ({
              ...prev,
              fields: [...prev.fields, mapField(inserted)],
            }));
          }
        })();
      },

      deleteField: (id) => {
        requireUser();
        setData((prev) => ({
          ...prev,
          fields: prev.fields.filter((f) => f.id !== id),
          harvests: prev.harvests.filter((h) => h.fieldId !== id),
        }));
        void createClient().from("fields").delete().eq("id", id);
      },

      saveHarvest: (h) => {
        const user = requireUser();
        void (async () => {
          const supabase = createClient();
          const row = harvestToRow(user.id, h);
          if (h.id) {
            const { data: updated, error } = await supabase
              .from("harvests")
              .update(row)
              .eq("id", h.id)
              .select()
              .single();
            if (error || !updated) return;
            setData((prev) => ({
              ...prev,
              harvests: prev.harvests.map((x) =>
                x.id === h.id ? mapHarvest(updated) : x,
              ),
            }));
          } else {
            const { data: inserted, error } = await supabase
              .from("harvests")
              .insert(row)
              .select()
              .single();
            if (error || !inserted) return;
            setData((prev) => ({
              ...prev,
              harvests: [...prev.harvests, mapHarvest(inserted)],
            }));
          }
        })();
      },

      deleteHarvest: (id) => {
        requireUser();
        setData((prev) => ({
          ...prev,
          harvests: prev.harvests.filter((h) => h.id !== id),
        }));
        void createClient().from("harvests").delete().eq("id", id);
      },

      saveMill: (m) => {
        const user = requireUser();
        void (async () => {
          const supabase = createClient();
          const row = millToRow(user.id, m);
          if (m.id) {
            const { data: updated, error } = await supabase
              .from("mill_processing")
              .update(row)
              .eq("id", m.id)
              .select()
              .single();
            if (error || !updated) return;
            setData((prev) => ({
              ...prev,
              mill: prev.mill.map((x) =>
                x.id === m.id ? mapMill(updated) : x,
              ),
            }));
          } else {
            const { data: inserted, error } = await supabase
              .from("mill_processing")
              .insert(row)
              .select()
              .single();
            if (error || !inserted) return;
            setData((prev) => ({
              ...prev,
              mill: [...prev.mill, mapMill(inserted)],
            }));
          }
        })();
      },

      deleteMill: (id) => {
        requireUser();
        setData((prev) => ({
          ...prev,
          mill: prev.mill.filter((m) => m.id !== id),
        }));
        void createClient().from("mill_processing").delete().eq("id", id);
      },

      saveCustomer: (c) => {
        const user = requireUser();
        void (async () => {
          const supabase = createClient();
          const row = customerToRow(user.id, c);
          if (c.id) {
            const { data: updated, error } = await supabase
              .from("customers")
              .update(row)
              .eq("id", c.id)
              .select()
              .single();
            if (error || !updated) return;
            setData((prev) => ({
              ...prev,
              customers: prev.customers.map((x) =>
                x.id === c.id ? mapCustomer(updated) : x,
              ),
            }));
          } else {
            const { data: inserted, error } = await supabase
              .from("customers")
              .insert(row)
              .select()
              .single();
            if (error || !inserted) return;
            setData((prev) => ({
              ...prev,
              customers: [...prev.customers, mapCustomer(inserted)],
            }));
          }
        })();
      },

      deleteCustomer: (id) => {
        requireUser();
        setData((prev) => ({
          ...prev,
          customers: prev.customers.filter((c) => c.id !== id),
          oilSales: prev.oilSales.map((s) =>
            s.customerId === id ? { ...s, customerId: null } : s,
          ),
          oliveSales: prev.oliveSales.map((s) =>
            s.customerId === id ? { ...s, customerId: null } : s,
          ),
        }));
        void createClient().from("customers").delete().eq("id", id);
      },

      searchCustomers: (q) => searchCustomersList(data.customers, q),

      saveOilSale: (s) => {
        const user = requireUser();
        void (async () => {
          const supabase = createClient();
          const row = oilSaleToRow(user.id, s);
          if (s.id) {
            const { data: updated, error } = await supabase
              .from("oil_sales")
              .update(row)
              .eq("id", s.id)
              .select()
              .single();
            if (error || !updated) return;
            setData((prev) => ({
              ...prev,
              oilSales: prev.oilSales.map((x) =>
                x.id === s.id ? mapOilSale(updated) : x,
              ),
            }));
          } else {
            const { data: inserted, error } = await supabase
              .from("oil_sales")
              .insert(row)
              .select()
              .single();
            if (error || !inserted) return;
            setData((prev) => ({
              ...prev,
              oilSales: [...prev.oilSales, mapOilSale(inserted)],
            }));
          }
        })();
      },

      updateOilSaleStatus: (id, patch) => {
        requireUser();
        setData((prev) => ({
          ...prev,
          oilSales: prev.oilSales.map((s) =>
            s.id === id ? { ...s, ...patch } : s,
          ),
        }));
        void createClient()
          .from("oil_sales")
          .update(patch)
          .eq("id", id);
      },

      deleteOilSale: (id) => {
        requireUser();
        setData((prev) => ({
          ...prev,
          oilSales: prev.oilSales.filter((s) => s.id !== id),
        }));
        void createClient().from("oil_sales").delete().eq("id", id);
      },

      saveOliveSale: (s) => {
        const user = requireUser();
        void (async () => {
          const supabase = createClient();
          const row = oliveSaleToRow(user.id, s);
          if (s.id) {
            const { data: updated, error } = await supabase
              .from("olive_sales")
              .update(row)
              .eq("id", s.id)
              .select()
              .single();
            if (error || !updated) return;
            setData((prev) => ({
              ...prev,
              oliveSales: prev.oliveSales.map((x) =>
                x.id === s.id ? mapOliveSale(updated) : x,
              ),
            }));
          } else {
            const { data: inserted, error } = await supabase
              .from("olive_sales")
              .insert(row)
              .select()
              .single();
            if (error || !inserted) return;
            setData((prev) => ({
              ...prev,
              oliveSales: [...prev.oliveSales, mapOliveSale(inserted)],
            }));
          }
        })();
      },

      updateOliveSaleStatus: (id, patch) => {
        requireUser();
        setData((prev) => ({
          ...prev,
          oliveSales: prev.oliveSales.map((s) =>
            s.id === id ? { ...s, ...patch } : s,
          ),
        }));
        void createClient()
          .from("olive_sales")
          .update(patch)
          .eq("id", id);
      },

      deleteOliveSale: (id) => {
        requireUser();
        setData((prev) => ({
          ...prev,
          oliveSales: prev.oliveSales.filter((s) => s.id !== id),
        }));
        void createClient().from("olive_sales").delete().eq("id", id);
      },

      saveTx: (t) => {
        const user = requireUser();
        void (async () => {
          const supabase = createClient();
          const row = txToRow(user.id, t);
          if (t.id) {
            const { data: updated, error } = await supabase
              .from("transactions")
              .update(row)
              .eq("id", t.id)
              .select()
              .single();
            if (error || !updated) return;
            setData((prev) => ({
              ...prev,
              transactions: prev.transactions.map((x) =>
                x.id === t.id ? mapTx(updated) : x,
              ),
            }));
          } else {
            const { data: inserted, error } = await supabase
              .from("transactions")
              .insert(row)
              .select()
              .single();
            if (error || !inserted) return;
            setData((prev) => ({
              ...prev,
              transactions: [...prev.transactions, mapTx(inserted)],
            }));
          }
        })();
      },

      deleteTx: (id) => {
        requireUser();
        setData((prev) => ({
          ...prev,
          transactions: prev.transactions.filter((t) => t.id !== id),
        }));
        void createClient().from("transactions").delete().eq("id", id);
      },

      saveOilInventory: (row) => {
        const user = requireUser();
        void (async () => {
          const supabase = createClient();
          const dbRow = oilInventoryToRow(user.id, row);
          if (row.id) {
            const { data: updated, error } = await supabase
              .from("oil_inventory")
              .update(dbRow)
              .eq("id", row.id)
              .select()
              .single();
            if (error || !updated) return;
            setData((prev) => ({
              ...prev,
              oilInventory: prev.oilInventory.map((x) =>
                x.id === row.id ? mapOilInventory(updated) : x,
              ),
            }));
          } else {
            const { data: inserted, error } = await supabase
              .from("oil_inventory")
              .insert(dbRow)
              .select()
              .single();
            if (error || !inserted) return;
            setData((prev) => ({
              ...prev,
              oilInventory: [...prev.oilInventory, mapOilInventory(inserted)],
            }));
          }
        })();
      },

      deleteOilInventory: (id) => {
        requireUser();
        setData((prev) => ({
          ...prev,
          oilInventory: prev.oilInventory.filter((o) => o.id !== id),
        }));
        void createClient().from("oil_inventory").delete().eq("id", id);
      },

      dashboardStats: (seasonId) => computeDashboardStats(data, seasonId),
      harvestsByField: (seasonId) => computeHarvestsByField(data, seasonId),
      oilYieldBySeason: () => computeOilYieldBySeason(data),
      fieldCratesBySeason: () => computeFieldCratesBySeason(data),
    };
  }, [data, dataReady, ready, reload, userId]);

  return <StoreContextProvider value={api}>{children}</StoreContextProvider>;
}
