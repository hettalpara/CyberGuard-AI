// ============================================================================
// Environment Configuration
// Type-safe environment variable access with runtime validation.
// ============================================================================

/** Client-side env vars (must be prefixed with NEXT_PUBLIC_) */
export const env = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1",
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  isProduction: process.env.NODE_ENV === "production",
  isDevelopment: process.env.NODE_ENV === "development",
} as const;
