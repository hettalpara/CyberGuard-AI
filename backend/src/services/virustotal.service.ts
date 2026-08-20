export interface VirusTotalResult {
  checked: boolean;
  available: boolean;
  malicious: boolean;
  suspicious: boolean;
  maliciousCount: number;
  suspiciousCount: number;
  undetectedCount: number;
  totalEngines: number;
  harmless?: number;
  detectionRatio?: string;
  enginesFlagged?: number;
  permalink?: string | null;
  status?: "clean" | "threat_found" | "not_configured" | "unavailable";
  error?: string;
}

export async function checkUrlWithVirusTotal(url: string): Promise<VirusTotalResult> {
  const apiKey = process.env.VIRUSTOTAL_API_KEY;

  if (!apiKey || apiKey.trim() === "" || apiKey === "YOUR_API_KEY" || apiKey === "your_virustotal_api_key") {
    return {
      checked: false,
      available: false,
      malicious: false,
      suspicious: false,
      maliciousCount: 0,
      suspiciousCount: 0,
      undetectedCount: 0,
      totalEngines: 0,
      error: "VirusTotal API key is not configured",
      status: "not_configured",
    };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    // VirusTotal v3 URL identifier is Base64 URL-safe without padding
    const urlId = Buffer.from(url)
      .toString("base64")
      .replace(/=/g, "")
      .replace(/\+/g, "-")
      .replace(/\//g, "_");

    const endpoint = `https://www.virustotal.com/api/v3/urls/${urlId}`;
    const response = await fetch(endpoint, {
      method: "GET",
      headers: {
        "x-apikey": apiKey.trim(),
        Accept: "application/json",
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.status === 401 || response.status === 403) {
      return {
        checked: false,
        available: false,
        malicious: false,
        suspicious: false,
        maliciousCount: 0,
        suspiciousCount: 0,
        undetectedCount: 0,
        totalEngines: 0,
        error: "VirusTotal authentication failed",
        status: "unavailable",
      };
    }

    if (response.status === 404) {
      // URL has not yet been scanned on VirusTotal -> return clean defaults
      return {
        checked: true,
        available: true,
        malicious: false,
        suspicious: false,
        maliciousCount: 0,
        suspiciousCount: 0,
        undetectedCount: 0,
        totalEngines: 0,
        harmless: 0,
        detectionRatio: "0 / 0",
        permalink: `https://www.virustotal.com/gui/url/${urlId}`,
        status: "clean",
      };
    }

    if (response.status === 429) {
      return {
        checked: false,
        available: false,
        malicious: false,
        suspicious: false,
        maliciousCount: 0,
        suspiciousCount: 0,
        undetectedCount: 0,
        totalEngines: 0,
        error: "VirusTotal rate limit reached",
        status: "unavailable",
      };
    }

    if (!response.ok) {
      return {
        checked: false,
        available: false,
        malicious: false,
        suspicious: false,
        maliciousCount: 0,
        suspiciousCount: 0,
        undetectedCount: 0,
        totalEngines: 0,
        error: "VirusTotal service unavailable",
        status: "unavailable",
      };
    }

    const data: any = await response.json();
    const attributes = data?.data?.attributes || {};
    const stats = attributes.last_analysis_stats || {};

    const maliciousCount = Number(stats.malicious || 0);
    const suspiciousCount = Number(stats.suspicious || 0);
    const harmless = Number(stats.harmless || 0);
    const undetectedCount = Number(stats.undetected || 0);

    const enginesFlagged = maliciousCount + suspiciousCount;
    const totalEngines = maliciousCount + suspiciousCount + harmless + undetectedCount;
    const detectionRatio = `${enginesFlagged} / ${totalEngines || 70}`;
    const permalink = `https://www.virustotal.com/gui/url/${urlId}`;

    return {
      checked: true,
      available: true,
      malicious: maliciousCount > 0,
      suspicious: suspiciousCount > 0,
      maliciousCount,
      suspiciousCount,
      undetectedCount,
      totalEngines,
      harmless,
      detectionRatio,
      permalink,
      status: enginesFlagged > 0 ? "threat_found" : "clean",
    };
  } catch {
    return {
      checked: false,
      available: false,
      malicious: false,
      suspicious: false,
      maliciousCount: 0,
      suspiciousCount: 0,
      undetectedCount: 0,
      totalEngines: 0,
      error: "VirusTotal service unavailable",
      status: "unavailable",
    };
  }
}

// Backward-compatible alias
export const checkVirusTotal = checkUrlWithVirusTotal;
