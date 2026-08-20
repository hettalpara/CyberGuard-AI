export interface SafeBrowsingResult {
  checked: boolean;
  threatDetected: boolean;
  threatType?: string;
  status: "clean" | "threat_found" | "not_configured" | "unavailable";
  threats?: any[];
}

export async function checkGoogleSafeBrowsing(url: string): Promise<SafeBrowsingResult> {
  const apiKey = process.env.GOOGLE_SAFE_BROWSING_API_KEY;

  if (!apiKey || apiKey.trim() === "" || apiKey === "your_google_safe_browsing_api_key") {
    return {
      checked: false,
      threatDetected: false,
      status: "not_configured",
    };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const endpoint = `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${encodeURIComponent(apiKey.trim())}`;
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
      return {
        checked: false,
        threatDetected: false,
        status: "unavailable",
      };
    }

    const data: any = await response.json();

    if (data.matches && Array.isArray(data.matches) && data.matches.length > 0) {
      const primaryMatch = data.matches[0];
      return {
        checked: true,
        threatDetected: true,
        threatType: primaryMatch.threatType || "MALICIOUS",
        status: "threat_found",
        threats: data.matches,
      };
    }

    return {
      checked: true,
      threatDetected: false,
      status: "clean",
      threats: [],
    };
  } catch {
    return {
      checked: false,
      threatDetected: false,
      status: "unavailable",
    };
  }
}
