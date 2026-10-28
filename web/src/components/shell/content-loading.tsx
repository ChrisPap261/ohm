"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/shell/sidebar";
import {
  ContentSpinner,
  useNavigationLoading,
} from "@/components/shell/navigation-loading";
import { useStore } from "@/lib/store";

function SkeletonBar({
  className = "",
}: {
  className?: string;
}) {
  return (
    <div
      className={`animate-pulse rounded-[var(--radius-md)] bg-[var(--color-accent-muted)] ${className}`}
      aria-hidden
    />
  );
}

export function ContentLoading({ label }: { label: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className="min-h-[50vh] space-y-6"
    >
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

      <div className="flex items-center justify-center gap-3 pt-4 text-sm font-medium text-[var(--color-text)]">
        <div
          className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--color-accent-muted)] border-t-[var(--color-accent)]"
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
  const { isNavigating } = useNavigationLoading();
  const router = useRouter();

  useEffect(() => {
    if (ready && !profile) router.replace("/login");
  }, [ready, profile, router]);

  const loadingLabel =
    !ready ? "Φόρτωση…" : !profile ? "Ανακατεύθυνση…" : "Φόρτωση δεδομένων…";

  const showDataLoading =
    !ready || !profile || (profile !== null && !dataReady);

  let body: ReactNode = children;
  if (showDataLoading) {
    body = <ContentLoading label={loadingLabel} />;
  } else if (isNavigating) {
    body = <ContentSpinner label="Φόρτωση σελίδας…" />;
  }

  return <AppShell>{body}</AppShell>;
}
