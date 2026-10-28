"use client";

import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { PageHeader, Panel } from "@/components/ui/page-header";
import { Select } from "@/components/ui/field";
import { NoSeasonState } from "@/components/shell/no-season";
import { formatCurrency, oilKgToLiters } from "@/lib/domain";
import { useStore } from "@/lib/store";

export default function DashboardPage() {
  const { data, activeSeason, dashboardStats, harvestsByField, activateSeason } =
    useStore();
  const [seasonId, setSeasonId] = useState(activeSeason?.id ?? "");
  const effectiveId = seasonId || activeSeason?.id || "";

  const stats = useMemo(
    () => (effectiveId ? dashboardStats(effectiveId) : null),
    [dashboardStats, effectiveId],
  );
  const byField = useMemo(
    () => (effectiveId ? harvestsByField(effectiveId) : []),
    [harvestsByField, effectiveId],
  );

  if (!activeSeason && data.seasons.length === 0) {
    return (
      <>
        <PageHeader title="Επισκόπηση" description="Στατιστικά περιόδου" />
        <NoSeasonState />
      </>
    );
  }

  if (!stats || !effectiveId) {
    return (
      <>
        <PageHeader title="Επισκόπηση" />
        <NoSeasonState />
      </>
    );
  }

  const seasonName =
    data.seasons.find((s) => s.id === effectiveId)?.name ?? "";

  const financeData = [
    { name: "Έσοδα", value: stats.transactions.totalIncome, fill: "var(--color-success)" },
    { name: "Έξοδα", value: stats.transactions.totalExpenses, fill: "var(--color-danger)" },
  ];

  return (
    <>
      <PageHeader
        title="Επισκόπηση"
        description={`Στοιχεία για την περίοδο ${seasonName}`}
        actions={
          <Select
            aria-label="Επιλογή περιόδου"
            value={effectiveId}
            onChange={(e) => {
              setSeasonId(e.target.value);
              activateSeason(e.target.value);
            }}
            className="w-auto min-w-[160px]"
          >
            {data.seasons.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Select>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          label="Συγκομιδή"
          value={`${stats.harvests.totalOlivesKg} kg`}
          sub={`${stats.harvests.totalCrates} τελάρα`}
        />
        <Stat
          label="Παραγωγή λαδιού"
          value={`${oilKgToLiters(stats.mill.totalOilKg)} L (${stats.mill.totalOilKg} kg)`}
          sub={`Κόστος: ${formatCurrency(stats.mill.totalExpenses)}`}
        />
        <Stat
          label="Πωλήσεις λαδιού"
          value={`${stats.oil.totalSold} L`}
          sub={`Έσοδα: ${formatCurrency(stats.oil.totalRevenue)}`}
        />
        <Stat
          label="Υπόλοιπο λαδιού"
          value={`${stats.oil.remainingAllSeasons} kg (${oilKgToLiters(stats.oil.remainingAllSeasons)} L)`}
          sub={`Τρέχουσα περίοδος: ${stats.oil.remaining} kg`}
          highlight
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel className="p-5">
          <h2 className="mb-1 font-semibold">Απόδοση ανά αγροτεμάχιο</h2>
          <p className="mb-4 text-sm text-[var(--color-text-muted)]">Συνολικά κιλά ελιών</p>
          {byField.length === 0 ? (
            <p className="text-sm text-[var(--color-text-muted)]">Δεν υπάρχουν συγκομιδές ακόμα.</p>
          ) : (
            <div className="h-[280px]" role="img" aria-label="Ραβδόγραμμα κιλών ελιών ανά αγροτεμάχιο">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={byField}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="totalOlivesKg" name="Κιλά" fill="var(--color-accent)" radius={6} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Panel>

        <Panel className="p-5">
          <h2 className="mb-1 font-semibold">Έσοδα vs έξοδα</h2>
          <p className="mb-4 text-sm text-[var(--color-text-muted)]">
            Συμπεριλαμβάνει πωλήσεις λαδιού και κόστος ελαιοτριβείου
          </p>
          <div className="h-[280px]" role="img" aria-label="Διάγραμμα εσόδων και εξόδων">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={financeData} dataKey="value" nameKey="name" innerRadius={60} outerRadius={100}>
                  {financeData.map((d) => (
                    <Cell key={d.name} fill={d.fill} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => formatCurrency(Number(v))} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">
            Έσοδα {formatCurrency(stats.transactions.totalIncome)} · Έξοδα{" "}
            {formatCurrency(stats.transactions.totalExpenses)}
          </p>
        </Panel>
      </div>
    </>
  );
}

function Stat({
  label,
  value,
  sub,
  highlight,
}: {
  label: string;
  value: string;
  sub: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-[var(--radius-lg)] border bg-[var(--color-surface)] p-4 shadow-[var(--shadow-card)] ${
        highlight ? "border-[var(--color-accent)] border-2" : "border-[var(--color-border)]"
      }`}
    >
      <div className="text-sm text-[var(--color-text-muted)]">{label}</div>
      <div className="mt-1 text-xl font-semibold">{value}</div>
      <div className="mt-1 text-xs text-[var(--color-text-muted)]">{sub}</div>
    </div>
  );
}
