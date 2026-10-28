"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  BarChart3,
  CalendarRange,
  ChevronDown,
  Droplets,
  Factory,
  LayoutDashboard,
  LogOut,
  Map,
  Menu,
  ShoppingCart,
  Trees,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { useNavigationLoading } from "@/components/shell/navigation-loading";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";

const links = [
  { href: "/dashboard", label: "Επισκόπηση", icon: LayoutDashboard },
  { href: "/analytics", label: "Αναλύσεις", icon: BarChart3 },
  { href: "/fields", label: "Αγροτεμάχια", icon: Map },
  { href: "/harvests", label: "Συγκομιδές", icon: Trees },
  { href: "/mill", label: "Ελαιοτριβείο", icon: Factory },
  {
    label: "Πωλήσεις",
    icon: ShoppingCart,
    children: [
      { href: "/sales/oil", label: "Ελαιόλαδο", icon: Droplets },
      { href: "/sales/olives", label: "Ελιές", icon: Trees },
    ],
  },
  { href: "/customers", label: "Πελάτες", icon: Users },
  { href: "/transactions", label: "Έσοδα / Έξοδα", icon: Wallet },
  { href: "/seasons", label: "Περίοδοι", icon: CalendarRange },
];

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { startNavigation } = useNavigationLoading();
  const [salesOpen, setSalesOpen] = useState(
    pathname.startsWith("/sales"),
  );

  const onNavClick = (href: string) => {
    onNavigate?.();
    startNavigation(href);
  };

  return (
    <nav aria-label="Κύριο μενού">
      <ul className="flex flex-col gap-1">
        {links.map((item) => {
          if ("children" in item && item.children) {
            return (
              <li key={item.label}>
                <button
                  type="button"
                  className="flex w-full items-center gap-3 rounded-[var(--radius-md)] px-3 py-2.5 text-sm hover:bg-[var(--color-accent-muted)]"
                  aria-expanded={salesOpen}
                  onClick={() => setSalesOpen((o) => !o)}
                >
                  <item.icon className="h-4 w-4 shrink-0" aria-hidden />
                  <span className="flex-1 text-left">{item.label}</span>
                  <ChevronDown
                    className={`h-4 w-4 transition-transform ${salesOpen ? "rotate-180" : ""}`}
                    aria-hidden
                  />
                </button>
                {salesOpen ? (
                  <ul className="ml-4 mt-1 flex flex-col gap-1 border-l border-[var(--color-border)] pl-3">
                    {item.children.map((child) => {
                      const active = pathname === child.href;
                      return (
                        <li key={child.href}>
                          <Link
                            href={child.href}
                            aria-current={active ? "page" : undefined}
                            onClick={() => onNavClick(child.href)}
                            className={`flex items-center gap-2 rounded-[var(--radius-md)] px-3 py-2 text-sm ${
                              active
                                ? "bg-[var(--color-accent-muted)] font-semibold text-[var(--color-accent)]"
                                : "hover:bg-[var(--color-accent-muted)]"
                            }`}
                          >
                            {child.label}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                ) : null}
              </li>
            );
          }

          const href = "href" in item ? item.href! : "#";
          const active = pathname === href || (href !== "/" && pathname.startsWith(href));
          const Icon = item.icon;
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                onClick={() => onNavClick(href)}
                className={`flex items-center gap-3 rounded-[var(--radius-md)] px-3 py-2.5 text-sm ${
                  active
                    ? "bg-[var(--color-accent-muted)] font-semibold text-[var(--color-accent)]"
                    : "hover:bg-[var(--color-accent-muted)]"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function BrandMark() {
  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-accent)] text-[var(--color-on-accent)] font-[family-name:var(--font-display)] text-lg font-bold">
      Ω
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const { profile, logout, activeSeason } = useStore();
  const { startNavigation } = useNavigationLoading();
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <header className="md:hidden fixed inset-x-0 top-0 z-40 flex h-14 items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-surface)] px-4">
        <div className="flex items-center gap-2">
          <BrandMark />
          <span className="font-semibold">OHM</span>
        </div>
        <button
          type="button"
          className="rounded-[var(--radius-md)] bg-[var(--color-accent)] p-2 text-[var(--color-on-accent)]"
          aria-expanded={open}
          aria-label={open ? "Κλείσιμο μενού" : "Άνοιγμα μενού"}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </header>

      <aside
        className={`fixed top-0 left-0 z-50 flex h-full w-[var(--layout-sidebar)] flex-col border-r border-[var(--color-border)] bg-[var(--color-surface)] p-5 transition-transform md:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Link
          href="/dashboard"
          className="mb-6 flex items-center gap-3 border-b border-[var(--color-border)] pb-4"
          onClick={() => {
            setOpen(false);
            startNavigation("/dashboard");
          }}
        >
          <BrandMark />
          <div>
            <div className="font-[family-name:var(--font-display)] font-semibold">OHM</div>
            <div className="text-xs text-[var(--color-text-muted)]">Διαχείριση συγκομιδής</div>
          </div>
        </Link>

        <div className="flex-1 overflow-y-auto">
          <NavLinks onNavigate={() => setOpen(false)} />
        </div>

        <div className="mt-4 border-t border-[var(--color-border)] pt-4">
          {activeSeason ? (
            <p className="mb-3 text-xs text-[var(--color-text-muted)]">
              Ενεργή περίοδος: <strong className="text-[var(--color-text)]">{activeSeason.name}</strong>
            </p>
          ) : (
            <p className="mb-3 text-xs text-[var(--color-warning)]">Δεν υπάρχει ενεργή περίοδος</p>
          )}
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-accent-muted)] text-sm font-semibold text-[var(--color-accent)]">
              {(profile?.fullName || profile?.username || "?").slice(0, 1).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-medium">{profile?.fullName || profile?.username}</div>
              <div className="truncate text-xs text-[var(--color-text-muted)]">{profile?.email}</div>
            </div>
          </div>
          <Button
            variant="secondary"
            className="w-full"
            onClick={async () => {
              await logout();
              window.location.href = "/login";
            }}
          >
            <LogOut className="h-4 w-4" aria-hidden />
            Αποσύνδεση
          </Button>
        </div>
      </aside>

      {open ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/30 md:hidden"
          aria-label="Κλείσιμο μενού"
          onClick={() => setOpen(false)}
        />
      ) : null}

      <main className="min-h-screen pt-14 md:pt-0 md:pl-[var(--layout-sidebar)]">
        <div className="mx-auto max-w-[var(--layout-content-max)] p-4 md:p-8">{children}</div>
      </main>
    </div>
  );
}
