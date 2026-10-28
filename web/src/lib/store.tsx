"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { v4 as uuid } from "uuid";
import { oilLitersToKg } from "@/lib/domain";
import type {
  AppData,
  Customer,
  Field,
  Harvest,
  MillProcessing,
  OilInventory,
  OilSale,
  OliveSale,
  Profile,
  Season,
  Tx,
} from "@/lib/types";

const STORAGE_KEY = "ohm-next-data-v1";
const SESSION_KEY = "ohm-next-session";

const emptyData = (): AppData => ({
  profile: null,
  seasons: [],
  fields: [],
  harvests: [],
  mill: [],
  oilInventory: [],
  customers: [],
  oilSales: [],
  oliveSales: [],
  transactions: [],
});

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

export type DashboardStats = {
  harvests: { totalCrates: number; totalOlivesKg: number };
  mill: { totalOilKg: number; totalExpenses: number };
  oil: {
    totalSold: number;
    totalGivenFree: number;
    totalRevenue: number;
    remaining: number;
    remainingAllSeasons: number;
  };
  transactions: {
    totalIncome: number;
    totalExpenses: number;
    totalDonations: number;
  };
};

type Creds = Record<string, string>;

type StoreApi = {
  ready: boolean;
  data: AppData;
  profile: Profile | null;
  activeSeason: Season | null;
  register: (input: {
    fullName: string;
    username: string;
    email: string;
    password: string;
  }) => { ok: true } | { ok: false; error: string };
  login: (input: {
    usernameOrEmail: string;
    password: string;
  }) => { ok: true } | { ok: false; error: string };
  logout: () => void;
  saveSeason: (
    s: Omit<Season, "userId" | "createdAt" | "id"> & { id?: string },
  ) => void;
  deleteSeason: (id: string) => void;
  activateSeason: (id: string) => void;
  saveField: (f: Omit<Field, "userId" | "id"> & { id?: string }) => void;
  deleteField: (id: string) => void;
  saveHarvest: (h: Omit<Harvest, "userId" | "id"> & { id?: string }) => void;
  deleteHarvest: (id: string) => void;
  saveMill: (m: Omit<MillProcessing, "userId" | "id"> & { id?: string }) => void;
  deleteMill: (id: string) => void;
  saveCustomer: (c: Omit<Customer, "userId" | "id"> & { id?: string }) => void;
  deleteCustomer: (id: string) => void;
  searchCustomers: (q: string) => Customer[];
  saveOilSale: (s: Omit<OilSale, "userId" | "id"> & { id?: string }) => void;
  updateOilSaleStatus: (
    id: string,
    patch: Partial<Pick<OilSale, "delivered" | "paid">>,
  ) => void;
  deleteOilSale: (id: string) => void;
  saveOliveSale: (s: Omit<OliveSale, "userId" | "id"> & { id?: string }) => void;
  updateOliveSaleStatus: (
    id: string,
    patch: Partial<Pick<OliveSale, "delivered" | "paid">>,
  ) => void;
  deleteOliveSale: (id: string) => void;
  saveTx: (t: Omit<Tx, "userId" | "id"> & { id?: string }) => void;
  deleteTx: (id: string) => void;
  saveOilInventory: (
    row: Omit<OilInventory, "userId" | "id"> & { id?: string },
  ) => void;
  deleteOilInventory: (id: string) => void;
  dashboardStats: (seasonId: string) => DashboardStats;
  harvestsByField: (seasonId: string) => {
    id: string;
    name: string;
    totalCrates: number;
    totalOlivesKg: number;
  }[];
  oilYieldBySeason: () => {
    seasonId: string;
    seasonName: string;
    totalOlivesKg: number;
    totalOilKg: number;
    yieldPercent: number;
  }[];
  fieldCratesBySeason: () => {
    seasonId: string;
    seasonName: string;
    fieldId: string;
    fieldName: string;
    totalCrates: number;
    totalOlivesKg: number;
  }[];
};

