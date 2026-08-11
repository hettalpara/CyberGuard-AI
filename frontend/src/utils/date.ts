// ============================================================================
// Date Utilities
// Consistent date formatting across the application.
// ============================================================================

/**
 * Formats an ISO date string to a human-readable format.
 * @example formatDate("2026-07-20T10:30:00Z") → "Jul 20, 2026"
 */
export function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(dateString));
}

/**
 * Formats an ISO date string to include time.
 * @example formatDateTime("2026-07-20T10:30:00Z") → "Jul 20, 2026, 10:30 AM"
 */
export function formatDateTime(dateString: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(dateString));
}

/**
 * Returns a human-readable relative time string.
 * @example getRelativeTime("2026-07-19T10:30:00Z") → "1 day ago"
 */
export function getRelativeTime(dateString: string): string {
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  const diffMs = new Date(dateString).getTime() - Date.now();
  const diffSec = Math.round(diffMs / 1000);
  const diffMin = Math.round(diffSec / 60);
  const diffHr = Math.round(diffMin / 60);
  const diffDay = Math.round(diffHr / 24);

  if (Math.abs(diffSec) < 60) return rtf.format(diffSec, "second");
  if (Math.abs(diffMin) < 60) return rtf.format(diffMin, "minute");
  if (Math.abs(diffHr) < 24) return rtf.format(diffHr, "hour");
  return rtf.format(diffDay, "day");
}
