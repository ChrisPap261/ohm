"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { StoreApi } from "@/lib/data/types";

export const StoreContext = createContext<StoreApi | null>(null);

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}

export function StoreContextProvider({
  value,
  children,
}: {
  value: StoreApi;
  children: ReactNode;
}) {
  return (
    <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
  );
}
