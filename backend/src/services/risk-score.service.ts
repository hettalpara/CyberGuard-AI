import { SslAnalysisResult } from "./ssl.service";
import { SslAnalysisOutput } from "./ssl-analysis.service";
import { UrlIntelligenceResult, analyzeUrlIntelligence } from "./url-intelligence.service";
import { VirusTotalResult } from "./virustotal.service";
import { SafeBrowsingResult } from "./safe-browsing.service";
import { UrlhausResult } from "./threat-intelligence/urlhaus.service";

// ============================================================================
// Authoritative Risk Levels & Thresholds
// 0–19: SAFE | 20–39: LOW | 40–59: MODERATE | 60–79: HIGH | 80–100: CRITICAL
// ============================================================================

export type RiskLevel = "SAFE" | "LOW" | "MODERATE" | "HIGH" | "CRITICAL";

export function getRiskLevel(score: number): RiskLevel {
  if (score >= 80) return "CRITICAL";
  if (score >= 60) return "HIGH";
  if (score >= 40) return "MODERATE";
  if (score >= 20) return "LOW";
  return "SAFE";
}

// ============================================================================
// Evidence-Based Finding Severity System
// ============================================================================

export type FindingSeverity = "CRITICAL" | "HIGH" | "MODERATE" | "MEDIUM" | "LOW" | "INFO";

export interface SecurityFinding {
  source: "Google Safe Browsing" | "VirusTotal" | "URLhaus" | "URL Intelligence" | "SSL/TLS";
  finding: string;
  severity: FindingSeverity;
  explanation: string;
  evidence?: Record<string, unknown> | string;
  isConfirmedThreat?: boolean;
}

// ============================================================================
// Legacy Risk Factor Types for Backward Compatibility
// ============================================================================

export type FactorImpact = "NONE" | "LOW" | "MODERATE" | "MEDIUM" | "HIGH" | "CRITICAL";

export type FactorStatus =
  | "CHECKED"
  | "CHECKED_NO_THREAT"
  | "CHECKED_NO_MATCH"
  | "CLEAN"
  | "VALID"
  | "THREAT_DETECTED"
  | "MALWARE_DETECTED"
  | "MALICIOUS_DETECTIONS"
  | "SUSPICIOUS_FEATURES"
  | "INVALID_CERTIFICATE"
  | "EXPIRED_CERTIFICATE"
  | "HOSTNAME_MISMATCH"
  | "NO_HTTPS"
  | "NO_THREAT"
  | "UNAVAILABLE"
  | "ERROR"
  | "NOT_CONFIGURED";

export interface RiskFactor {
  name: string;
  score: number | null;
  weight: number;
  contribution: number;
  impact: FactorImpact;
  status: FactorStatus;
  reason: string;
  available: boolean;
  details?: Record<string, unknown>;
}

export type OverrideType =
  | "GOOGLE_MALICIOUS"
  | "URLHAUS_ONLINE"
  | "VIRUSTOTAL_DETECTIONS"
  | null;

export type CalculationMethod =
  | "SHORT_CIRCUIT_OVERRIDE"
  | "WEIGHTED_CALCULATION";

export interface RiskAssessmentResult {
  riskScore: number | null;
  riskLevel: RiskLevel | "INCONCLUSIVE";
  confidence: number;
  factors: RiskFactor[];
  summary: string;
  analysisStatus?: "COMPLETE" | "LIMITED" | "INSUFFICIENT_DATA";
  overrideTriggered?: boolean;
  overrideReason?: string | null;
  overrideType?: OverrideType;
  calculationMethod?: CalculationMethod;
}

export interface RiskEvaluation {
  score: number | null;
  level: RiskLevel | "INCONCLUSIVE";
  reasons: string[];
  appliedRules: string[];
  riskScore: number | null;
  riskLevel: "SAFE" | "SUSPICIOUS" | "DANGEROUS" | "INCONCLUSIVE";
  confidence: number;
  factors: RiskFactor[];
  findings: SecurityFinding[];
  assessment: RiskAssessmentResult;
  analysisStatus: "COMPLETE" | "LIMITED" | "INSUFFICIENT_DATA";
  summary: string;
  overrideTriggered: boolean;
  overrideReason: string | null;
  overrideType: OverrideType;
  calculationMethod: CalculationMethod;
}

// Backward compatibility export for factor weights
export interface FactorWeight {
  name: string;
  weight: number;
}

export const FACTOR_WEIGHTS: FactorWeight[] = [
  { name: "Google Safe Browsing", weight: 0.35 },
  { name: "VirusTotal", weight: 0.25 },
  { name: "URLhaus Malware Reputation", weight: 0.15 },
  { name: "URL Intelligence", weight: 0.15 },
  { name: "SSL/TLS", weight: 0.10 },
];

function getFactorImpact(score: number): FactorImpact {
  if (score >= 80) return "CRITICAL";
  if (score >= 60) return "HIGH";
  if (score >= 40) return "MODERATE";
  if (score >= 10) return "LOW";
  return "NONE";
}

// ============================================================================
// 1. Evidence Extractor — Google Safe Browsing
// ============================================================================

