// ============================================================================
// Navigation Constants
// Defines sidebar and header navigation items for the platform.
// ============================================================================

import type { NavItem } from "@/types";

export const MAIN_NAV: NavItem[] = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "URL Scanner", href: "/analyzer" },
  { label: "Reports", href: "/reports" },
  { label: "Scan History", href: "/history" },
  { label: "AI Assistant", href: "/assistant" },
  { label: "Recovery Guide", href: "/recovery-guide" },
  { label: "Evidence", href: "/evidence" },
  { label: "Cyber Law Info", href: "/cyber-law" },
];

export const SETTINGS_NAV: NavItem[] = [
  { label: "Settings", href: "/settings" },
];

export const USER_NAV: NavItem[] = [
  { label: "Profile", href: "/profile" },
];
