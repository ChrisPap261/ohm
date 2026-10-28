"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { ready, profile } = useStore();
  const router = useRouter();

  useEffect(() => {
    if (ready && !profile) router.replace("/login");
  }, [ready, profile, router]);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center text-[var(--color-text-muted)]">
        Φόρτωση…
      </div>
    );
  }

  if (!profile) return null;
  return <>{children}</>;
}
