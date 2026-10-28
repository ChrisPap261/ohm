"use client";

import { AuthGate } from "@/components/shell/auth-gate";
import { DataLoadingGate } from "@/components/shell/data-loading-gate";
import { AppShell } from "@/components/shell/sidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGate>
      <AppShell>
        <DataLoadingGate>{children}</DataLoadingGate>
      </AppShell>
    </AuthGate>
  );
}
