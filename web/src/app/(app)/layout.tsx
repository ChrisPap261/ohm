"use client";

import { AppContentGate } from "@/components/shell/content-loading";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <AppContentGate>{children}</AppContentGate>;
}
