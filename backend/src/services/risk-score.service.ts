import { SslAnalysisResult } from "./ssl.service";
import { SslAnalysisOutput } from "./ssl-analysis.service";
import { UrlIntelligenceResult, analyzeUrlIntelligence } from "./url-intelligence.service";
import { VirusTotalResult } from "./virustotal.service";
import { SafeBrowsingResult } from "./safe-browsing.service";
import { UrlhausResult } from "./threat-intelligence/urlhaus.service";

// ============================================================================
// Risk Level Classification
// Authoritative Thresholds:
// SAFE: 0–19 | LOW: 20–39 | MODERATE: 40–59 | HIGH: 60–79 | CRITICAL: 80–100
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
// Risk Factor Types
// ============================================================================

export type FactorImpact = "NONE" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

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

export interface RiskAssessmentResult {
  riskScore: number | null;
  riskLevel: RiskLevel | "INCONCLUSIVE";
  confidence: number;
  factors: RiskFactor[];
  summary: string;
  analysisStatus?: "COMPLETE" | "LIMITED" | "INSUFFICIENT_DATA";
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
  assessment: RiskAssessmentResult;
  analysisStatus: "COMPLETE" | "LIMITED" | "INSUFFICIENT_DATA";
  summary: string;
}

// ============================================================================
// Factor Weight Configuration (V2)
// Google Safe Browsing: 35%
// VirusTotal:           25%
// URLhaus:              15%
// URL Intelligence:     15%
// SSL/TLS:              10%
// Total:               100%
// ============================================================================

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
  if (score >= 40) return "MEDIUM";
  if (score >= 10) return "LOW";
  return "NONE";
}

// ============================================================================
// 1. GOOGLE SAFE BROWSING SCORE
// ============================================================================