export function extractSafeBrowsingFindings(safeBrowsing?: SafeBrowsingResult): SecurityFinding[] {
  const findings: SecurityFinding[] = [];

  if (!safeBrowsing || !safeBrowsing.available || safeBrowsing.status === "UNAVAILABLE") {
    findings.push({
      source: "Google Safe Browsing",
      finding: "SAFE_BROWSING_UNAVAILABLE",
      severity: "INFO",
      explanation: safeBrowsing?.reason || "Google Safe Browsing threat database was unreachable during this scan.",
    });
    return findings;
  }

  if (safeBrowsing.status === "ERROR") {
    findings.push({
      source: "Google Safe Browsing",
      finding: "SAFE_BROWSING_ERROR",
      severity: "INFO",
      explanation: safeBrowsing.reason || "Google Safe Browsing returned an error response.",
    });
    return findings;
  }

  if (safeBrowsing.threatDetected) {
    const types = safeBrowsing.threatTypes || [];
    const isMalware = types.includes("MALWARE");
    const isPhishing = types.includes("SOCIAL_ENGINEERING");

    if (isPhishing) {
      findings.push({
        source: "Google Safe Browsing",
        finding: "CONFIRMED_PHISHING",
        severity: "CRITICAL",
        isConfirmedThreat: true,
        explanation: "Google Safe Browsing identified this URL as a confirmed phishing / social-engineering threat.",
        evidence: { threatTypes: types },
      });
    } else if (isMalware) {
      findings.push({
        source: "Google Safe Browsing",
        finding: "CONFIRMED_MALWARE",
        severity: "CRITICAL",
        isConfirmedThreat: true,
        explanation: "Google Safe Browsing identified this URL as an active malware distribution threat.",
        evidence: { threatTypes: types },
      });
    } else {
      findings.push({
        source: "Google Safe Browsing",
        finding: "CONFIRMED_UNSAFE_DESTINATION",
        severity: "CRITICAL",
        isConfirmedThreat: true,
        explanation: safeBrowsing.reason || "Google Safe Browsing flagged this destination as an active cyber threat.",
        evidence: { threatTypes: types },
      });
    }
  } else {
    findings.push({
      source: "Google Safe Browsing",
      finding: "SAFE_BROWSING_CLEAN",
      severity: "INFO",
      explanation: "No threats identified in Google Safe Browsing database.",
    });
  }

  return findings;
}

export function calculateSafeBrowsingScore(safeBrowsing?: SafeBrowsingResult): RiskFactor {
  const weight = 0.35;
  const findings = extractSafeBrowsingFindings(safeBrowsing);
  const critical = findings.find((f) => f.severity === "CRITICAL");

  if (!safeBrowsing || !safeBrowsing.available || safeBrowsing.status === "UNAVAILABLE") {
    return {
      name: "Google Safe Browsing",
      score: null,
      weight,
      contribution: 0,
      impact: "NONE",
      status: "UNAVAILABLE",
      reason: safeBrowsing?.reason || "Google Safe Browsing was unavailable.",
      available: false,
    };
  }

  if (safeBrowsing.status === "ERROR") {
    return {
      name: "Google Safe Browsing",
      score: null,
      weight,
      contribution: 0,
      impact: "NONE",
      status: "ERROR",
      reason: safeBrowsing.reason || "Google Safe Browsing API returned an error.",
      available: false,
    };
  }

  if (critical) {
    const score = safeBrowsing.score ?? (critical.finding === "CONFIRMED_MALWARE" ? 100 : 90);
    return {
      name: "Google Safe Browsing",
      score,
      weight,
      contribution: 0,
      impact: getFactorImpact(score),
      status: "THREAT_DETECTED",
      reason: critical.explanation,
      available: true,
      details: { threatTypes: safeBrowsing.threatTypes },
    };
  }

  return {
    name: "Google Safe Browsing",
    score: 0,
    weight,
    contribution: 0,
    impact: "NONE",
    status: "CHECKED",
    reason: "No threats identified in Google Safe Browsing.",
    available: true,
  };
}

// ============================================================================
// 2. Evidence Extractor — VirusTotal (With Diminishing Returns)
// ============================================================================

export function extractVirusTotalFindings(virusTotal: VirusTotalResult): SecurityFinding[] {
  const findings: SecurityFinding[] = [];

  if (!virusTotal.available || virusTotal.status === "unavailable" || virusTotal.status === "not_configured") {
    findings.push({
      source: "VirusTotal",
      finding: "VIRUSTOTAL_UNAVAILABLE",
      severity: "INFO",
      explanation: virusTotal.error || "VirusTotal service was unavailable during this scan.",
    });
    return findings;
  }

  const mal = virusTotal.maliciousCount ?? (virusTotal.malicious ? 1 : 0);
  const susp = virusTotal.suspiciousCount ?? (virusTotal.suspicious ? 1 : 0);
  const total = virusTotal.totalEngines ?? 0;

  if (total === 0 && mal === 0 && susp === 0) {
    findings.push({
      source: "VirusTotal",
      finding: "VIRUSTOTAL_NO_ENGINES",
      severity: "INFO",
      explanation: "No antivirus engines responded for this URL.",
    });
    return findings;
  }

  // Diminishing returns categorization:
  // - 1 detection: LOW (single vendor; may be false positive or early indicator)
  // - 2-3 detections: MEDIUM (concurrence from multiple vendors)
  // - 4-9 detections: HIGH (broad vendor consensus)
  // - 10+ detections: CRITICAL (mass vendor confirmation)
  if (mal >= 10 || (total > 0 && mal / total >= 0.15)) {
    findings.push({
      source: "VirusTotal",
      finding: "VT_MASS_MALICIOUS_CONSENSUS",
      severity: "CRITICAL",
      isConfirmedThreat: true,
      explanation: `Mass vendor confirmation: ${mal} of ${total} security engines flagged this URL as malicious.`,
      evidence: { maliciousCount: mal, totalEngines: total, detectionRatio: virusTotal.detectionRatio },
    });
  } else if (mal >= 4 || (total > 0 && mal / total >= 0.06)) {
    findings.push({
      source: "VirusTotal",
      finding: "VT_HIGH_DETECTION_CONSENSUS",
      severity: "HIGH",
      isConfirmedThreat: true,
      explanation: `Multiple vendor consensus: ${mal} of ${total} security engines flagged this URL as malicious.`,
      evidence: { maliciousCount: mal, totalEngines: total, detectionRatio: virusTotal.detectionRatio },
    });
  } else if (mal >= 2) {
    findings.push({
      source: "VirusTotal",
      finding: "VT_CONCURRENT_DETECTIONS",
      severity: "MODERATE",
      explanation: `${mal} security vendors independently flagged this URL as malicious.`,
      evidence: { maliciousCount: mal, totalEngines: total },
    });
  } else if (mal === 1) {
    findings.push({
      source: "VirusTotal",
      finding: "VT_SINGLE_VENDOR_DETECTION",
      severity: "LOW",
      explanation: "1 security vendor flagged this URL as malicious (possible emerging threat or isolated false positive).",
      evidence: { maliciousCount: 1, totalEngines: total },
    });
  } else if (susp >= 3) {
    findings.push({
      source: "VirusTotal",
      finding: "VT_SUSPICIOUS_CONSENSUS",
      severity: "MODERATE",
      explanation: `${susp} security vendors flagged this URL as suspicious on VirusTotal.`,
      evidence: { suspiciousCount: susp, totalEngines: total },
    });
  } else if (susp >= 1) {
    findings.push({
      source: "VirusTotal",
      finding: "VT_SUSPICIOUS_DETECTION",
      severity: "LOW",
      explanation: `${susp} security vendor flagged this URL as suspicious on VirusTotal.`,
      evidence: { suspiciousCount: susp, totalEngines: total },
    });
  } else {
    findings.push({
      source: "VirusTotal",
      finding: "VIRUSTOTAL_CLEAN",
      severity: "INFO",
      explanation: `All ${total} security vendors on VirusTotal classified this destination as clean.`,
      evidence: { totalEngines: total, harmless: virusTotal.harmless },
    });
  }

  return findings;
}