const StoreContext = createContext<StoreApi | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
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
      data,
      profile,
      activeSeason,

      register: (input) => {
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

      login: (input) => {
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

      logout: () => {
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

      searchCustomers: (q) => {
        const needle = q.trim().toLowerCase();
        const list = data.customers;
        if (!needle) return list.slice(0, 8);
        return list
          .filter((c) => c.name.toLowerCase().includes(needle))
          .slice(0, 8);
      },

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

      dashboardStats: (seasonId) => {
        const harvests = data.harvests.filter((h) => h.seasonId === seasonId);
        const mill = data.mill.filter((m) => m.seasonId === seasonId);
        const oilSales = data.oilSales.filter((s) => s.seasonId === seasonId);
        const txs = data.transactions.filter((t) => t.seasonId === seasonId);

        const totalCrates = harvests.reduce((a, h) => a + h.crates, 0);
        const totalOlivesKg = harvests.reduce((a, h) => a + h.olivesKg, 0);
        const totalOilKg = mill.reduce((a, m) => a + m.oilKg, 0);
        const millExpenses = mill.reduce((a, m) => a + m.expenses, 0);

        const paidSales = oilSales.filter(
          (s) => s.pricePerLiter > 0 || s.totalAmount > 0,
        );
        const freeSales = oilSales.filter(
          (s) => s.pricePerLiter === 0 && s.totalAmount === 0,
        );
        const totalSold = paidSales.reduce((a, s) => a + s.oilLiters, 0);
        const totalGivenFree = freeSales.reduce((a, s) => a + s.oilLiters, 0);
        const totalRevenue = oilSales.reduce((a, s) => a + s.totalAmount, 0);

        const season = data.seasons.find((s) => s.id === seasonId);
        const previousInv = data.oilInventory
          .filter((o) => {
            const s = data.seasons.find((x) => x.id === o.seasonId);
            if (!season || !s) return false;
            return s.createdAt < season.createdAt;
          })
          .reduce((a, o) => a + o.oilKg, 0);

        const remaining =
          totalOilKg -
          oilLitersToKg(totalSold) -
          oilLitersToKg(totalGivenFree) +
          previousInv;

        const allProduced = data.mill.reduce((a, m) => a + m.oilKg, 0);
        const allSold = data.oilSales
          .filter((s) => s.pricePerLiter > 0 || s.totalAmount > 0)
          .reduce((a, s) => a + s.oilLiters, 0);
        const allFree = data.oilSales
          .filter((s) => s.pricePerLiter === 0 && s.totalAmount === 0)
          .reduce((a, s) => a + s.oilLiters, 0);

        const manualIncome = txs
          .filter((t) => t.type === "income")
          .reduce((a, t) => a + t.amount, 0);
        const manualExpense = txs
          .filter((t) => t.type === "expense")
          .reduce((a, t) => a + t.amount, 0);
        const donations = txs
          .filter((t) => t.type === "donation")
          .reduce((a, t) => a + t.amount, 0);

        return {
          harvests: { totalCrates, totalOlivesKg },
          mill: { totalOilKg, totalExpenses: millExpenses },
          oil: {
            totalSold,
            totalGivenFree,
            totalRevenue,
            remaining,
            remainingAllSeasons: Math.max(
              allProduced - oilLitersToKg(allSold) - oilLitersToKg(allFree),
              0,
            ),
          },
          transactions: {
            totalIncome: manualIncome + totalRevenue,
            totalExpenses: manualExpense + millExpenses,
            totalDonations: donations,
          },
        };
      },

      harvestsByField: (seasonId) =>
        data.fields
          .map((f) => {
            const rows = data.harvests.filter(
              (h) => h.fieldId === f.id && h.seasonId === seasonId,
            );
            return {
              id: f.id,
              name: f.name,
              totalCrates: rows.reduce((a, h) => a + h.crates, 0),
              totalOlivesKg: rows.reduce((a, h) => a + h.olivesKg, 0),
            };
          })
          .filter((r) => r.totalOlivesKg > 0)
          .sort((a, b) => b.totalOlivesKg - a.totalOlivesKg),

      oilYieldBySeason: () =>
        data.seasons
          .slice()
          .sort((a, b) => a.startDate.localeCompare(b.startDate))
          .map((s) => {
            const rows = data.mill.filter((m) => m.seasonId === s.id);
            const totalOlivesKg = rows.reduce((a, m) => a + m.olivesKg, 0);
            const totalOilKg = rows.reduce((a, m) => a + m.oilKg, 0);
            return {
              seasonId: s.id,
              seasonName: s.name,
              totalOlivesKg,
              totalOilKg,
              yieldPercent:
                totalOlivesKg > 0
                  ? Math.round((totalOilKg / totalOlivesKg) * 10000) / 100
                  : 0,
            };
          }),

      fieldCratesBySeason: () => {
        const out: {
          seasonId: string;
          seasonName: string;
          fieldId: string;
          fieldName: string;
          totalCrates: number;
          totalOlivesKg: number;
        }[] = [];
        for (const s of data.seasons) {
          for (const f of data.fields) {
            const rows = data.harvests.filter(
              (h) => h.seasonId === s.id && h.fieldId === f.id,
            );
            if (!rows.length) continue;
            out.push({
              seasonId: s.id,
              seasonName: s.name,
              fieldId: f.id,
              fieldName: f.name,
              totalCrates: rows.reduce((a, h) => a + h.crates, 0),
              totalOlivesKg: rows.reduce((a, h) => a + h.olivesKg, 0),
            });
          }
        }
        return out;
      },
    };
  }, [creds, data, ready, sessionUserId]);

  return (
    <StoreContext.Provider value={api}>{children}</StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
