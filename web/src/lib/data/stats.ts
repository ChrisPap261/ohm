import { oilLitersToKg } from "@/lib/domain";
import type { AppData } from "@/lib/types";
import type { DashboardStats } from "@/lib/data/types";

export function computeDashboardStats(
  data: AppData,
  seasonId: string,
): DashboardStats {
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
}

export function computeHarvestsByField(data: AppData, seasonId: string) {
  return data.fields
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
    .sort((a, b) => b.totalOlivesKg - a.totalOlivesKg);
}

export function computeOilYieldBySeason(data: AppData) {
  return data.seasons
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
    });
}

export function computeFieldCratesBySeason(data: AppData) {
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
}

export function searchCustomersList(
  customers: AppData["customers"],
  q: string,
) {
  const needle = q.trim().toLowerCase();
  const list = customers;
  if (!needle) return list.slice(0, 8);
  return list
    .filter((c) => c.name.toLowerCase().includes(needle))
    .slice(0, 8);
}
