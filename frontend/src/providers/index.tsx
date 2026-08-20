// ============================================================================
// Root Providers
// Composes all application providers in the correct nesting order.
// Import this once in the root layout.
// ============================================================================

"use client";

import type { WithChildren } from "@/types";
import { ThemeProvider } from "./theme-provider";
import { ToastProvider } from "./toast-provider";
import { AuthProvider } from "@/context/auth-context";

export function Providers({ children }: WithChildren) {
  return (
    <ThemeProvider>
      <AuthProvider>
        {children}
        <ToastProvider />
      </AuthProvider>
    </ThemeProvider>
  );
}
