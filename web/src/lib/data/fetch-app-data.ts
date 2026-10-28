import {
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
} from "@/lib/data/mappers";
import { createClient } from "@/lib/supabase/client";
import type { AppData, Profile } from "@/lib/types";
import type { User } from "@supabase/supabase-js";

export function profileFromAuthUser(user: User): Profile {
  const meta = user.user_metadata ?? {};
  return {
    id: user.id,
    username: String(meta.username ?? user.email?.split("@")[0] ?? "user"),
    fullName: String(meta.full_name ?? meta.fullName ?? ""),
    email: user.email ?? "",
  };
}

export async function fetchCoreAppData(
  userId: string,
): Promise<Pick<AppData, "profile" | "seasons">> {
  const supabase = createClient();
  const [profileRes, seasonsRes] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
    supabase
      .from("seasons")
      .select("*")
      .eq("user_id", userId)
      .order("created_at"),
  ]);

  return {
    profile: profileRes.data ? mapProfile(profileRes.data) : null,
    seasons: (seasonsRes.data ?? []).map(mapSeason),
  };
}

export async function fetchRemainingAppData(
  userId: string,
): Promise<
  Pick<
    AppData,
    | "fields"
    | "harvests"
    | "mill"
    | "oilInventory"
    | "customers"
    | "oilSales"
    | "oliveSales"
    | "transactions"
  >
> {
  const supabase = createClient();
  const [
    fieldsRes,
    harvestsRes,
    millRes,
    oilInvRes,
    customersRes,
    oilSalesRes,
    oliveSalesRes,
    txsRes,
  ] = await Promise.all([
    supabase.from("fields").select("*").eq("user_id", userId),
    supabase.from("harvests").select("*").eq("user_id", userId),
    supabase.from("mill_processing").select("*").eq("user_id", userId),
    supabase.from("oil_inventory").select("*").eq("user_id", userId),
    supabase.from("customers").select("*").eq("user_id", userId),
    supabase.from("oil_sales").select("*").eq("user_id", userId),
    supabase.from("olive_sales").select("*").eq("user_id", userId),
    supabase.from("transactions").select("*").eq("user_id", userId),
  ]);

  return {
    fields: (fieldsRes.data ?? []).map(mapField),
    harvests: (harvestsRes.data ?? []).map(mapHarvest),
    mill: (millRes.data ?? []).map(mapMill),
    oilInventory: (oilInvRes.data ?? []).map(mapOilInventory),
    customers: (customersRes.data ?? []).map(mapCustomer),
    oilSales: (oilSalesRes.data ?? []).map(mapOilSale),
    oliveSales: (oliveSalesRes.data ?? []).map(mapOliveSale),
    transactions: (txsRes.data ?? []).map(mapTx),
  };
}

export async function fetchFullAppData(userId: string): Promise<AppData> {
  const [core, rest] = await Promise.all([
    fetchCoreAppData(userId),
    fetchRemainingAppData(userId),
  ]);
  return { ...core, ...rest };
}
