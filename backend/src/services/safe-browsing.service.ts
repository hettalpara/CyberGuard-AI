// ============================================================================
// Google Safe Browsing Service (v4 Threat Matches API)
// Provides deterministic threat intelligence for URL inspection:
// - CHECKED_NO_THREAT: Successfully verified against Google Safe Browsing (score = 0)
// - THREAT_DETECTED: Confirmed unsafe match (score = 70-100)
// - UNAVAILABLE: API key missing, network timeout, rate limited (score = null)
// - ERROR: HTTP client/server error or malformed payload (score = null)
// ============================================================================

export type SafeBrowsingStatus =
  | "CHECKED_NO_THREAT"
  | "THREAT_DETECTED"
  | "UNAVAILABLE"
  | "ERROR";

export interface SafeBrowsingResult {
  checked: boolean;
  available: boolean;
  status: SafeBrowsingStatus;
  threatDetected: boolean;
  threatTypes: string[];
  score: number | null;
  reason: string;
  provider: "GOOGLE_SAFE_BROWSING";
  checkedAt: string;
  threats?: any[];
  error?: string;
}

const DEFAULT_TIMEOUT_MS = 6000;

export async function checkGoogleSafeBrowsing(
  url: string,
  options?: { timeoutMs?: number; apiKey?: string }
): Promise<SafeBrowsingResult> {
  const apiKey =
    options?.apiKey !== undefined
      ? options.apiKey
      : process.env.GOOGLE_SAFE_BROWSING_API_KEY;

  const isConfigured = Boolean(
    apiKey &&
      apiKey.trim() !== "" &&
      apiKey !== "your_google_safe_browsing_api_key" &&
      apiKey !== "YOUR_API_KEY"
  );

  const checkedAt = new Date().toISOString();
  const timeoutMs = options?.timeoutMs || DEFAULT_TIMEOUT_MS;

  if (!isConfigured || !apiKey) {
    return {
      checked: false,
      available: false,
      status: "UNAVAILABLE",
      threatDetected: false,
      threatTypes: [],
      score: null,
      reason: "Google Safe Browsing was unavailable.",
      provider: "GOOGLE_SAFE_BROWSING",
      checkedAt,
      error: "Google Safe Browsing API key is not configured.",
    };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const endpoint = `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${encodeURIComponent(
      apiKey.trim()
    )}`;

    const payload = {
      client: {
        clientId: "cyberguard-ai",
        clientVersion: "1.0.0",
      },
      threatInfo: {
        threatTypes: [
          "MALWARE",
          "SOCIAL_ENGINEERING",
          "UNWANTED_SOFTWARE",
          "POTENTIALLY_HARMFUL_APPLICATION",
        ],
        platformTypes: ["ANY_PLATFORM"],
        threatEntryTypes: ["URL"],
        threatEntries: [{ url }],
      },
    };

    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const status = response.status;
      let errorDetail = `Google Safe Browsing request failed with HTTP ${status}`;
      try {
        const errJson: any = await response.json();
        if (errJson?.error?.message) {
          errorDetail = `Safe Browsing: ${errJson.error.message}`;
        }
      } catch {
        // use default error message
      }

      return {
        checked: false,
        available: false,
        status: status >= 500 || status === 429 ? "UNAVAILABLE" : "ERROR",
        threatDetected: false,
        threatTypes: [],
        score: null,
        reason: "Google Safe Browsing was unavailable.",
        provider: "GOOGLE_SAFE_BROWSING",
        checkedAt,
        error: errorDetail,
      };
    }

    const data: any = await response.json();

    if (data.matches && Array.isArray(data.matches) && data.matches.length > 0) {
      const detectedTypes: string[] = Array.from(
        new Set(data.matches.map((m: any) => m.threatType).filter(Boolean))
      );
      const typesUpper = detectedTypes.map((t) => t.toUpperCase());

      // Threat Score Mapping:
      // MALWARE -> 100
      // SOCIAL_ENGINEERING -> 90
      // POTENTIALLY_HARMFUL_APPLICATION -> 80
      // UNWANTED_SOFTWARE -> 70
      let score = 70;
      let reason = `Google Safe Browsing identified this URL on an unsafe-resource list (${detectedTypes.join(", ")}).`;

      if (typesUpper.includes("MALWARE")) {
        score = 100;
        reason = "Google Safe Browsing identified this URL as MALWARE.";
      } else if (typesUpper.includes("SOCIAL_ENGINEERING")) {
        score = 90;
        reason = "Google Safe Browsing identified this URL as SOCIAL_ENGINEERING (phishing).";
      } else if (typesUpper.includes("POTENTIALLY_HARMFUL_APPLICATION")) {
        score = 80;
        reason = "Google Safe Browsing identified this URL as POTENTIALLY_HARMFUL_APPLICATION.";
      } else if (typesUpper.includes("UNWANTED_SOFTWARE")) {
        score = 70;
        reason = "Google Safe Browsing identified this URL as UNWANTED_SOFTWARE.";
      }

      return {
        checked: true,
        available: true,
        status: "THREAT_DETECTED",
        threatDetected: true,
        threatTypes: detectedTypes,
        score,
        reason,
        provider: "GOOGLE_SAFE_BROWSING",
        checkedAt,
        threats: data.matches,
      };
    }

    return {
      checked: true,
      available: true,
      status: "CHECKED_NO_THREAT",
      threatDetected: false,
      threatTypes: [],
      score: 0,
      reason: "No threats identified in Google Safe Browsing.",
      provider: "GOOGLE_SAFE_BROWSING",
      checkedAt,
      threats: [],
    };
  } catch (err: any) {
    const isTimeout = err.name === "AbortError";
    const errorMsg = isTimeout
      ? `Google Safe Browsing request timed out after ${timeoutMs}ms`
      : err.message || "Safe Browsing connection failure";

    return {
      checked: false,
      available: false,
      status: "UNAVAILABLE",
      threatDetected: false,
      threatTypes: [],
      score: null,
      reason: "Google Safe Browsing was unavailable.",
      provider: "GOOGLE_SAFE_BROWSING",
      checkedAt,
      error: errorMsg,
    };
  }
}
