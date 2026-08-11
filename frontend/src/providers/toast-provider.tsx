// ============================================================================
// Toast Provider
// Wraps Sonner's Toaster to provide toast notifications app-wide.
// ============================================================================

"use client";

import { Toaster } from "sonner";
import { useTheme } from "next-themes";

export function ToastProvider() {
  const { resolvedTheme } = useTheme();

  return (
    <Toaster
      position="top-right"
      theme={resolvedTheme === "dark" ? "dark" : "light"}
      richColors
      closeButton
      duration={4000}
    />
  );
}
