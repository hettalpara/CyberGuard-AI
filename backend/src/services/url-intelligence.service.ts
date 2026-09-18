import { URL } from "node:url";

export type UrlRiskLevel = "SAFE" | "LOW" | "MODERATE" | "HIGH" | "CRITICAL";

export interface UrlIndicator {
  name: string;
  score: number;
  reason: string;
}

export interface UrlIntelligenceResult {
  status: "CHECKED" | "ERROR";
  score: number;
  level: UrlRiskLevel;
  indicators: UrlIndicator[];
  reasons: string[];
  evidence: Record<string, unknown>;
}

export function getRiskLevel(score: number): UrlRiskLevel {
  if (score >= 80) return "CRITICAL";
  if (score >= 60) return "HIGH";
  if (score >= 40) return "MODERATE";
  if (score >= 20) return "LOW";
  return "SAFE";
}

// Regex helpers
const IPV4_REGEX = /^(\d{1,3}\.){3}\d{1,3}$/;
const IPV6_REGEX = /^\[?[a-fA-F0-9:]+\]?$/;

/**
 * Checks if a hostname is a raw IPv4 or IPv6 address.
 */
function isRawIpAddress(hostname: string): boolean {
  const cleanHost = hostname.replace(/^\[|\]$/g, "");
  if (IPV4_REGEX.test(cleanHost)) {
    const octets = cleanHost.split(".").map(Number);
    return octets.every((oct) => oct >= 0 && oct <= 255);
  }
  return cleanHost.includes(":") && IPV6_REGEX.test(cleanHost);
}

/**
 * Checks for Punycode labels in hostname (e.g. xn--).
 */
function hasPunycode(hostname: string, fullUrl: string = ""): boolean {
  if (fullUrl.toLowerCase().includes("xn--")) return true;
  return hostname.split(".").some((label) => label.toLowerCase().startsWith("xn--"));
}

/**
 * Calculates number of subdomain levels (excluding root domain and TLD).
 */
function countSubdomainLevels(hostname: string): number {
  if (isRawIpAddress(hostname)) return 0;
  const labels = hostname.split(".").filter(Boolean);
  return Math.max(0, labels.length - 2);
}

/**
 * Analyzes URL using Node.js URL parser and deterministic heuristics.
 * Operates purely locally without external APIs.
 */
