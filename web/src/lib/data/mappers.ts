import type {
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

type ProfileRow = {
  id: string;
  username: string;
  full_name: string | null;
  email: string | null;
};

type SeasonRow = {
  id: string;
  user_id: string;
  name: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  created_at: string;
};

type FieldRow = {
  id: string;
  user_id: string;
  name: string;
  location: string | null;
  area: number | null;
  tree_count: number | null;
};

type HarvestRow = {
  id: string;
  user_id: string;
  field_id: string;
  season_id: string;
  harvest_date: string;
  crates: number;
  olives_kg: number;
  notes: string | null;
};

type MillRow = {
  id: string;
  user_id: string;
  season_id: string;
  processing_date: string;
  crates: number | null;
  olives_kg: number;
  oil_kg: number;
  expenses: number;
  notes: string | null;
};

type OilInventoryRow = {
  id: string;
  user_id: string;
  season_id: string;
  inventory_date: string;
  oil_kg: number;
  notes: string | null;
};

type CustomerRow = {
  id: string;
  user_id: string;
  name: string;
  phone: string | null;
};

type OilSaleRow = {
  id: string;
  user_id: string;
  season_id: string;
  customer_id: string | null;
  sale_date: string;
  oil_liters: number;
  price_per_liter: number;
  total_amount: number;
  buyer: string | null;
  notes: string | null;
  delivered: boolean;
  paid: boolean;
};

type OliveSaleRow = {
  id: string;
  user_id: string;
  season_id: string;
  customer_id: string | null;
  sale_date: string;
  olives_kg: number;
  price_per_kg: number;
  total_amount: number;
  buyer: string | null;
  notes: string | null;
  delivered: boolean;
  paid: boolean;
};

type TxRow = {
  id: string;
  user_id: string;
  season_id: string;
  type: string;
  category: string | null;
  transaction_date: string;
  description: string;
  amount: number;
  notes: string | null;
};

export function mapProfile(row: ProfileRow): Profile {
  return {
    id: row.id,
    username: row.username,
    fullName: row.full_name ?? "",
    email: row.email ?? "",
  };
}

export function mapSeason(row: SeasonRow): Season {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    startDate: row.start_date,
    endDate: row.end_date,
    isActive: row.is_active,
    createdAt: row.created_at,
  };
}

export function mapField(row: FieldRow): Field {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    location: row.location ?? "",
    area: row.area,
    treeCount: row.tree_count,
  };
}

export function mapHarvest(row: HarvestRow): Harvest {
  return {
    id: row.id,
    userId: row.user_id,
    fieldId: row.field_id,
    seasonId: row.season_id,
    harvestDate: row.harvest_date,
    crates: row.crates,
    olivesKg: row.olives_kg,
    notes: row.notes ?? "",
  };
}

export function mapMill(row: MillRow): MillProcessing {
  return {
    id: row.id,
    userId: row.user_id,
    seasonId: row.season_id,
    processingDate: row.processing_date,
    crates: row.crates,
    olivesKg: row.olives_kg,
    oilKg: row.oil_kg,
    expenses: row.expenses,
    notes: row.notes ?? "",
  };
}

export function mapOilInventory(row: OilInventoryRow): OilInventory {
  return {
    id: row.id,
    userId: row.user_id,
    seasonId: row.season_id,
    inventoryDate: row.inventory_date,
    oilKg: row.oil_kg,
    notes: row.notes ?? "",
  };
}

export function mapCustomer(row: CustomerRow): Customer {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    phone: row.phone ?? "",
  };
}

export function mapOilSale(row: OilSaleRow): OilSale {
  return {
    id: row.id,
    userId: row.user_id,
    seasonId: row.season_id,
    customerId: row.customer_id,
    saleDate: row.sale_date,
    oilLiters: row.oil_liters,
    pricePerLiter: row.price_per_liter,
    totalAmount: row.total_amount,
    buyer: row.buyer ?? "",
    notes: row.notes ?? "",
    delivered: row.delivered,
    paid: row.paid,
  };
}

export function mapOliveSale(row: OliveSaleRow): OliveSale {
  return {
    id: row.id,
    userId: row.user_id,
    seasonId: row.season_id,
    customerId: row.customer_id,
    saleDate: row.sale_date,
    olivesKg: row.olives_kg,
    pricePerKg: row.price_per_kg,
    totalAmount: row.total_amount,
    buyer: row.buyer ?? "",
    notes: row.notes ?? "",
    delivered: row.delivered,
    paid: row.paid,
  };
}

