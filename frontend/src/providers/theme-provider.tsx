// ============================================================================
// Theme Provider
// Wraps next-themes ThemeProvider to be used as a client component.
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
      enableSystem
      disableTransitionOnChange
      storageKey={storageKey}
    >
      {children}
    </NextThemesProvider>
  );
}
