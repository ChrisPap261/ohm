"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";

export default function HomePage() {
  const { ready, profile } = useStore();
  const router = useRouter();

  useEffect(() => {
    if (!ready) return;
    router.replace(profile ? "/dashboard" : "/login");
  }, [ready, profile, router]);

  return (
    <div className="flex min-h-screen items-center justify-center text-[var(--color-text-muted)]">
      Φόρτωση…
    </div>
  );
}