export function calculateVirusTotalScore(virusTotal: VirusTotalResult): RiskFactor {
  const weight = 0.25;
  const findings = extractVirusTotalFindings(virusTotal);
  const primary = findings[0];

  if (!virusTotal.available || virusTotal.status === "unavailable" || virusTotal.status === "not_configured") {
    return {
      name: "VirusTotal",
      score: null,
      weight,
      contribution: 0,
      impact: "NONE",
      status: "UNAVAILABLE",
      reason: virusTotal.error || "VirusTotal service was unavailable during this scan.",
      available: false,
    };
  }

  const mal = virusTotal.maliciousCount ?? 0;
  const total = virusTotal.totalEngines ?? 0;

  if (total === 0 && mal === 0) {
    return {
      name: "VirusTotal",
      score: null,
      weight,
      contribution: 0,
      impact: "NONE",
      status: "UNAVAILABLE",
      reason: "No antivirus engines responded for this URL.",
      available: false,
    };
  }

  let score = 0;
  let status: FactorStatus = "CHECKED";

  if (primary.severity === "CRITICAL") {
    score = 100;
    status = "MALICIOUS_DETECTIONS";
  } else if (primary.severity === "HIGH") {
    score = 80;
    status = "MALICIOUS_DETECTIONS";
  } else if (primary.severity === "MODERATE" || primary.severity === "MEDIUM") {
    score = mal >= 2 ? 60 : 45;
    status = mal >= 2 ? "MALICIOUS_DETECTIONS" : "SUSPICIOUS_FEATURES";
  } else if (primary.severity === "LOW") {
    score = mal === 1 ? 40 : 25;
    status = mal === 1 ? "MALICIOUS_DETECTIONS" : "SUSPICIOUS_FEATURES";
  }

  return {
    name: "VirusTotal",
    score,
    weight,
    contribution: 0,
    impact: getFactorImpact(score),
    status,
    reason: primary.explanation,
    available: true,
    details: {
      detectionRatio: virusTotal.detectionRatio,
      maliciousCount: mal,
      totalEngines: total,
    },
  };
}

// ============================================================================
// 3. Evidence Extractor — URLhaus Malware Intelligence
// ============================================================================

export function extractUrlhausFindings(urlhaus?: UrlhausResult): SecurityFinding[] {
  const findings: SecurityFinding[] = [];

  if (!urlhaus || !urlhaus.available || urlhaus.status === "UNAVAILABLE") {
    findings.push({
      source: "URLhaus",
      finding: "URLHAUS_UNAVAILABLE",
      severity: "INFO",
      explanation: urlhaus?.reason || "URLhaus malware intelligence was unavailable during this scan.",
    });
    return findings;
  }

  if (urlhaus.status === "ERROR") {
    findings.push({
      source: "URLhaus",
      finding: "URLHAUS_ERROR",
      severity: "INFO",
      explanation: urlhaus.reason || "URLhaus query failed due to a service error.",
    });
    return findings;
  }

  if (urlhaus.match || urlhaus.status === "MALWARE_URL_DETECTED") {
    findings.push({
      source: "URLhaus",
      finding: "ACTIVE_MALWARE_PAYLOAD",
      severity: "CRITICAL",
      isConfirmedThreat: true,
      explanation: `URLhaus verified this destination as an active malware distribution source (${urlhaus.threatType || "malware_download"}).`,
      evidence: { threatType: urlhaus.threatType, tags: urlhaus.tags },
    });
  } else {
    findings.push({
      source: "URLhaus",
      finding: "URLHAUS_CLEAN",
      severity: "INFO",
      explanation: "URL is not listed in URLhaus active malware database.",
    });
  }

  return findings;
}

