// ============================================================================
// Navigation Constants
// All sidebar, header, and footer navigation definitions live here.
// ============================================================================

import type { NavItem } from "@/types";

export const MAIN_NAV: NavItem[] = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "URL Analyzer", href: "/analyzer" },
  { label: "AI Assistant", href: "/assistant" },
  { label: "Reports", href: "/reports" },
  { label: "History", href: "/history" },
  { label: "Recovery Guide", href: "/recovery" },
];

export const USER_NAV: NavItem[] = [
  { label: "Profile", href: "/profile" },
  { label: "Settings", href: "/settings" },
];
