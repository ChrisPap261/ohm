"use client";

import { useStore } from "@/lib/store";

/** Blocks page content until background Supabase hydration finishes. Shell stays visible. */
export function DataLoadingGate({ children }: { children: React.ReactNode }) {
  const { dataReady } = useStore();

  if (!dataReady) {
    return (
      <div
        className="flex min-h-[40vh] flex-col items-center justify-center gap-2 text-[var(--color-text-muted)]"
        role="status"
        aria-live="polite"
      >
        <div
          className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--color-border)] border-t-[var(--color-accent)]"
          aria-hidden
        />
        Φόρτωση δεδομένων…
      </div>
    );
  }

  return <>{children}</>;
}