export function calculateUrlhausScore(urlhaus?: UrlhausResult): RiskFactor {
  const weight = 0.15;
  const findings = extractUrlhausFindings(urlhaus);
  const match = findings.find((f) => f.severity === "CRITICAL");

  if (!urlhaus || !urlhaus.available || urlhaus.status === "UNAVAILABLE") {
    return {
      name: "URLhaus Malware Reputation",
      score: null,
      weight,
      contribution: 0,
      impact: "NONE",
      status: "UNAVAILABLE",
      reason: urlhaus?.reason || "URLhaus service was unavailable during this scan.",
      available: false,
    };
  }

  if (urlhaus.status === "ERROR") {
    return {
      name: "URLhaus Malware Reputation",
      score: null,
      weight,
      contribution: 0,
      impact: "NONE",
      status: "ERROR",
      reason: urlhaus.reason || "URLhaus service returned an error.",
      available: false,
    };
  }

  if (match) {
    return {
      name: "URLhaus Malware Reputation",
      score: 100,
      weight,
      contribution: 0,
      impact: "CRITICAL",
      status: "MALWARE_DETECTED",
      reason: match.explanation,
      available: true,
      details: { threatType: urlhaus.threatType, tags: urlhaus.tags },
    };
  }

  return {
    name: "URLhaus Malware Reputation",
    score: 0,
    weight,
    contribution: 0,
    impact: "NONE",
    status: "CHECKED_NO_MATCH",
    reason: "No malware distribution records found in URLhaus.",
    available: true,
  };
}

// ============================================================================
// 4. Evidence Extractor — URL Structural & Heuristic Intelligence
// ============================================================================

