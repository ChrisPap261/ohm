"use client";

import { type ReactNode } from "react";
import { LocalStoreProvider } from "@/lib/data/local-provider";
import { SupabaseStoreProvider } from "@/lib/data/supabase-provider";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export function StoreProvider({ children }: { children: ReactNode }) {
  if (isSupabaseConfigured()) {
    return <SupabaseStoreProvider>{children}</SupabaseStoreProvider>;
  }
  return <LocalStoreProvider>{children}</LocalStoreProvider>;
}

export { useStore } from "@/lib/data/context";
export type { DashboardStats, StoreApi } from "@/lib/data/types";
