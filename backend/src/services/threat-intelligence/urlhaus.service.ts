// ============================================================================
// URLhaus Malware Intelligence Service (abuse.ch)
// Queries URLhaus Community API for known malware distribution URLs.
//
// Endpoint: POST https://urlhaus-api.abuse.ch/v1/url/
// Authentication: Auth-Key HTTP header
//
// Distinct statuses:
// - CHECKED_NO_MATCH: No malware records found for this URL in URLhaus
// - MALWARE_URL_DETECTED: Confirmed malware distribution URL in URLhaus database
// - UNAVAILABLE: Auth-Key missing, network timeout, service unreachable
// - ERROR: Client error, invalid authentication, or malformed response
// ============================================================================

export type UrlhausStatus =
  | "CHECKED_NO_MATCH"
  | "MALWARE_URL_DETECTED"
  | "UNAVAILABLE"
  | "ERROR";

export interface UrlhausResult {
  available: boolean;
  status: UrlhausStatus;
  match: boolean;
  threatType?: string;
  tags?: string[];
  confidence?: number;
  provider: "URLHAUS";
  reason: string;
  checkedAt: string;
  error?: string;
}

const DEFAULT_TIMEOUT_MS = 8000;

export async function checkUrlWithUrlhaus(
  url: string,
  options?: { timeoutMs?: number; authKey?: string }
): Promise<UrlhausResult> {
  const authKey =
    options?.authKey !== undefined
      ? options.authKey
      : process.env.URLHAUS_AUTH_KEY;

  const isConfigured = Boolean(
    authKey &&
      authKey.trim() !== "" &&
      authKey !== "your_urlhaus_auth_key" &&
      authKey !== "YOUR_AUTH_KEY"
  );

  const checkedAt = new Date().toISOString();

  if (!isConfigured || !authKey) {
    return {
      available: false,
      status: "UNAVAILABLE",
      match: false,
      provider: "URLHAUS",
      reason: "URLhaus Auth-Key is not configured.",
      checkedAt,
      error: "Auth-Key missing or placeholder value",
    };
  }

  const timeoutMs = options?.timeoutMs || DEFAULT_TIMEOUT_MS;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const endpoint = "https://urlhaus-api.abuse.ch/v1/url/";
    const bodyParams = new URLSearchParams();
    bodyParams.set("url", url);

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Auth-Key": authKey.trim(),
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body: bodyParams.toString(),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const status = response.status;
      let errorDetail = `URLhaus request failed with HTTP ${status}`;
      try {
        const errJson: any = await response.json();
        if (errJson?.query_status) {
          errorDetail = `URLhaus: ${errJson.query_status}`;
        }
      } catch {
        // use default error detail
      }

      if (status === 429 || status >= 500) {
        return {
          available: false,
          status: "UNAVAILABLE",
          match: false,
          provider: "URLHAUS",
          reason: `URLhaus service temporarily unavailable (${status}).`,
          checkedAt,
          error: errorDetail,
        };
      }

      return {
        available: false,
        status: "ERROR",
        match: false,
        provider: "URLHAUS",
        reason: `URLhaus returned client error (${status}).`,
        checkedAt,
        error: errorDetail,
      };
    }

    const data: any = await response.json();

    // URLhaus returns:
    // query_status: "no_results" -> not found in database
    // query_status: "ok" -> found malware entry
    if (data.query_status === "no_results") {
      return {
        available: true,
        status: "CHECKED_NO_MATCH",
        match: false,
        provider: "URLHAUS",
        reason: "No matching malware URL record was found in URLhaus.",
        checkedAt,
      };
    }

    if (data.query_status === "ok") {
      const threatType = data.threat || "malware_download";
      const tags = Array.isArray(data.tags) ? data.tags : [];
      const tagsStr = tags.length > 0 ? ` [${tags.join(", ")}]` : "";

      return {
        available: true,
        status: "MALWARE_URL_DETECTED",
        match: true,
        threatType,
        tags,
        provider: "URLHAUS",
        reason: `URLhaus confirmed this URL as an active malware distribution source (${threatType})${tagsStr}.`,
        checkedAt,
      };
    }

    // Other unexpected query_status values (e.g. invalid_url, http_post_expected)
    return {
      available: false,
      status: "ERROR",
      match: false,
      provider: "URLHAUS",
      reason: `URLhaus query error: ${data.query_status || "Unknown error"}.`,
      checkedAt,
      error: data.query_status,
    };
  } catch (err: any) {
    clearTimeout(timeoutId);
    const isTimeout = err.name === "AbortError";
    const errorMsg = isTimeout
      ? `URLhaus request timed out after ${timeoutMs}ms`
      : err.message || "URLhaus connection failure";

    return {
      available: false,
      status: "UNAVAILABLE",
      match: false,
      provider: "URLHAUS",
      reason: "URLhaus service was unavailable during this scan.",
      checkedAt,
      error: errorMsg,
    };
  }
}