export function extractUrlIntelligenceFindings(
  urlIntel: UrlIntelligenceResult | string,
  normalizedUrlStr?: string
): SecurityFinding[] {
  const findings: SecurityFinding[] = [];
  const rawUrl = typeof urlIntel === "string" ? urlIntel : (normalizedUrlStr || "");
  const lowerUrl = rawUrl.toLowerCase();
  const result: UrlIntelligenceResult =
    typeof urlIntel === "string" ? analyzeUrlIntelligence(urlIntel) : urlIntel;

  // 1. Check for credential obfuscation '@'
  if (lowerUrl.includes("@")) {
    findings.push({
      source: "URL Intelligence",
      finding: "URL_CREDENTIAL_OBFUSCATION",
      severity: "HIGH",
      explanation: "URL contains '@' credential symbol used to mislead users regarding destination host.",
    });
  }

  // 2. Check for numeric IP address
  const hostMatch = rawUrl.match(/^(?:https?:\/\/)?([^/?#:]+)/i);
  const hostname = hostMatch ? hostMatch[1].toLowerCase() : "";
  const ipOctets = hostname.split(".").map(Number);
  const isIp = ipOctets.length === 4 && ipOctets.every((o) => !isNaN(o) && o >= 0 && o <= 255);

  if (isIp) {
    const hasSensitivePath = ["login", "verify", "account", "bank", "secure", "bin", "exe", "update", "signin"].some(
      (kw) => lowerUrl.includes(kw)
    );
    findings.push({
      source: "URL Intelligence",
      finding: "URL_RAW_IP_DESTINATION",
      severity: hasSensitivePath ? "HIGH" : "MODERATE",
      explanation: hasSensitivePath
        ? "Destination uses a numeric IP address hosting sensitive authentication or executable paths."
        : "Destination uses a numeric IP address instead of a registered domain name.",
    });
  }

  // 3. Check for Punycode homograph
  if (lowerUrl.includes("xn--")) {
    findings.push({
      source: "URL Intelligence",
      finding: "URL_PUNYCODE_HOMOGRAPH",
      severity: "MODERATE",
      explanation: "Hostname contains Punycode / Internationalized Domain Name characters frequently used in spoofing.",
    });
  }

  // 4. Check for length
  if (rawUrl.length > 75) {
    findings.push({
      source: "URL Intelligence",
      finding: "URL_EXCESSIVE_LENGTH",
      severity: "LOW",
      explanation: `URL length (${rawUrl.length} characters) is unusually long, commonly used to conceal destinations.`,
    });
  }

  // 5. Add any additional indicators from the URL Intelligence result
  if (result && result.indicators) {
    for (const ind of result.indicators) {
      const name = ind.name.toLowerCase();
      if (name.includes("ip") && isIp) continue;
      if (name.includes("punycode") && lowerUrl.includes("xn--")) continue;
      if (name.includes("length") && rawUrl.length > 75) continue;
      if (name.includes("credential") && lowerUrl.includes("@")) continue;

      if (name.includes("subdomain")) {
        findings.push({
          source: "URL Intelligence",
          finding: "URL_EXCESSIVE_SUBDOMAINS",
          severity: "LOW",
          explanation: ind.reason || "Hostname contains excessive subdomain depth.",
        });
      } else if (name.includes("tld")) {
        findings.push({
          source: "URL Intelligence",
          finding: "URL_HIGH_RISK_TLD",
          severity: "LOW",
          explanation: ind.reason || "Domain belongs to a high-risk top-level domain.",
        });
      }
    }
  }

  if (findings.length === 0) {
    findings.push({
      source: "URL Intelligence",
      finding: "URL_STRUCTURE_CLEAN",
      severity: "INFO",
      explanation: "URL structure exhibits standard formatting with no deceptive indicators.",
    });
  }

  return findings;
}

export function calculateUrlIntelligenceScore(
  urlIntel: UrlIntelligenceResult | string,
  _domain?: string
): RiskFactor {
  const weight = 0.15;
  const result: UrlIntelligenceResult =
    typeof urlIntel === "string" ? analyzeUrlIntelligence(urlIntel) : urlIntel;

  if (result.status === "ERROR") {
    return {
      name: "URL Intelligence",
      score: null,
      weight,
      contribution: 0,
      impact: "NONE",
      status: "ERROR",
      reason: result.reasons[0] || "URL Intelligence check failed.",
      available: false,
    };
  }

  const score = result.score;
  const status: FactorStatus = score >= 50 ? "SUSPICIOUS_FEATURES" : score > 0 ? "CHECKED" : "CHECKED";
  const reason =
    result.reasons && result.reasons.length > 0
      ? result.reasons[0]
      : "URL structure exhibits standard formatting.";

  return {
    name: "URL Intelligence",
    score,
    weight,
    contribution: 0,
    impact: getFactorImpact(score),
    status,
    reason,
    available: true,
    details: {
      indicators: result.indicators,
      evidence: result.evidence,
    },
  };
}

// ============================================================================
// 5. Evidence Extractor — SSL/TLS Security
// ============================================================================

export function extractSslFindings(
  sslData?: SslAnalysisResult | SslAnalysisOutput | null,
  normalizedUrl?: string
): SecurityFinding[] {
  const findings: SecurityFinding[] = [];
  const urlLower = String(normalizedUrl || "").toLowerCase();
  const isHttp = urlLower.startsWith("http://");

  if (isHttp || (sslData && "protocol" in sslData && sslData.protocol === "HTTP") || (sslData && "enabled" in sslData && sslData.enabled === false)) {
    findings.push({
      source: "SSL/TLS",
      finding: "UNENCRYPTED_HTTP",
      severity: "LOW",
      explanation: "Connection uses cleartext HTTP without TLS encryption.",
    });
    return findings;
  }

  if (!sslData) {
    findings.push({
      source: "SSL/TLS",
      finding: "SSL_UNAVAILABLE",
      severity: "INFO",
      explanation: "SSL/TLS certificate could not be inspected during this scan.",
    });
    return findings;
  }

  // Modern SslAnalysisOutput format
  if ("protocol" in sslData) {
    const s = sslData as SslAnalysisOutput;
    if (s.status === "UNAVAILABLE" || s.status === "ERROR") {
      findings.push({
        source: "SSL/TLS",
        finding: "SSL_UNAVAILABLE",
        severity: "INFO",
        explanation: s.reason || "SSL/TLS inspection was unavailable.",
      });
      return findings;
    }

    if (s.protocol === "HTTP") {
      findings.push({
        source: "SSL/TLS",
        finding: "UNENCRYPTED_HTTP",
        severity: "LOW",
        explanation: "Connection uses cleartext HTTP without encryption.",
      });
      return findings;
    }

    const certObj = (s.certificate || {}) as Record<string, unknown>;
    const certStatus = String(certObj.certificateStatus || s.reason || "").toLowerCase();

    if (certStatus.includes("mismatch") || certStatus.includes("hostname")) {
      findings.push({
        source: "SSL/TLS",
        finding: "SSL_HOSTNAME_MISMATCH",
        severity: "HIGH",
        explanation: "Certificate subject name does not match the requested hostname.",
      });
    } else if (certStatus.includes("expired")) {
      findings.push({
        source: "SSL/TLS",
        finding: "SSL_EXPIRED_CERTIFICATE",
        severity: "MODERATE",
        explanation: "The SSL/TLS certificate has expired, compromising traffic encryption assurance.",
      });
    } else if (certStatus.includes("self_signed") || certStatus.includes("self-signed")) {
      findings.push({
        source: "SSL/TLS",
        finding: "SSL_SELF_SIGNED_CERTIFICATE",
        severity: "MODERATE",
        explanation: "The certificate is self-signed and not issued by a publicly trusted Certificate Authority.",
      });
    } else if (s.level === "SAFE" || s.score === 0) {
      findings.push({
        source: "SSL/TLS",
        finding: "SSL_VALID_CERTIFICATE",
        severity: "INFO",
        explanation: "Valid SSL/TLS certificate issued by a trusted Certificate Authority. Note: HTTPS encrypts traffic but does not guarantee the site is safe from fraud.",
      });
    } else {
      findings.push({
        source: "SSL/TLS",
        finding: "SSL_ANOMALY",
        severity: "MODERATE",
        explanation: s.reason || "SSL/TLS configuration exhibits validation anomalies.",
      });
    }
    return findings;
  }

  // Legacy SslAnalysisResult format
  const l = sslData as SslAnalysisResult;
  if (l.status === "unavailable") {
    findings.push({
      source: "SSL/TLS",
      finding: "SSL_UNAVAILABLE",
      severity: "INFO",
      explanation: "SSL/TLS certificate was not available.",
    });
    return findings;
  }

  if (l.valid && l.status === "valid") {
    findings.push({
      source: "SSL/TLS",
      finding: "SSL_VALID_CERTIFICATE",
      severity: "INFO",
      explanation: `Valid SSL/TLS certificate issued by ${l.issuer || "trusted CA"}. Note: HTTPS encrypts traffic but does not guarantee the site is safe from fraud.`,
    });
  } else if (l.status === "expired") {
    findings.push({
      source: "SSL/TLS",
      finding: "SSL_EXPIRED_CERTIFICATE",
      severity: "MODERATE",
      explanation: "The SSL/TLS certificate has expired.",
    });
  } else if (l.status === "self_signed") {
    findings.push({
      source: "SSL/TLS",
      finding: "SSL_SELF_SIGNED_CERTIFICATE",
      severity: "MODERATE",
      explanation: "The certificate is self-signed and untrusted.",
    });
  } else {
    findings.push({
      source: "SSL/TLS",
      finding: "SSL_INVALID_CERTIFICATE",
      severity: "MODERATE",
      explanation: "The certificate could not be verified by standard trust stores.",
    });
  }

  return findings;
}

export function calculateSSLScore(sslData?: SslAnalysisResult | SslAnalysisOutput | null): RiskFactor {
  const weight = 0.10;
  const findings = extractSslFindings(sslData);
  const primary = findings[0];

  if (!sslData || primary.finding === "SSL_UNAVAILABLE") {
    return {
      name: "SSL/TLS",
      score: null,
      weight,
      contribution: 0,
      impact: "NONE",
      status: "UNAVAILABLE",
      reason: primary.explanation,
      available: false,
    };
  }

  if (primary.finding === "SSL_VALID_CERTIFICATE") {
    return {
      name: "SSL/TLS",
      score: 0,
      weight,
      contribution: 0,
      impact: "NONE",
      status: "VALID",
      reason: primary.explanation,
      available: true,
    };
  }

  let score = 30;
  let status: FactorStatus = "INVALID_CERTIFICATE";

  if (primary.severity === "HIGH") {
    score = 75;
    status = "HOSTNAME_MISMATCH";
  } else if (primary.severity === "MODERATE" || primary.severity === "MEDIUM") {
    score = 60;
    status = primary.finding.includes("EXPIRED") ? "EXPIRED_CERTIFICATE" : "INVALID_CERTIFICATE";
  } else if (primary.severity === "LOW") {
    score = 40;
    status = "NO_HTTPS";
  }

  return {
    name: "SSL/TLS",
    score,
    weight,
    contribution: 0,
    impact: getFactorImpact(score),
    status,
    reason: primary.explanation,
    available: true,
  };
}

// ============================================================================
// Confidence Calculation (Separate from Risk Score)
// ============================================================================

export function calculateConfidence(factors: RiskFactor[]): number {
  let confidence = 100;

  for (const factor of factors) {
    if (!factor.available) {
      if (factor.name === "Google Safe Browsing") confidence -= 25;
      else if (factor.name === "VirusTotal") confidence -= 20;
      else if (factor.name === "URLhaus Malware Reputation") confidence -= 15;
      else if (factor.name === "URL Intelligence") confidence -= 10;
      else if (factor.name === "SSL/TLS") confidence -= 10;
    }
  }

  const availableFactors = factors.filter((f) => f.available);
  if (availableFactors.length <= 1) {
    confidence -= 15;
  } else if (availableFactors.length <= 2) {
    confidence -= 8;
  }

  // Contradictory evidence penalty (e.g. external feeds clean, but local heuristics high risk)
  const availableWithScores = availableFactors.filter((f) => f.score !== null);
  if (availableWithScores.length >= 2) {
    const scores = availableWithScores.map((f) => f.score as number);
    const hasMixedSignals = scores.some((s) => s <= 10) && scores.some((s) => s >= 60);
    if (hasMixedSignals) {
      confidence -= 10;
    }
  }

  return Math.max(0, Math.min(100, Math.round(confidence)));
}

// ============================================================================
// Evidence-Based Risk Score Aggregation Engine
// ============================================================================

export interface CalculateRiskScoreParams {
  normalizedUrl: string;
  domain: string;
  ssl?: SslAnalysisResult | SslAnalysisOutput | null;
  sslAnalysis?: SslAnalysisOutput;
  safeBrowsing?: SafeBrowsingResult;
  virusTotal: VirusTotalResult;
  urlhaus?: UrlhausResult;
  urlIntelligence?: UrlIntelligenceResult;
}

// ============================================================================
// Stage 1: Short-Circuit Override Engine
// ============================================================================

export interface ShortCircuitOverrideResult {
  triggered: boolean;
  score: number;
  level: RiskLevel;
  overrideType: OverrideType;
  reasons: string[];
  primaryReason: string | null;
}

export function checkShortCircuitOverrides(params: {
  safeBrowsing?: SafeBrowsingResult;
  urlhaus?: UrlhausResult;
  virusTotal?: VirusTotalResult;
}): ShortCircuitOverrideResult {
  const { safeBrowsing, urlhaus, virusTotal } = params;

  // RULE 1: Google Safe Browsing == malicious/threat detected
  const isGoogleMalicious = Boolean(
    safeBrowsing &&
    safeBrowsing.available !== false &&
    safeBrowsing.status !== "CHECKED_NO_THREAT" &&
    safeBrowsing.status !== "UNAVAILABLE" &&
    safeBrowsing.status !== "ERROR" &&
    (safeBrowsing.threatDetected === true ||
      safeBrowsing.status === "THREAT_DETECTED" ||
      (Array.isArray(safeBrowsing.threatTypes) && safeBrowsing.threatTypes.length > 0) ||
      (safeBrowsing as any).malicious === true)
  );

  // RULE 2: URLhaus status == "online" / active malicious URL
  // Only trigger when normalized URLhaus status is actually "online" / active malicious URL
  // Do NOT trigger for: CHECKED_NO_MATCH, UNAVAILABLE, ERROR
  const isUrlhausOnline = Boolean(
    urlhaus &&
    urlhaus.available !== false &&
    urlhaus.status !== "CHECKED_NO_MATCH" &&
    urlhaus.status !== "UNAVAILABLE" &&
    urlhaus.status !== "ERROR" &&
    (
      String(urlhaus.status).toLowerCase() === "online" ||
      urlhaus.status === "MALWARE_URL_DETECTED" ||
      String((urlhaus as any).url_status).toLowerCase() === "online" ||
      urlhaus.match === true
    )
  );

  // RULE 3: VirusTotal detections >= 4
  // Do NOT trigger for: 0, 1, 2, 3 detections; unavailable; not_configured; error
  const vtDetections = (
    virusTotal &&
    virusTotal.available !== false &&
    virusTotal.status !== "unavailable" &&
    virusTotal.status !== "not_configured"
  )
    ? (typeof virusTotal.maliciousCount === "number"
        ? virusTotal.maliciousCount
        : (virusTotal.malicious ? 1 : 0))
    : 0;
  const isVirusTotalCritical = vtDetections >= 4;

  const triggeredReasons: string[] = [];

  if (isGoogleMalicious) {
    triggeredReasons.push("Google Safe Browsing detected a malicious threat.");
  }
  if (isUrlhausOnline) {
    triggeredReasons.push("URLhaus identified the URL as an active malicious URL.");
  }
  if (isVirusTotalCritical) {
    triggeredReasons.push("VirusTotal reported four or more security detections.");
  }

  if (triggeredReasons.length === 0) {
    return {
      triggered: false,
      score: 0,
      level: "SAFE",
      overrideType: null,
      reasons: [],
      primaryReason: null,
    };
  }

  // Priority order:
  // 1. Google Safe Browsing malicious
  // 2. URLhaus online
  // 3. VirusTotal detections >= 4
  let overrideType: OverrideType = null;
  let score = 99;

  if (isGoogleMalicious) {
    overrideType = "GOOGLE_MALICIOUS";
    score = 99;
  } else if (isUrlhausOnline) {
    overrideType = "URLHAUS_ONLINE";
    score = 99;
  } else {
    overrideType = "VIRUSTOTAL_DETECTIONS";
    score = 95;
  }

  return {
    triggered: true,
    score,
    level: "CRITICAL",
    overrideType,
    reasons: triggeredReasons,
    primaryReason: triggeredReasons.join(" "),
  };
}

// ============================================================================
// Stage 2: Normal Weighted Risk Calculation Engine
// ============================================================================

export interface WeightedRiskResult {
  score: number;
  level: RiskLevel;
}

export function calculateWeightedRisk(params: {
  allFindings: SecurityFinding[];
  allFactors: RiskFactor[];
}): WeightedRiskResult {
  const { allFindings } = params;

  const criticalFindings = allFindings.filter((f) => f.severity === "CRITICAL");
  const highFindings = allFindings.filter((f) => f.severity === "HIGH");
  const moderateFindings = allFindings.filter((f) => f.severity === "MODERATE" || f.severity === "MEDIUM");
  const lowFindings = allFindings.filter((f) => f.severity === "LOW");

  let calculatedScore = 0;

  // RULE A: Confirmed Critical Threat Evidence (when no override was triggered)
  if (criticalFindings.length > 0) {
    calculatedScore = 80;
    if (criticalFindings.length >= 2) calculatedScore = 88;
    if (highFindings.length > 0) calculatedScore += 5;
    if (moderateFindings.length > 0) calculatedScore += 3;
    calculatedScore = Math.min(100, calculatedScore);
  }
  // RULE B: High Severity Evidence (e.g. credential spoofing, raw IP with sensitive path, SSL hostname mismatch)
  else if (highFindings.length > 0) {
    calculatedScore = 65;
    if (highFindings.length >= 2) calculatedScore += 10;
    if (moderateFindings.length > 0) calculatedScore += 5;
    if (lowFindings.length > 0) calculatedScore += 2;
    calculatedScore = Math.min(79, calculatedScore);
  }
  // RULE C: Moderate Severity Evidence (e.g. 2-3 VT detections, expired/self-signed SSL, Punycode, raw IP)
  else if (moderateFindings.length > 0) {
    calculatedScore = 40;
    calculatedScore += Math.min(18, (moderateFindings.length - 1) * 6);
    if (lowFindings.length > 0) calculatedScore += 4;
    calculatedScore = Math.min(59, calculatedScore);
  }
  // RULE D: Low Severity Evidence Only (e.g. unencrypted HTTP, long URL, high-risk TLD, 1 VT detection)
  else if (lowFindings.length > 0) {
    const hasSingleVt = lowFindings.some((f) => f.finding === "VT_SINGLE_VENDOR_DETECTION");
    calculatedScore = hasSingleVt ? 28 : 20;
    calculatedScore += Math.min(12, (lowFindings.length - 1) * 4);
    calculatedScore = Math.min(38, calculatedScore);
  }
  // RULE E: Clean / Informational Baseline
  else {
    calculatedScore = 0;
  }

  const finalScore = Math.max(0, Math.min(100, Math.round(calculatedScore)));
  return {
    score: finalScore,
    level: getRiskLevel(finalScore),
  };
}

export function calculateRiskScore(params: CalculateRiskScoreParams): RiskEvaluation {
  const { normalizedUrl, domain, ssl, sslAnalysis, safeBrowsing, virusTotal, urlhaus, urlIntelligence } = params;

  // 1. Extract granular security findings from each intelligence source
  const safeBrowsingFindings = extractSafeBrowsingFindings(safeBrowsing);
  const virusTotalFindings = extractVirusTotalFindings(virusTotal);
  const urlhausFindings = extractUrlhausFindings(urlhaus);
  const urlIntelFindings = extractUrlIntelligenceFindings(urlIntelligence || normalizedUrl, normalizedUrl);
  const sslFindings = extractSslFindings(sslAnalysis || ssl, normalizedUrl);

  const allFindings: SecurityFinding[] = [
    ...safeBrowsingFindings,
    ...virusTotalFindings,
    ...urlhausFindings,
    ...urlIntelFindings,
    ...sslFindings,
  ];

  // 2. Factor representations for backward compatibility and weighting
  const safeBrowsingFactor = calculateSafeBrowsingScore(safeBrowsing);
  const virusTotalFactor = calculateVirusTotalScore(virusTotal);
  const urlhausFactor = calculateUrlhausScore(urlhaus);
  const urlIntelFactor = calculateUrlIntelligenceScore(urlIntelligence || normalizedUrl, domain);
  const sslFactor = calculateSSLScore(sslAnalysis || ssl);

  const allFactors: RiskFactor[] = [
    safeBrowsingFactor,
    virusTotalFactor,
    urlhausFactor,
    urlIntelFactor,
    sslFactor,
  ];

  const availableFactors = allFactors.filter((f) => f.available && f.score !== null);

  // Insufficient signals check: all checks unavailable
  if (availableFactors.length === 0) {
    for (const factor of allFactors) factor.contribution = 0;
    const summary = "Insufficient security signals were available to determine the risk of this URL. Please try again later.";
    const assessment: RiskAssessmentResult = {
      riskScore: null,
      riskLevel: "INCONCLUSIVE",
      confidence: 0,
      factors: allFactors,
      summary,
      analysisStatus: "INSUFFICIENT_DATA",
      overrideTriggered: false,
      overrideReason: null,
      overrideType: null,
      calculationMethod: "WEIGHTED_CALCULATION",
    };

    return {
      score: null,
      level: "INCONCLUSIVE",
      reasons: [summary],
      appliedRules: [],
      riskScore: null,
      riskLevel: "INCONCLUSIVE",
      confidence: 0,
      factors: allFactors,
      findings: allFindings,
      assessment,
      analysisStatus: "INSUFFICIENT_DATA",
      summary,
      overrideTriggered: false,
      overrideReason: null,
      overrideType: null,
      calculationMethod: "WEIGHTED_CALCULATION",
    };
  }

  // External intelligence availability check
  const externalFactors = [safeBrowsingFactor, virusTotalFactor, urlhausFactor];
  const allExternalFailed = externalFactors.every((f) => !f.available || f.score === null);
  const analysisStatus: "COMPLETE" | "LIMITED" = allExternalFailed ? "LIMITED" : "COMPLETE";

  // ==========================================================================
  // STAGE 1: Mandatory Short-Circuit Override Rules Check
  // The system MUST ALWAYS check the override rules FIRST.
  // Only when NO override condition is triggered should normal weighted risk run.
  // ==========================================================================
  const override = checkShortCircuitOverrides({ safeBrowsing, urlhaus, virusTotal });

  let finalScore: number;
  let riskLevel: RiskLevel;
  let overrideTriggered: boolean;
  let overrideReason: string | null;
  let overrideType: OverrideType;
  let calculationMethod: CalculationMethod;

  if (override.triggered) {
    finalScore = override.score;
    riskLevel = override.level; // "CRITICAL"
    overrideTriggered = true;
    overrideReason = override.primaryReason;
    overrideType = override.overrideType;
    calculationMethod = "SHORT_CIRCUIT_OVERRIDE";
  } else {
    // ==========================================================================
    // STAGE 2: Normal Weighted Risk Calculation
    // ==========================================================================
    const weightedResult = calculateWeightedRisk({ allFindings, allFactors });
    finalScore = weightedResult.score;
    riskLevel = weightedResult.level;
    overrideTriggered = false;
    overrideReason = null;
    overrideType = null;
    calculationMethod = "WEIGHTED_CALCULATION";
  }

  // Distribute factor contributions so sum of contributions equals finalScore
  const threatFactors = allFactors.filter((f) => f.available && f.score !== null && f.score > 0);
  if (threatFactors.length > 0 && finalScore > 0) {
    const totalRaw = threatFactors.reduce((sum, f) => sum + (f.score as number), 0);
    let distributedSum = 0;

    for (let i = 0; i < threatFactors.length; i++) {
      const f = threatFactors[i];
      if (i === threatFactors.length - 1) {
        f.contribution = parseFloat((finalScore - distributedSum).toFixed(2));
      } else {
        const share = Math.round((((f.score as number) / totalRaw) * finalScore) * 100) / 100;
        f.contribution = share;
        distributedSum += share;
      }
    }
  } else {
    for (const f of allFactors) {
      f.contribution = 0;
    }
  }

  const confidence = calculateConfidence(allFactors);

  // Build reasons and applied rules
  const reasons: string[] = [];
  const appliedRules: string[] = [];

  if (overrideTriggered && overrideReason) {
    reasons.push(`[CRITICAL] Short-Circuit Override: ${overrideReason}`);
    appliedRules.push(`Short-Circuit Override -> ${overrideType} (Score: ${finalScore})`);
  }

  const activeFindings = allFindings.filter((f) => f.severity !== "INFO");
  for (const finding of activeFindings) {
    reasons.push(`[${finding.severity}] ${finding.source}: ${finding.explanation}`);
    appliedRules.push(`${finding.source} -> ${finding.finding} (${finding.severity})`);
  }

  if (reasons.length === 0) {
    reasons.push("No threat indicators detected across available security checks.");
  }

  // Build high-level summary
  let summary = "";
  if (overrideTriggered) {
    summary = `Critical threat detected (${finalScore}/100 - ${riskLevel}). Short-Circuit Override: ${overrideReason} Accessing this destination poses immediate cybersecurity risks.`;
  } else if (allExternalFailed) {
    summary = "External threat intelligence services were unavailable. This result is based on local URL structure and SSL/TLS analysis.";
  } else if (riskLevel === "CRITICAL" || riskLevel === "HIGH") {
    summary = `High risk detected (${finalScore}/100 - ${riskLevel}). Multiple security anomalies or vendor detections identified. Proceed with extreme caution.`;
  } else if (riskLevel === "MODERATE") {
    summary = `Moderate risk (${finalScore}/100 - ${riskLevel}). Noticeable security weaknesses or suspicious attributes identified. Avoid entering sensitive credentials.`;
  } else if (riskLevel === "LOW") {
    summary = `Low risk (${finalScore}/100 - ${riskLevel}). Minor structural anomalies or unencrypted HTTP detected, but no confirmed malicious threat.`;
  } else {
    summary = `Clean baseline (${finalScore}/100 - ${riskLevel}). No threat indicators identified across available intelligence checks. (Notice: 'Not detected' does not guarantee the URL is permanently safe).`;
  }

  let legacyRiskLevel: "SAFE" | "SUSPICIOUS" | "DANGEROUS" = "SAFE";
  if (finalScore >= 60) {
    legacyRiskLevel = "DANGEROUS";
  } else if (finalScore >= 20) {
    legacyRiskLevel = "SUSPICIOUS";
  }

  const assessment: RiskAssessmentResult = {
    riskScore: finalScore,
    riskLevel,
    confidence,
    factors: allFactors,
    summary,
    analysisStatus,
    overrideTriggered,
    overrideReason,
    overrideType,
    calculationMethod,
  };

  return {
    score: finalScore,
    level: riskLevel,
    reasons,
    appliedRules,
    riskScore: finalScore,
    riskLevel: legacyRiskLevel,
    confidence,
    factors: allFactors,
    findings: allFindings,
    assessment,
    analysisStatus,
    summary,
    overrideTriggered,
    overrideReason,
    overrideType,
    calculationMethod,
  };
}
