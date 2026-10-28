"use client";

import { NavigationProvider } from "@/components/shell/navigation-loading";
import { AppContentGate } from "@/components/shell/content-loading";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <NavigationProvider>
      <AppContentGate>{children}</AppContentGate>
    </NavigationProvider>
  );
}
