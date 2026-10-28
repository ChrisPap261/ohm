export type Profile = {
  id: string;
  username: string;
  fullName: string;
  email: string;
};

export type Season = {
  id: string;
  userId: string;
  name: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  createdAt: string;
};

export type Field = {
  id: string;
  userId: string;
  name: string;
  location: string;
  area: number | null;
  treeCount: number | null;
};

export type Harvest = {
  id: string;
  userId: string;
  fieldId: string;
  seasonId: string;
  harvestDate: string;
  crates: number;
  olivesKg: number;
  notes: string;
};

export type MillProcessing = {
  id: string;
  userId: string;
  seasonId: string;
  processingDate: string;
  crates: number | null;
  olivesKg: number;
  oilKg: number;
  expenses: number;
  notes: string;
};

export type OilInventory = {
  id: string;
  userId: string;
  seasonId: string;
  inventoryDate: string;
  oilKg: number;
  notes: string;
};

export type Customer = {
  id: string;
  userId: string;
  name: string;
  phone: string;
};

export type OilSale = {
  id: string;
  userId: string;
  seasonId: string;
  customerId: string | null;
  saleDate: string;
  oilLiters: number;
  pricePerLiter: number;
  totalAmount: number;
  buyer: string;
  notes: string;
  delivered: boolean;
  paid: boolean;
};

export type OliveSale = {
  id: string;
  userId: string;
  seasonId: string;
  customerId: string | null;
  saleDate: string;
  olivesKg: number;
  pricePerKg: number;
  totalAmount: number;
  buyer: string;
  notes: string;
  delivered: boolean;
  paid: boolean;
};

export type TransactionType = "income" | "expense" | "donation";

export type Tx = {
  id: string;
  userId: string;
  seasonId: string;
  type: TransactionType;
  category: string;
  transactionDate: string;
  description: string;
  amount: number;
  notes: string;
};

export type AppData = {
  profile: Profile | null;
  seasons: Season[];
  fields: Field[];
  harvests: Harvest[];
  mill: MillProcessing[];
  oilInventory: OilInventory[];
  customers: Customer[];
  oilSales: OilSale[];
  oliveSales: OliveSale[];
  transactions: Tx[];
};