export function mapTx(row: TxRow): Tx {
  return {
    id: row.id,
    userId: row.user_id,
    seasonId: row.season_id,
    type: row.type as Tx["type"],
    category: row.category ?? "",
    transactionDate: row.transaction_date,
    description: row.description,
    amount: row.amount,
    notes: row.notes ?? "",
  };
}

export function seasonToRow(
  userId: string,
  s: Omit<Season, "userId" | "createdAt" | "id"> & { id?: string },
) {
  return {
    ...(s.id ? { id: s.id } : {}),
    user_id: userId,
    name: s.name,
    start_date: s.startDate,
    end_date: s.endDate,
    is_active: s.isActive,
  };
}

export function fieldToRow(
  userId: string,
  f: Omit<Field, "userId" | "id"> & { id?: string },
) {
  return {
    ...(f.id ? { id: f.id } : {}),
    user_id: userId,
    name: f.name,
    location: f.location || null,
    area: f.area,
    tree_count: f.treeCount,
  };
}

export function harvestToRow(
  userId: string,
  h: Omit<Harvest, "userId" | "id"> & { id?: string },
) {
  return {
    ...(h.id ? { id: h.id } : {}),
    user_id: userId,
    field_id: h.fieldId,
    season_id: h.seasonId,
    harvest_date: h.harvestDate,
    crates: h.crates,
    olives_kg: h.olivesKg,
    notes: h.notes || null,
  };
}

export function millToRow(
  userId: string,
  m: Omit<MillProcessing, "userId" | "id"> & { id?: string },
) {
  return {
    ...(m.id ? { id: m.id } : {}),
    user_id: userId,
    season_id: m.seasonId,
    processing_date: m.processingDate,
    crates: m.crates,
    olives_kg: m.olivesKg,
    oil_kg: m.oilKg,
    expenses: m.expenses,
    notes: m.notes || null,
  };
}

export function oilInventoryToRow(
  userId: string,
  row: Omit<OilInventory, "userId" | "id"> & { id?: string },
) {
  return {
    ...(row.id ? { id: row.id } : {}),
    user_id: userId,
    season_id: row.seasonId,
    inventory_date: row.inventoryDate,
    oil_kg: row.oilKg,
    notes: row.notes || null,
  };
}

export function customerToRow(
  userId: string,
  c: Omit<Customer, "userId" | "id"> & { id?: string },
) {
  return {
    ...(c.id ? { id: c.id } : {}),
    user_id: userId,
    name: c.name,
    phone: c.phone || null,
  };
}

export function oilSaleToRow(
  userId: string,
  s: Omit<OilSale, "userId" | "id"> & { id?: string },
) {
  return {
    ...(s.id ? { id: s.id } : {}),
    user_id: userId,
    season_id: s.seasonId,
    customer_id: s.customerId,
    sale_date: s.saleDate,
    oil_liters: s.oilLiters,
    price_per_liter: s.pricePerLiter,
    total_amount: s.totalAmount,
    buyer: s.buyer || null,
    notes: s.notes || null,
    delivered: s.delivered,
    paid: s.paid,
  };
}

export function oliveSaleToRow(
  userId: string,
  s: Omit<OliveSale, "userId" | "id"> & { id?: string },
) {
  return {
    ...(s.id ? { id: s.id } : {}),
    user_id: userId,
    season_id: s.seasonId,
    customer_id: s.customerId,
    sale_date: s.saleDate,
    olives_kg: s.olivesKg,
    price_per_kg: s.pricePerKg,
    total_amount: s.totalAmount,
    buyer: s.buyer || null,
    notes: s.notes || null,
    delivered: s.delivered,
    paid: s.paid,
  };
}

export function txToRow(userId: string, t: Omit<Tx, "userId" | "id"> & { id?: string }) {
  return {
    ...(t.id ? { id: t.id } : {}),
    user_id: userId,
    season_id: t.seasonId,
    type: t.type,
    category: t.category || null,
    transaction_date: t.transactionDate,
    description: t.description,
    amount: t.amount,
    notes: t.notes || null,
  };
}
