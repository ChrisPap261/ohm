"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { v4 as uuid } from "uuid";
import {
  computeDashboardStats,
  computeFieldCratesBySeason,
  computeHarvestsByField,
  computeOilYieldBySeason,
  searchCustomersList,
} from "@/lib/data/stats";
import { StoreContextProvider } from "@/lib/data/context";
import { emptyData, type StoreApi } from "@/lib/data/types";
import type { AppData, Profile } from "@/lib/types";

const STORAGE_KEY = "ohm-next-data-v1";
const SESSION_KEY = "ohm-next-session";

type Creds = Record<string, string>;

function seedFor(profile: Profile): AppData {
  const seasonId = uuid();
  const fieldId = uuid();
  const customerId = uuid();
  return {
    profile,
    seasons: [
      {
        id: seasonId,
        userId: profile.id,
        name: "2025-26",
        startDate: "2025-10-01",
        endDate: "2026-03-31",
        isActive: true,
        createdAt: new Date().toISOString(),
      },
    ],
    fields: [
      {
        id: fieldId,
        userId: profile.id,
        name: "Κάτω Αμπέλι",
        location: "Λακωνία",
        area: 12000,
        treeCount: 180,
      },
    ],
    harvests: [
      {
        id: uuid(),
        userId: profile.id,
        fieldId,
        seasonId,
        harvestDate: "2025-11-12",
        crates: 40,
        olivesKg: 900,
        notes: "",
      },
    ],
    mill: [
      {
        id: uuid(),
        userId: profile.id,
        seasonId,
        processingDate: "2025-11-14",
        crates: 40,
        olivesKg: 900,
        oilKg: 160,
        expenses: 8500,
        notes: "",
      },
    ],
    oilInventory: [],
    customers: [
      {
        id: customerId,
        userId: profile.id,
        name: "Νίκος Παπαδόπουλος",
        phone: "6900000000",
      },
    ],
    oilSales: [
      {
        id: uuid(),
        userId: profile.id,
        seasonId,
        customerId,
        saleDate: "2025-12-01",
        oilLiters: 22,
        pricePerLiter: 900,
        totalAmount: 19800,
        buyer: "Νίκος Παπαδόπουλος",
        notes: "",
        delivered: true,
        paid: false,
      },
    ],
    oliveSales: [],
    transactions: [
      {
        id: uuid(),
        userId: profile.id,
        seasonId,
        type: "expense",
        category: "",
        transactionDate: "2025-11-01",
        description: "Εργατικά συγκομιδής",
        amount: 25000,
        notes: "",
      },
    ],
  };
}

