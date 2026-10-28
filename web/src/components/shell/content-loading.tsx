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
      className={`animate-pulse rounded-[var(--radius-md)] bg-[#d4e5dc] ${className}`}
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
      className="space-y-6 py-4"
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

      <ContentSpinner label={label} />
    </div>
  );
}

function ContentLoadingOverlay({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="relative min-h-[40vh]">
      <div
        className="pointer-events-none absolute inset-0 z-20 flex items-start justify-center bg-[var(--color-bg)]/90 pt-12 backdrop-blur-[1px]"
        aria-hidden={false}
      >
        <ContentSpinner label={label} />
      </div>
      <div className="pointer-events-none opacity-30" aria-hidden>
        {children}
      </div>
    </div>
  );
}

/** App shell with sidebar; overlays loading on content without unmounting routes. */
export function AppContentGate({ children }: { children: React.ReactNode }) {
  const { ready, profile, dataReady } = useStore();
  const { isNavigating } = useNavigationLoading();
  const router = useRouter();

  useEffect(() => {
    if (ready && !profile) router.replace("/login");
  }, [ready, profile, router]);

  const dataLoadingLabel =
    !ready ? "Φόρτωση…" : !profile ? "Ανακατεύθυνση…" : "Φόρτωση δεδομένων…";

  const showDataLoading =
    !ready || !profile || (profile !== null && !dataReady);

  let body: ReactNode = children;

  if (showDataLoading) {
    body = (
      <ContentLoadingOverlay label={dataLoadingLabel}>
        {children}
      </ContentLoadingOverlay>
    );
  } else if (isNavigating) {
    body = (
      <ContentLoadingOverlay label="Φόρτωση σελίδας…">
        {children}
      </ContentLoadingOverlay>
    );
  }

  return <AppShell>{body}</AppShell>;
}
