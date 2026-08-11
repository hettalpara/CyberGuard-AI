// ============================================================================
// Navigation Constants
// Defines sidebar and header navigation items for the platform.
// ============================================================================

import type { NavItem } from "@/types";

export const MAIN_NAV: NavItem[] = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Smart URL Analyzer", href: "/analyzer" },
  { label: "AI Assistant", href: "/assistant" },
  { label: "Reports", href: "/reports" },
  { label: "Scan History", href: "/history" },
  { label: "Recovery Guide", href: "/recovery-guide" },
];

export const USER_NAV: NavItem[] = [
  { label: "Profile", href: "/profile" },
  { label: "Settings", href: "/settings" },
];
