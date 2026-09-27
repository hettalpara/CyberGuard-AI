// ============================================================================
// Theme Provider
// Wraps next-themes ThemeProvider to be used as a client component.
// Defaults to Dark Mode across the platform, persisting user preference.
// ============================================================================

"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { WithChildren } from "@/types";

interface ThemeProviderProps extends WithChildren {
  defaultTheme?: string;
  storageKey?: string;
}

export function ThemeProvider({
  children,
  defaultTheme = "dark",
  storageKey = "cyberguard-theme",
}: ThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme={defaultTheme}
      enableSystem={false}
      disableTransitionOnChange={false}
      storageKey={storageKey}
    >
      {children}
    </NextThemesProvider>
  );
}
