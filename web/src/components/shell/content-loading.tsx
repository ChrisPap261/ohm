"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/shell/sidebar";
import { useStore } from "@/lib/store";

function SkeletonBar({
  className = "",
}: {
  className?: string;
}) {
  return (
    <div
      className={`animate-pulse rounded-[var(--radius-md)] bg-[var(--color-border)]/60 ${className}`}
      aria-hidden
    />
  );
}

export function ContentLoading({ label }: { label: string }) {
  return (
    <div role="status" aria-live="polite" aria-busy="true" className="space-y-6">
      <span className="sr-only">{label}</span>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <SkeletonBar className="h-8 w-48 max-w-full" />
          <SkeletonBar className="h-4 w-64 max-w-full" />
        </div>
        <SkeletonBar className="h-10 w-36" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-card)]"
          >
            <SkeletonBar className="mb-3 h-4 w-24" />
            <SkeletonBar className="mb-2 h-7 w-32" />
            <SkeletonBar className="h-3 w-20" />
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-card)]">
          <SkeletonBar className="mb-2 h-5 w-40" />
          <SkeletonBar className="mb-4 h-4 w-56" />
          <SkeletonBar className="h-[280px] w-full" />
        </div>
        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-card)]">
          <SkeletonBar className="mb-2 h-5 w-36" />
          <SkeletonBar className="mb-4 h-4 w-52" />
          <SkeletonBar className="mx-auto h-[280px] w-[280px] max-w-full rounded-full" />
        </div>
      </div>

      <div className="flex items-center justify-center gap-2 pt-2 text-sm text-[var(--color-text-muted)]">
        <div
          className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--color-border)] border-t-[var(--color-accent)]"
          aria-hidden
        />
        {label}
      </div>
    </div>
  );
}

/** App shell with sidebar; content shows skeleton until session + data are ready. */
export function AppContentGate({ children }: { children: React.ReactNode }) {
  const { ready, profile, dataReady } = useStore();
  const router = useRouter();

  useEffect(() => {
    if (ready && !profile) router.replace("/login");
  }, [ready, profile, router]);

  if (ready && !profile) return null;

  const loadingLabel = !ready ? "Φόρτωση…" : "Φόρτωση δεδομένων…";
  const showContentLoading = !ready || !dataReady;

  return (
    <AppShell>
      {showContentLoading ? (
        <ContentLoading label={loadingLabel} />
      ) : (
        children
      )}
    </AppShell>
  );
}