export function analyzeUrlIntelligence(normalizedUrl: string): UrlIntelligenceResult {
  try {
    let hostname = "";
    let pathname = "/";
    let search = "";
    let protocol = "https:";
    let queryParamCount = 0;

    try {
      const parsed = new URL(normalizedUrl.startsWith("http") ? normalizedUrl : `https://${normalizedUrl}`);
      hostname = parsed.hostname.toLowerCase();
      pathname = parsed.pathname;
      search = parsed.search;
      protocol = parsed.protocol;
      queryParamCount = Array.from(parsed.searchParams.keys()).length;
    } catch {
      // Regex fallback for non-standard / IDN domains that Node's strict WHATWG parser rejects
      const urlRegex = /^(https?):\/\/([^/?#:]+)(?::\d+)?(\/[^?#]*)?(\?[^#]*)?(#.*)?$/i;
      const match = normalizedUrl.match(urlRegex);
      if (match) {
        protocol = match[1].toLowerCase() + ":";
        hostname = match[2].toLowerCase();
        pathname = match[3] || "/";
        search = match[4] || "";
      } else {
        const simpleMatch = normalizedUrl.match(/^(?:([a-zA-Z]+):\/\/)?([^/?#:]+)(.*)/i);
        if (simpleMatch) {
          protocol = (simpleMatch[1] || "https").toLowerCase() + ":";
          hostname = simpleMatch[2].toLowerCase();
          pathname = simpleMatch[3] || "/";
        }
      }
      if (search) {
        queryParamCount = (search.match(/[?&][^=&#]+/g) || []).length;
      }
    }

    const fullUrl = normalizedUrl;

    const indicators: UrlIndicator[] = [];
    const evidence: Record<string, unknown> = {
      hostname,
      length: fullUrl.length,
      protocol,
    };

    let totalScore = 0;

    // 1. Raw IP address check (+25)
    const isIp = isRawIpAddress(hostname);
    evidence.isRawIp = isIp;
    if (isIp) {
      const score = 25;
      totalScore += score;
      indicators.push({
        name: "Raw IP Address",
        score,
        reason: "Destination uses a raw IP address instead of a registered domain name.",
      });
    }

    // 2. Punycode check (+20)
    const isPuny = hasPunycode(hostname, fullUrl);
    evidence.hasPunycode = isPuny;
    if (isPuny) {
      const score = 20;
      totalScore += score;
      indicators.push({
        name: "Punycode Encoding",
        score,
        reason: "Hostname contains Punycode (xn--), which can be used for IDN homograph spoofing.",
      });
    }

    // 3. Very long URL check (+10 if > 150, +15 if > 250)
    evidence.urlLength = fullUrl.length;
    if (fullUrl.length > 250) {
      const score = 15;
      totalScore += score;
      indicators.push({
        name: "Excessive URL Length",
        score,
        reason: `URL is unusually long (${fullUrl.length} characters), commonly used to conceal malicious payloads.`,
      });
    } else if (fullUrl.length > 150) {
      const score = 10;
      totalScore += score;
      indicators.push({
        name: "Long URL",
        score,
        reason: `URL length (${fullUrl.length} characters) exceeds standard web conventions.`,
      });
    }

    // 4. Excessive subdomains check (>= 3 levels: +10)
    const subdomainLevels = countSubdomainLevels(hostname);
    evidence.subdomainLevels = subdomainLevels;
    if (subdomainLevels >= 3) {
      const score = 10;
      totalScore += score;
      indicators.push({
        name: "Excessive Subdomains",
        score,
        reason: `Hostname has ${subdomainLevels} subdomain levels, which may indicate domain spoofing or evasion.`,
      });
    }

    // 5. Suspicious percent encoding check (+10)
    // Detect excessive or unusual percent encoding (e.g. %2F, %3D, %40, %25)
    const encodedMatches = fullUrl.match(/%[0-9a-fA-F]{2}/g) || [];
    const sensitiveEncodings = (fullUrl.match(/%(2F|3D|40|25|23|3F)/gi) || []).length;
    const isExcessiveEncoding = encodedMatches.length >= 4 || sensitiveEncodings >= 2;
    evidence.percentEncodedCount = encodedMatches.length;
    evidence.sensitiveEncodingsCount = sensitiveEncodings;
    if (isExcessiveEncoding) {
      const score = 10;
      totalScore += score;
      indicators.push({
        name: "Suspicious Percent Encoding",
        score,
        reason: `URL contains excessive or sensitive percent-encoded characters (${encodedMatches.length} instances), often used to evade security filters.`,
      });
    }

    // 6. Suspicious URL structure check (Max +10)
    let structurePoints = 0;
    const structureReasons: string[] = [];

    // Check for '@' symbol which can mask true destination
    if (fullUrl.includes("@")) {
      structurePoints += 5;
      structureReasons.push("contains '@' character which can obscure destination");
    }

    // Check for multiple consecutive dots (e.g. '..' in path or domain)
    if (pathname.includes("..") || hostname.includes("..")) {
      structurePoints += 5;
      structureReasons.push("contains consecutive dots ('..') indicative of path traversal");
    }

    // Check for unusual separators / double slash in path after origin
    if (pathname.includes("//") || pathname.includes("/./")) {
      structurePoints += 3;
      structureReasons.push("contains anomalous path separators ('//')");
    }

    // Check for excessive query parameters (> 6)
    const paramCount = queryParamCount;
    evidence.queryParamCount = paramCount;
    if (paramCount >= 6) {
      structurePoints += 3;
      structureReasons.push(`contains excessive query parameters (${paramCount})`);
    }

    if (structurePoints > 0) {
      const score = Math.min(10, structurePoints);
      totalScore += score;
      indicators.push({
        name: "Suspicious URL Structure",
        score,
        reason: `Suspicious structural patterns detected: ${structureReasons.join(", ")}.`,
      });
    }

    // 7. Suspicious path/query keywords (+5 max)
    // Keywords alone must NOT classify a URL as malicious.
    // They may contribute a small score only when combined with suspicious structure!
    const suspiciousKeywords = [
      "login",
      "verify",
      "verification",
      "secure",
      "account",
      "password",
      "credential",
      "reset",
      "confirm",
    ];

    const targetSearchSpace = (pathname + search).toLowerCase();
    const matchedKeywords = suspiciousKeywords.filter((kw) => {
      // Look for whole keyword or delimited word boundary
      const regex = new RegExp(`(^|[/_?&=-])${kw}([/_?&=-]|$)`, "i");
      return regex.test(targetSearchSpace) || targetSearchSpace.includes(kw);
    });

    evidence.matchedKeywords = matchedKeywords;

    const hasOtherStructuralSuspicion =
      isIp || isPuny || subdomainLevels >= 3 || isExcessiveEncoding || structurePoints > 0;

    if (matchedKeywords.length > 0 && hasOtherStructuralSuspicion) {
      const score = 5;
      totalScore += score;
      indicators.push({
        name: "Suspicious Path/Query Keywords",
        score,
        reason: `Sensitive auth/security keywords (${matchedKeywords.slice(0, 3).join(", ")}) combined with suspicious structural features.`,
      });
    }

    // Cap total local score at 100
    const finalScore = Math.min(100, Math.max(0, totalScore));
    const level = getRiskLevel(finalScore);

    const reasons =
      indicators.length > 0
        ? indicators.map((ind) => `${ind.name}: ${ind.reason}`)
        : ["URL structure adheres to standard conventions with no suspicious local indicators."];

    return {
      status: "CHECKED",
      score: finalScore,
      level,
      indicators,
      reasons,
      evidence,
    };
  } catch (err: any) {
    return {
      status: "ERROR",
      score: 0,
      level: "SAFE",
      indicators: [],
      reasons: [err?.message || "Failed to analyze URL intelligence"],
      evidence: { error: err?.message || String(err) },
    };
  }
}