export function calculateSafeBrowsingScore(safeBrowsing?: SafeBrowsingResult): RiskFactor {
  const weight = 0.35;

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

  if (safeBrowsing.threatDetected && safeBrowsing.score !== null) {
    return {
      name: "Google Safe Browsing",
      score: safeBrowsing.score,
      weight,
      contribution: 0,
      impact: getFactorImpact(safeBrowsing.score),
      status: "THREAT_DETECTED",
      reason: safeBrowsing.reason,
      available: true,
      details: {
        threatTypes: safeBrowsing.threatTypes,
      },
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
// 2. VIRUSTOTAL SCORE
// ============================================================================

export function calculateVirusTotalScore(virusTotal: VirusTotalResult): RiskFactor {
  const weight = 0.25;

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
  const susp = virusTotal.suspiciousCount ?? 0;
  const total = virusTotal.totalEngines ?? 0;

  if (total === 0) {
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

  let score: number;
  let status: FactorStatus = "CHECKED";
  let reason: string;

  if (mal === 0 && susp === 0) {
    score = 0;
    reason = `All ${total} security vendors on VirusTotal classified this URL as clean.`;
  } else if (mal >= 10 || mal / total >= 0.15) {
    score = 100;
    status = "MALICIOUS_DETECTIONS";
    reason = `Critical threat: ${mal} security vendors flagged this URL as malicious on VirusTotal (${virusTotal.detectionRatio || `${mal}/${total}`}).`;
  } else if (mal >= 5 || mal / total >= 0.07) {
    score = 80;
    status = "MALICIOUS_DETECTIONS";
    reason = `High risk: ${mal} security vendors flagged this URL as malicious on VirusTotal (${virusTotal.detectionRatio || `${mal}/${total}`}).`;
  } else if (mal >= 3) {
    score = 60;
    status = "MALICIOUS_DETECTIONS";
    reason = `Moderate risk: ${mal} security vendors flagged this URL as malicious on VirusTotal.`;
  } else if (mal >= 1) {
    score = 40;
    status = "MALICIOUS_DETECTIONS";
    reason = `Low-moderate risk: ${mal} security vendor flagged this URL as malicious on VirusTotal.`;
  } else {
    // Only suspicious
    score = Math.min(45, susp * 15);
    status = "SUSPICIOUS_FEATURES";
    reason = `${susp} security vendor(s) flagged this URL as suspicious on VirusTotal.`;
  }

  return {
    name: "VirusTotal",
    score,
    weight,
    contribution: 0,
    impact: getFactorImpact(score),
    status,
    reason,
    available: true,
    details: {
      maliciousCount: mal,
      suspiciousCount: susp,
      totalEngines: total,
      detectionRatio: virusTotal.detectionRatio,
    },
  };
}

// ============================================================================
// 3. URLHAUS MALWARE REPUTATION SCORE
// ============================================================================

export function calculateUrlhausScore(urlhaus?: UrlhausResult): RiskFactor {
  const weight = 0.15;

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
      reason: urlhaus.reason || "URLhaus API returned an error.",
      available: false,
    };
  }

  if (urlhaus.match || urlhaus.status === "MALWARE_URL_DETECTED") {
    const threat = urlhaus.threatType || "malware_download";
    const tagsStr = urlhaus.tags && urlhaus.tags.length > 0 ? ` [${urlhaus.tags.join(", ")}]` : "";
    return {
      name: "URLhaus Malware Reputation",
      score: 100,
      weight,
      contribution: 0,
      impact: "CRITICAL",
      status: "MALWARE_DETECTED",
      reason: `URLhaus confirmed this URL is an active malware distribution source (${threat})${tagsStr}.`,
      available: true,
      details: {
        threatType: urlhaus.threatType,
        tags: urlhaus.tags,
      },
    };
  }

  return {
    name: "URLhaus Malware Reputation",
    score: 0,
    weight,
    contribution: 0,
    impact: "NONE",
    status: "CHECKED",
    reason: "No matching malware URL record was found in the URLhaus database.",
    available: true,
  };
}

// ============================================================================
// 4. URL INTELLIGENCE SCORE
// ============================================================================

export function calculateUrlIntelligenceScore(
  urlOrResult: string | UrlIntelligenceResult,
  _domain?: string
): RiskFactor {
  const weight = 0.15;

  let intel: UrlIntelligenceResult;
  if (typeof urlOrResult === "object" && urlOrResult !== null && "indicators" in urlOrResult) {
    intel = urlOrResult;
  } else {
    intel = analyzeUrlIntelligence(String(urlOrResult));
  }

  if (intel.status === "ERROR") {
    return {
      name: "URL Intelligence",
      score: null,
      weight,
      contribution: 0,
      impact: "NONE",
      status: "ERROR",
      reason: intel.reasons[0] || "URL Intelligence analysis encountered an error.",
      available: false,
      details: intel.evidence,
    };
  }

  const score = intel.score;
  const reason =
    intel.indicators.length > 0
      ? `Local URL indicators detected: ${intel.indicators.map((i) => i.reason).join("; ")}`
      : "URL structure adheres to standard conventions with no suspicious local indicators.";

  return {
    name: "URL Intelligence",
    score,
    weight,
    contribution: 0,
    impact: getFactorImpact(score),
    status: score > 0 ? "SUSPICIOUS_FEATURES" : "CHECKED",
    reason,
    available: true,
    details: {
      ...intel.evidence,
      indicators: intel.indicators,
    },
  };
}

// ============================================================================
// 5. SSL/TLS SCORE
// ============================================================================

function isSslAnalysisOutput(
  ssl: SslAnalysisResult | SslAnalysisOutput
): ssl is SslAnalysisOutput {
  return "certificate" in ssl && "status" in ssl;
}

export function calculateSSLScore(
  ssl?: SslAnalysisResult | SslAnalysisOutput | null
): RiskFactor {
  const weight = 0.10;

  if (!ssl) {
    return {
      name: "SSL/TLS",
      score: null,
      weight,
      contribution: 0,
      impact: "NONE",
      status: "UNAVAILABLE",
      reason: "SSL/TLS analysis was not performed.",
      available: false,
    };
  }

  // Handle modern SslAnalysisOutput
  if (isSslAnalysisOutput(ssl)) {
    if (ssl.status === "UNAVAILABLE") {
      return {
        name: "SSL/TLS",
        score: null,
        weight,
        contribution: 0,
        impact: "NONE",
        status: "UNAVAILABLE",
        reason: ssl.reason || "TLS connection timed out or network host is unreachable.",
        available: false,
      };
    }

    if (ssl.status === "ERROR") {
      return {
        name: "SSL/TLS",
        score: null,
        weight,
        contribution: 0,
        impact: "NONE",
        status: "ERROR",
        reason: ssl.reason || "SSL/TLS inspection encountered an error.",
        available: false,
      };
    }

    if (ssl.protocol === "HTTP") {
      const score = ssl.score ?? 40;
      return {
        name: "SSL/TLS",
        score,
        weight,
        contribution: 0,
        impact: getFactorImpact(score),
        status: "NO_HTTPS",
        reason: ssl.reason || "Website uses plain HTTP without SSL/TLS encryption.",
        available: true,
        details: { protocol: "HTTP" },
      };
    }

    // HTTPS
    const score = ssl.score ?? 0;
    let factorStatus: FactorStatus = "CHECKED";
    if (score === 0) factorStatus = "VALID";
    else if (score === 60) factorStatus = "EXPIRED_CERTIFICATE";
    else if (score === 80) factorStatus = "HOSTNAME_MISMATCH";
    else if (score >= 70) factorStatus = "INVALID_CERTIFICATE";

    return {
      name: "SSL/TLS",
      score,
      weight,
      contribution: 0,
      impact: getFactorImpact(score),
      status: factorStatus,
      reason:
        ssl.reason ||
        (score === 0
          ? "HTTPS is enabled with a valid and trusted certificate."
          : "SSL/TLS security warning detected."),
      available: true,
      details: {
        protocol: "HTTPS",
        certificate: ssl.certificate,
      },
    };
  }

  // Fallback for legacy SslAnalysisResult
  if (!ssl.enabled) {
    return {
      name: "SSL/TLS",
      score: 40,
      weight,
      contribution: 0,
      impact: getFactorImpact(40),
      status: "NO_HTTPS",
      reason: "Website uses plain HTTP without SSL/TLS encryption.",
      available: true,
      details: { protocol: "HTTP" },
    };
  }

  if (ssl.status === "unavailable" && ssl.enabled) {
    return {
      name: "SSL/TLS",
      score: null,
      weight,
      contribution: 0,
      impact: "NONE",
      status: "UNAVAILABLE",
      reason: "SSL/TLS certificate could not be inspected during this scan.",
      available: false,
    };
  }

  if (ssl.enabled && ssl.valid && ssl.status === "valid") {
    return {
      name: "SSL/TLS",
      score: 0,
      weight,
      contribution: 0,
      impact: "NONE",
      status: "VALID",
      reason: `HTTPS is enabled with a valid certificate issued by ${ssl.issuer || "a trusted Certificate Authority"}.${
        ssl.validDaysRemaining !== undefined ? ` Certificate expires in ${ssl.validDaysRemaining} days.` : ""
      }`,
      available: true,
      details: {
        issuer: ssl.issuer,
        validDaysRemaining: ssl.validDaysRemaining,
        protocol: ssl.protocol,
      },
    };
  }

  let legacyScore = 0;
  const problems: string[] = [];

  if (ssl.status === "expired") {
    legacyScore += 60;
    problems.push("SSL certificate has expired");
  }
  if (ssl.status === "self_signed") {
    legacyScore += 70;
    problems.push("SSL certificate is self-signed and not trusted by browsers");
  }
  if (ssl.status === "invalid") {
    legacyScore += 70;
    problems.push("SSL certificate is invalid or untrusted");
  }
  if (ssl.validDaysRemaining !== undefined && ssl.validDaysRemaining < 0) {
    legacyScore += 30;
    problems.push("Certificate expired past grace window");
  }

  legacyScore = Math.min(100, Math.max(legacyScore, 40));

  return {
    name: "SSL/TLS",
    score: legacyScore,
    weight,
    contribution: 0,
    impact: getFactorImpact(legacyScore),
    status: ssl.status === "expired" ? "EXPIRED_CERTIFICATE" : "INVALID_CERTIFICATE",
    reason: problems.length > 0
      ? `SSL/TLS issues detected: ${problems.join("; ")}.`
      : "SSL/TLS configuration could not be fully validated.",
    available: true,
    details: {
      sslStatus: ssl.status,
      issuer: ssl.issuer,
      validDaysRemaining: ssl.validDaysRemaining,
    },
  };
}

// ============================================================================
// Confidence Calculation
// ============================================================================

export function calculateConfidence(factors: RiskFactor[]): number {
  let confidence = 100;

  const availableFactors = factors.filter((f) => f.available);
  const unavailableFactors = factors.filter((f) => !f.available);

  for (const factor of unavailableFactors) {
    if (factor.name === "Google Safe Browsing") confidence -= 25;
    else if (factor.name === "VirusTotal") confidence -= 20;
    else if (factor.name === "URLhaus Malware Reputation") confidence -= 15;
    else if (factor.name === "URL Intelligence") confidence -= 10;
    else if (factor.name === "SSL/TLS") confidence -= 10;
  }

  if (availableFactors.length <= 1) {
    confidence -= 15;
  } else if (availableFactors.length <= 2) {
    confidence -= 8;
  }

  const availableWithScores = availableFactors.filter((f) => f.score !== null);
  if (availableWithScores.length >= 2) {
    const scores = availableWithScores.map((f) => f.score as number);
    const hasMixedSignals = scores.some((s) => s < 20) && scores.some((s) => s >= 60);
    if (hasMixedSignals) {
      confidence -= 15;
    }
  }

  return Math.max(0, Math.min(100, Math.round(confidence)));
}

// ============================================================================
// Main Deterministic Risk Score Calculator
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

export function calculateRiskScore(params: CalculateRiskScoreParams): RiskEvaluation {
  const { normalizedUrl, domain, ssl, sslAnalysis, safeBrowsing, virusTotal, urlhaus, urlIntelligence } = params;

  // 1. Calculate factor scores
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

  // 2. Usable signals check
  const availableFactors = allFactors.filter((f) => f.available && f.score !== null);

  // If there are insufficient usable signals
  if (availableFactors.length === 0) {
    for (const factor of allFactors) factor.contribution = 0;
    const summary = "Insufficient security signals were available to determine the risk of this URL. Please try again later.";
    const reasons = [summary];
    const assessment: RiskAssessmentResult = {
      riskScore: null,
      riskLevel: "INCONCLUSIVE",
      confidence: 0,
      factors: allFactors,
      summary,
      analysisStatus: "INSUFFICIENT_DATA",
    };

    return {
      score: null,
      level: "INCONCLUSIVE",
      reasons,
      appliedRules: [],
      riskScore: null,
      riskLevel: "INCONCLUSIVE",
      confidence: 0,
      factors: allFactors,
      assessment,
      analysisStatus: "INSUFFICIENT_DATA",
      summary,
    };
  }

  // Check if all external APIs failed
  const externalFactors = [safeBrowsingFactor, virusTotalFactor, urlhausFactor];
  const allExternalFailed = externalFactors.every((f) => !f.available || f.score === null);
  const analysisStatus: "COMPLETE" | "LIMITED" = allExternalFailed ? "LIMITED" : "COMPLETE";

  // Renormalize available weights
  const totalAvailableWeight = availableFactors.reduce((sum, f) => sum + f.weight, 0);

  let baseWeightedSum = 0;
  for (const factor of availableFactors) {
    const normalizedWeight = factor.weight / totalAvailableWeight;
    const contribution = (factor.score as number) * normalizedWeight;
    factor.contribution = parseFloat(contribution.toFixed(2));
    baseWeightedSum += contribution;
  }

  for (const factor of allFactors) {
    if (!factor.available || factor.score === null) {
      factor.contribution = 0;
    }
  }

  let calculatedScore = Math.round(Math.max(0, Math.min(100, baseWeightedSum)));

  if (!allExternalFailed) {
    // 3. Critical Threat Override Check
    let criticalOverrideFloor = 0;
    const activeThreatFactors: RiskFactor[] = [];

    if (safeBrowsingFactor.available && safeBrowsingFactor.score !== null) {
      if (safeBrowsingFactor.score >= 100) {
        criticalOverrideFloor = Math.max(criticalOverrideFloor, 80); // MALWARE -> CRITICAL
        activeThreatFactors.push(safeBrowsingFactor);
      } else if (safeBrowsingFactor.score >= 90) {
        criticalOverrideFloor = Math.max(criticalOverrideFloor, 75); // SOCIAL_ENGINEERING -> HIGH
        activeThreatFactors.push(safeBrowsingFactor);
      }
    }

    if (urlhausFactor.available && urlhausFactor.score !== null && urlhausFactor.score >= 100) {
      criticalOverrideFloor = Math.max(criticalOverrideFloor, 80); // MALWARE_URL_DETECTED -> CRITICAL
      activeThreatFactors.push(urlhausFactor);
    }

    if (virusTotalFactor.available && virusTotalFactor.score !== null && virusTotalFactor.score >= 80) {
      criticalOverrideFloor = Math.max(criticalOverrideFloor, 75); // High VT consensus -> HIGH
      activeThreatFactors.push(virusTotalFactor);
    }

    if (activeThreatFactors.length >= 3) {
      criticalOverrideFloor = Math.max(criticalOverrideFloor, 90); // 3 feeds agree -> 90+ CRITICAL
    } else if (activeThreatFactors.length >= 2) {
      criticalOverrideFloor = Math.max(criticalOverrideFloor, 85); // 2 feeds agree -> 85+ CRITICAL
    }

    if (criticalOverrideFloor > 0 && calculatedScore < criticalOverrideFloor) {
      const delta = criticalOverrideFloor - calculatedScore;
      calculatedScore = criticalOverrideFloor;

      // Ensure additive property: distribute delta to the triggering threat factor(s)
      const deltaPerFactor = delta / activeThreatFactors.length;
      for (const tf of activeThreatFactors) {
        tf.contribution = parseFloat((tf.contribution + deltaPerFactor).toFixed(2));
      }
    } else {
      // 4. Structural Risk Floor (when threat intel is clean)
      const threatScores = [
        safeBrowsingFactor.score,
        urlhausFactor.score,
        virusTotalFactor.score,
      ].filter((s): s is number => s !== null);

      const isThreatIntelClean = threatScores.length > 0 && threatScores.every((s) => s === 0);

      const structuralWeightTotal = urlIntelFactor.weight + sslFactor.weight; // 0.15 + 0.10 = 0.25
      const urlIntelScore = urlIntelFactor.score ?? 0;
      const sslScore = sslFactor.score ?? 0;
      const structuralScore =
        (urlIntelScore * urlIntelFactor.weight + sslScore * sslFactor.weight) /
        structuralWeightTotal;

      // Apply 75% structural floor if structural score is significant (>= 25)
      if (isThreatIntelClean && structuralScore >= 25) {
        const structuralFloor = Math.round(0.75 * structuralScore);
        if (calculatedScore < structuralFloor) {
          const delta = structuralFloor - calculatedScore;
          calculatedScore = structuralFloor;

          // Distribute delta proportionally to URL Intel and SSL
          const totalWeight = urlIntelFactor.weight + sslFactor.weight;
          urlIntelFactor.contribution = parseFloat(
            (urlIntelFactor.contribution + delta * (urlIntelFactor.weight / totalWeight)).toFixed(2)
          );
          sslFactor.contribution = parseFloat(
            (sslFactor.contribution + delta * (sslFactor.weight / totalWeight)).toFixed(2)
          );
        }
      }
    }
  }

  // Mathematical rounding adjustment to ensure sum of contributions exactly equals finalScore
  const totalContrib = allFactors.reduce((sum, f) => sum + f.contribution, 0);
  const roundingDiff = calculatedScore - totalContrib;
  if (Math.abs(roundingDiff) > 0.01 && Math.abs(roundingDiff) <= 1.0) {
    const maxFactor = allFactors
      .filter((f) => f.contribution > 0)
      .sort((a, b) => b.contribution - a.contribution)[0];
    if (maxFactor) {
      maxFactor.contribution = parseFloat((maxFactor.contribution + roundingDiff).toFixed(2));
    }
  }

  const finalScore = Math.max(0, Math.min(100, calculatedScore));
  const riskLevel = getRiskLevel(finalScore);
  const confidence = calculateConfidence(allFactors);

  let summary: string;
  const reasons: string[] = [];

  if (allExternalFailed) {
    summary = "External threat intelligence services were unavailable. This result is based on local URL and SSL/TLS analysis.";
    reasons.push(summary);
  } else {
    summary = buildSummary(finalScore, riskLevel, allFactors);
  }

  const appliedRules: string[] = [];
  for (const factor of allFactors) {
    if (factor.available && factor.score !== null && factor.score > 0) {
      reasons.push(factor.reason);
      appliedRules.push(`${factor.reason} (contribution: ${factor.contribution})`);
    }
  }

  if (reasons.length === 0) {
    reasons.push("No known threat indicators detected by the available security checks.");
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
    assessment,
    analysisStatus,
    summary,
  };
}

function buildSummary(
  score: number,
  level: RiskLevel,
  factors: RiskFactor[]
): string {
  const activeThreats = factors.filter(
    (f) => f.available && f.score !== null && f.score >= 50
  );

  if (level === "CRITICAL" || level === "HIGH") {
    if (activeThreats.length > 0) {
      const names = activeThreats.map((t) => t.name).join(", ");
      return `Severe risk (${score}/100 - ${level}). Critical indicators identified by: ${names}. Interacting with this URL is strongly advised against.`;
    }
    return `High risk detected (${score}/100 - ${level}). Multiple suspicious attributes identified. Avoid visiting this destination.`;
  }

  if (level === "MODERATE") {
    return `Moderate risk (${score}/100 - ${level}). Notable security concerns detected. Exercise caution before entering credentials.`;
  }

  if (level === "LOW") {
    return `Low risk (${score}/100 - ${level}). Minor anomalies or unencrypted HTTP detected, but no confirmed malicious threat.`;
  }

  return `Safe (${score}/100 - ${level}). No threat indicators identified across available intelligence checks.`;
}
