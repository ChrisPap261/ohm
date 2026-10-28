"use client";

import type { ReactNode } from "react";

export function DataTable({
  headers,
  children,
}: {
  headers: string[];
  children: ReactNode;
}) {
  return (
    <div className="hidden md:block overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[var(--color-border)] text-left text-[var(--color-text-muted)]">
            {headers.map((h) => (
              <th key={h} scope="col" className="px-4 py-3 font-medium">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

export function MobileCards({ children }: { children: ReactNode }) {
  return <div className="md:hidden flex flex-col gap-3 p-3">{children}</div>;
}

export function MobileCard({
  header,
  rows,
  actions,
}: {
  header: ReactNode;
  rows: { label: string; value: ReactNode }[];
  actions?: ReactNode;
}) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-card)]">
      <div className="mb-3 font-semibold">{header}</div>
      <div className="flex flex-col gap-2">
        {rows.map((r) => (
          <div key={r.label} className="flex justify-between gap-3 text-sm">
            <span className="text-[var(--color-text-muted)]">{r.label}</span>
            <span className="text-right">{r.value}</span>
          </div>
        ))}
      </div>
      {actions ? <div className="mt-3 flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}
