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
  const fromPath = useRef<string | null>(null);

  const startNavigation = useCallback(
    (href: string) => {
      const next = normalizePath(href);
      if (next === pathname) return;
      fromPath.current = pathname;
      setIsNavigating(true);
    },
    [pathname],
  );

  useEffect(() => {
    if (!isNavigating) return;
    if (pathname !== fromPath.current) {
      fromPath.current = null;
      setIsNavigating(false);
    }
  }, [pathname, isNavigating]);

  useEffect(() => {
    if (!isNavigating) return;
    const timeout = window.setTimeout(() => {
      fromPath.current = null;
      setIsNavigating(false);
    }, 15000);
    return () => window.clearTimeout(timeout);
  }, [isNavigating, pathname]);

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
      className="flex flex-col items-center justify-center gap-4 py-16"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div
        className="h-12 w-12 animate-spin rounded-full border-4 border-[#d4e5dc] border-t-[#2d6a4f]"
        aria-hidden
      />
      <p className="text-base font-medium text-[var(--color-text,#1a1a1a)]">{label}</p>
    </div>
  );
}
