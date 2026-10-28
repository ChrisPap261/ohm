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

export type AuthResult = { ok: true } | { ok: false; error: string };

export type StoreApi = {
  /** Auth/session resolved (safe to show shell or auth pages). */
  ready: boolean;
  /** Full app dataset loaded (Supabase background fetch complete). */
  dataReady: boolean;
  data: AppData;
  profile: Profile | null;
  activeSeason: Season | null;
  register: (input: {
    fullName: string;
    username: string;
    email: string;
    password: string;
  }) => Promise<AuthResult>;
  login: (input: {
    usernameOrEmail: string;
    password: string;
  }) => Promise<AuthResult>;
  logout: () => Promise<void>;
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

export const emptyData = (): AppData => ({
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
