// ============================================================================
// Application Constants
// Centralized configuration constants used across the application.
// ============================================================================

/** Application metadata */
export const APP_CONFIG = {
  name: "CyberGuard AI",
  description: "AI-Powered Cyber Crime Assistance Platform",
  version: "0.1.0",
  supportEmail: "support@cyberguard.ai",
} as const;

/** API configuration */
export const API_CONFIG = {
  baseUrl: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1",
  timeout: 30_000,
  retryAttempts: 3,
} as const;

/** Authentication constants */
export const AUTH_CONFIG = {
  tokenKey: "cyberguard_access_token",
  refreshTokenKey: "cyberguard_refresh_token",
  sessionDuration: 60 * 60 * 1000, // 1 hour in ms
} as const;

/** Pagination defaults */
export const PAGINATION = {
  defaultPageSize: 20,
  pageSizeOptions: [10, 20, 50, 100],
} as const;
