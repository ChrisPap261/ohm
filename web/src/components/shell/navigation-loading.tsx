"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";

type NavigationContextValue = {
  isNavigating: boolean;
  startNavigation: (href: string) => void;
};

const NavigationContext = createContext<NavigationContextValue | null>(null);

function normalizePath(href: string): string {
  try {
    return new URL(href, "http://local").pathname;
  } catch {
    return href.split("?")[0] ?? href;
  }
}

export function NavigationProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [isNavigating, setIsNavigating] = useState(false);
  const targetPath = useRef<string | null>(null);

  const startNavigation = useCallback(
    (href: string) => {
      const next = normalizePath(href);
      if (next === pathname) return;
      targetPath.current = next;
      setIsNavigating(true);
    },
    [pathname],
  );

  useEffect(() => {
    if (!isNavigating) return;
    const target = targetPath.current;
    if (target && pathname === target) {
      targetPath.current = null;
      setIsNavigating(false);
    }
  }, [pathname, isNavigating]);

  return (
    <NavigationContext.Provider value={{ isNavigating, startNavigation }}>
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigationLoading() {
  const ctx = useContext(NavigationContext);
  if (!ctx) {
    throw new Error("useNavigationLoading must be used within NavigationProvider");
  }
  return ctx;
}

export function ContentSpinner({ label }: { label: string }) {
  return (
    <div
      className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-sm font-medium text-[var(--color-text)]"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div
        className="h-10 w-10 animate-spin rounded-full border-[3px] border-[var(--color-accent-muted)] border-t-[var(--color-accent)]"
        aria-hidden
      />
      {label}
    </div>
  );
}
