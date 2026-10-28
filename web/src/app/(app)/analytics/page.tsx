"use client";

import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { PageHeader, Panel } from "@/components/ui/page-header";
import { Select } from "@/components/ui/field";
import { EmptyState } from "@/components/ui/page-header";
import { NoSeasonState } from "@/components/shell/no-season";
import { oilKgToLiters } from "@/lib/domain";
import { useStore } from "@/lib/store";

export default function AnalyticsPage() {
  const { data, oilYieldBySeason, fieldCratesBySeason } = useStore();
  const [fieldId, setFieldId] = useState("all");

  const yieldRows = useMemo(() => oilYieldBySeason(), [oilYieldBySeason]);
  const crateRows = useMemo(() => {
    const all = fieldCratesBySeason();
    if (fieldId === "all") {
      const bySeason = new Map<
        string,
        { seasonName: string; totalCrates: number; totalOlivesKg: number }
      >();
      for (const row of all) {
        const cur = bySeason.get(row.seasonId) ?? {
          seasonName: row.seasonName,
          totalCrates: 0,
          totalOlivesKg: 0,
        };
        cur.totalCrates += row.totalCrates;
        cur.totalOlivesKg += row.totalOlivesKg;
        bySeason.set(row.seasonId, cur);
      }
      return [...bySeason.entries()]
        .map(([seasonId, v]) => ({
          seasonId,
          seasonName: v.seasonName,
          totalCrates: v.totalCrates,
          totalOlivesKg: v.totalOlivesKg,
        }))
        .sort((a, b) => a.seasonName.localeCompare(b.seasonName));
    }
    return all
      .filter((r) => r.fieldId === fieldId)
      .map((r) => ({
        seasonId: r.seasonId,
        seasonName: r.seasonName,
        totalCrates: r.totalCrates,
        totalOlivesKg: r.totalOlivesKg,
      }))
      .sort((a, b) => a.seasonName.localeCompare(b.seasonName));
  }, [fieldCratesBySeason, fieldId]);

  const yieldChart = yieldRows.map((r) => ({
    name: r.seasonName,
    oilKg: r.totalOilKg,
    oilLiters: oilKgToLiters(r.totalOilKg),
    yieldPercent: r.yieldPercent,
    olivesKg: r.totalOlivesKg,
  }));

  if (data.seasons.length === 0) {
    return (
      <>
        <PageHeader title="Αναλύσεις" />
        <NoSeasonState />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Αναλύσεις"
        description="Σύγκριση αποδόσεων και συγκομιδής ανά περίοδο"
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel className="p-5">
          <h2 className="mb-1 font-semibold">Απόδοση ελαιοτριβείου</h2>
          <p className="mb-4 text-sm text-[var(--color-text-muted)]">
            Παραγωγή λαδιού (kg) και ποσοστό απόδοσης ανά περίοδο
          </p>
          {yieldChart.every((r) => r.oilKg === 0) ? (
            <EmptyState message="Δεν υπάρχουν δεδομένα ελαιοτριβείου για γραφήματα." />
          ) : (
            <div className="h-[300px]" aria-hidden>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={yieldChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    formatter={(value, key) => {
                      if (key === "oilKg") return [`${value} kg`, "Λάδι"];
                      if (key === "yieldPercent") return [`${value} %`, "Απόδοση"];
                      return [value, key];
                    }}
                  />
                  <Bar dataKey="oilKg" name="Λάδι (kg)" fill="var(--color-accent)" radius={6} />
                  <Bar dataKey="yieldPercent" name="Απόδοση %" fill="var(--color-success)" radius={6} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Panel>

        <Panel className="p-5">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="mb-1 font-semibold">Τελάρα συγκομιδής</h2>
              <p className="text-sm text-[var(--color-text-muted)]">Ανά περίοδο · φίλτρο αγροτεμαχίου</p>
            </div>
            <Select
              aria-label="Αγροτεμάχιο"
              value={fieldId}
              onChange={(e) => setFieldId(e.target.value)}
              className="w-auto min-w-[180px]"
            >
              <option value="all">Όλα τα αγροτεμάχια</option>
              {data.fields.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </Select>
          </div>
          {crateRows.length === 0 ? (
            <EmptyState message="Δεν βρέθηκαν συγκομιδές για το επιλεγμένο φίλτρο." />
          ) : (
            <div className="h-[300px]" aria-hidden>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={crateRows}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="seasonName" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="totalCrates" name="Τελάρα" fill="var(--color-accent)" radius={6} />
                  <Bar dataKey="totalOlivesKg" name="Κιλά ελιών" fill="var(--color-success)" radius={6} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Panel>
      </div>
    </>
  );
}
