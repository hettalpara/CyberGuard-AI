// ============================================================================
// Common Types
// Shared utility types used across the entire application.
// ============================================================================

import type { ReactNode } from "react";

/** Wrapper for components that accept children */
export interface WithChildren {
  children: ReactNode;
}

/** Navigation item used in sidebars and menus */
export interface NavItem {
  label: string;
  href: string;
  icon?: ReactNode;
  badge?: string | number;
  disabled?: boolean;
  children?: NavItem[];
}

/** Generic select/dropdown option */
export interface SelectOption<T = string> {
  label: string;
  value: T;
  disabled?: boolean;
}

/** Notification model */
export interface Notification {
  id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  read: boolean;
  createdAt: string;
  actionUrl?: string;
}