export function LocalStoreProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [data, setData] = useState<AppData>(emptyData);
  const [creds, setCreds] = useState<Creds>({});
  const [sessionUserId, setSessionUserId] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as { data: AppData; creds: Creds };
        setData(parsed.data ?? emptyData());
        setCreds(parsed.creds ?? {});
      }
      const sid = sessionStorage.getItem(SESSION_KEY);
      if (sid) setSessionUserId(sid);
    } catch {
      /* ignore corrupt storage */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ data, creds }));
  }, [data, creds, ready]);

  const api = useMemo<StoreApi>(() => {
    const loggedIn =
      !!sessionUserId && !!data.profile && data.profile.id === sessionUserId;
    const profile = loggedIn ? data.profile : null;
    const activeSeason = loggedIn
      ? (data.seasons.find((s) => s.isActive) ?? null)
      : null;

    const requireUser = () => {
      if (!profile) throw new Error("Not authenticated");
      return profile;
    };

    return {
      ready,
      dataReady: true,
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
        const u = input.username.toLowerCase();
        const e = input.email.toLowerCase();
        if (creds[u] || creds[e]) {
          return {
            ok: false,
            error: "Το όνομα χρήστη ή το email χρησιμοποιείται ήδη.",
          };
        }
        const nextProfile: Profile = {
          id: uuid(),
          username: input.username,
          fullName: input.fullName,
          email: input.email,
        };
        setCreds({ ...creds, [u]: input.password, [e]: input.password });
        setData(seedFor(nextProfile));
        setSessionUserId(nextProfile.id);
        sessionStorage.setItem(SESSION_KEY, nextProfile.id);
        return { ok: true };
      },

      login: async (input) => {
        const key = input.usernameOrEmail.toLowerCase();
        if (!creds[key] || creds[key] !== input.password) {
          return { ok: false, error: "Λάθος στοιχεία σύνδεσης." };
        }
        if (!data.profile) {
          return { ok: false, error: "Δεν βρέθηκε λογαριασμός." };
        }
        setSessionUserId(data.profile.id);
        sessionStorage.setItem(SESSION_KEY, data.profile.id);
        return { ok: true };
      },

      logout: async () => {
        sessionStorage.removeItem(SESSION_KEY);
        setSessionUserId(null);
      },

      saveSeason: (s) => {
        const user = requireUser();
        setData((prev) => {
          let seasons = [...prev.seasons];
          let id = s.id;
          if (id) {
            seasons = seasons.map((x) =>
              x.id === id ? { ...x, ...s, userId: user.id } : x,
            );
          } else {
            id = uuid();
            seasons.push({
              id,
              userId: user.id,
              name: s.name,
              startDate: s.startDate,
              endDate: s.endDate,
              isActive: !!s.isActive,
              createdAt: new Date().toISOString(),
            });
          }
          if (s.isActive) {
            seasons = seasons.map((x) => ({ ...x, isActive: x.id === id }));
          }
          return { ...prev, seasons };
        });
      },

      deleteSeason: (id) => {
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
      },

      activateSeason: (id) => {
        setData((prev) => ({
          ...prev,
          seasons: prev.seasons.map((s) => ({ ...s, isActive: s.id === id })),
        }));
      },

      saveField: (f) => {
        const user = requireUser();
        setData((prev) => {
          if (f.id) {
            return {
              ...prev,
              fields: prev.fields.map((x) =>
                x.id === f.id ? { ...x, ...f, userId: user.id } : x,
              ),
            };
          }
          return {
            ...prev,
            fields: [
              ...prev.fields,
              {
                id: uuid(),
                userId: user.id,
                name: f.name,
                location: f.location,
                area: f.area,
                treeCount: f.treeCount,
              },
            ],
          };
        });
      },

      deleteField: (id) => {
        setData((prev) => ({
          ...prev,
          fields: prev.fields.filter((f) => f.id !== id),
          harvests: prev.harvests.filter((h) => h.fieldId !== id),
        }));
      },

      saveHarvest: (h) => {
        const user = requireUser();
        setData((prev) => {
          if (h.id) {
            return {
              ...prev,
              harvests: prev.harvests.map((x) =>
                x.id === h.id ? { ...x, ...h, userId: user.id } : x,
              ),
            };
          }
          return {
            ...prev,
            harvests: [...prev.harvests, { ...h, id: uuid(), userId: user.id }],
          };
        });
      },

      deleteHarvest: (id) => {
        setData((prev) => ({
          ...prev,
          harvests: prev.harvests.filter((h) => h.id !== id),
        }));
      },

      saveMill: (m) => {
        const user = requireUser();
        setData((prev) => {
          if (m.id) {
            return {
              ...prev,
              mill: prev.mill.map((x) =>
                x.id === m.id ? { ...x, ...m, userId: user.id } : x,
              ),
            };
          }
          return {
            ...prev,
            mill: [...prev.mill, { ...m, id: uuid(), userId: user.id }],
          };
        });
      },

      deleteMill: (id) => {
        setData((prev) => ({
          ...prev,
          mill: prev.mill.filter((m) => m.id !== id),
        }));
      },

      saveCustomer: (c) => {
        const user = requireUser();
        setData((prev) => {
          if (c.id) {
            return {
              ...prev,
              customers: prev.customers.map((x) =>
                x.id === c.id ? { ...x, ...c, userId: user.id } : x,
              ),
            };
          }
          return {
            ...prev,
            customers: [
              ...prev.customers,
              {
                id: uuid(),
                userId: user.id,
                name: c.name,
                phone: c.phone,
              },
            ],
          };
        });
      },

      deleteCustomer: (id) => {
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
      },

      searchCustomers: (q) => searchCustomersList(data.customers, q),

      saveOilSale: (s) => {
        const user = requireUser();
        setData((prev) => {
          if (s.id) {
            return {
              ...prev,
              oilSales: prev.oilSales.map((x) =>
                x.id === s.id ? { ...x, ...s, userId: user.id } : x,
              ),
            };
          }
          return {
            ...prev,
            oilSales: [...prev.oilSales, { ...s, id: uuid(), userId: user.id }],
          };
        });
      },

      updateOilSaleStatus: (id, patch) => {
        setData((prev) => ({
          ...prev,
          oilSales: prev.oilSales.map((s) =>
            s.id === id ? { ...s, ...patch } : s,
          ),
        }));
      },

      deleteOilSale: (id) => {
        setData((prev) => ({
          ...prev,
          oilSales: prev.oilSales.filter((s) => s.id !== id),
        }));
      },

      saveOliveSale: (s) => {
        const user = requireUser();
        setData((prev) => {
          if (s.id) {
            return {
              ...prev,
              oliveSales: prev.oliveSales.map((x) =>
                x.id === s.id ? { ...x, ...s, userId: user.id } : x,
              ),
            };
          }
          return {
            ...prev,
            oliveSales: [
              ...prev.oliveSales,
              { ...s, id: uuid(), userId: user.id },
            ],
          };
        });
      },

      updateOliveSaleStatus: (id, patch) => {
        setData((prev) => ({
          ...prev,
          oliveSales: prev.oliveSales.map((s) =>
            s.id === id ? { ...s, ...patch } : s,
          ),
        }));
      },

      deleteOliveSale: (id) => {
        setData((prev) => ({
          ...prev,
          oliveSales: prev.oliveSales.filter((s) => s.id !== id),
        }));
      },

      saveTx: (t) => {
        const user = requireUser();
        setData((prev) => {
          if (t.id) {
            return {
              ...prev,
              transactions: prev.transactions.map((x) =>
                x.id === t.id ? { ...x, ...t, userId: user.id } : x,
              ),
            };
          }
          return {
            ...prev,
            transactions: [
              ...prev.transactions,
              { ...t, id: uuid(), userId: user.id },
            ],
          };
        });
      },

      deleteTx: (id) => {
        setData((prev) => ({
          ...prev,
          transactions: prev.transactions.filter((t) => t.id !== id),
        }));
      },

      saveOilInventory: (row) => {
        const user = requireUser();
        setData((prev) => {
          if (row.id) {
            return {
              ...prev,
              oilInventory: prev.oilInventory.map((x) =>
                x.id === row.id ? { ...x, ...row, userId: user.id } : x,
              ),
            };
          }
          return {
            ...prev,
            oilInventory: [
              ...prev.oilInventory,
              { ...row, id: uuid(), userId: user.id },
            ],
          };
        });
      },

      deleteOilInventory: (id) => {
        setData((prev) => ({
          ...prev,
          oilInventory: prev.oilInventory.filter((o) => o.id !== id),
        }));
      },

      dashboardStats: (seasonId) => computeDashboardStats(data, seasonId),
      harvestsByField: (seasonId) => computeHarvestsByField(data, seasonId),
      oilYieldBySeason: () => computeOilYieldBySeason(data),
      fieldCratesBySeason: () => computeFieldCratesBySeason(data),
    };
  }, [creds, data, ready, sessionUserId]);

  return <StoreContextProvider value={api}>{children}</StoreContextProvider>;
}
