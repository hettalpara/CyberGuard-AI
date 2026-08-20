import { SslAnalysisResult } from "./ssl.service";
import { SafeBrowsingResult } from "./safe-browsing.service";
import { VirusTotalResult } from "./virustotal.service";

export interface RiskEvaluation {
  score: number;
  level: "SAFE" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  reasons: string[];
  appliedRules: string[];
  riskScore: number;
  riskLevel: "SAFE" | "SUSPICIOUS" | "DANGEROUS";
}

const SUSPICIOUS_KEYWORDS = [
  "verify",
  "login",
  "signin",
  "account",
  "banking",
  "bank",
  "update-security",
  "confirm",
  "password",
  "credential",
  "wallet",
  "claim",
  "free-gift",
  "reward",
  "airdrop",
  "kyc",
  "secure-check",
];

const SUSPICIOUS_TLDS = [".xyz", ".top", ".buzz", ".work", ".click", ".fit", ".gq", ".cf", ".tk", ".ml", ".ga"];

export function calculateRiskScore(params: {
  normalizedUrl: string;
  domain: string;
  ssl: SslAnalysisResult;
  safeBrowsing: SafeBrowsingResult;
  virusTotal: VirusTotalResult;
}): RiskEvaluation {
  let score = 0;
  const reasons: string[] = [];
  const appliedRules: string[] = [];

  const { normalizedUrl, domain, ssl, safeBrowsing, virusTotal } = params;
  const lowerUrl = (normalizedUrl || "").toLowerCase();
  const lowerDomain = (domain || "").toLowerCase();

  // 1. Google Safe Browsing Detection (+50)
  if (safeBrowsing.threatDetected) {
    score += 50;
    const reasonText = `Google Safe Browsing identified a threat: ${safeBrowsing.threatType || "malicious URL"}`;
    reasons.push(reasonText);
    appliedRules.push(`${reasonText} (+50)`);
  }

  // 2. VirusTotal Multi-Engine Detections (+10 to +40)
  const maliciousCount = virusTotal.maliciousCount ?? (virusTotal.malicious ? 1 : 0);
  const suspiciousCount = virusTotal.suspiciousCount ?? (virusTotal.suspicious ? 1 : 0);

  if (maliciousCount >= 5) {
    score += 40;
    const reasonText = `VirusTotal flagged by ${maliciousCount} security vendors as malicious`;
    reasons.push(reasonText);
    appliedRules.push(`${reasonText} (+40)`);
  } else if (maliciousCount >= 1) {
    score += 25;
    const reasonText = `VirusTotal flagged by ${maliciousCount} security vendor(s) as malicious`;
    reasons.push(reasonText);
    appliedRules.push(`${reasonText} (+25)`);
  }

  if (suspiciousCount >= 3) {
    score += 20;
    const reasonText = `VirusTotal flagged by ${suspiciousCount} engines as suspicious`;
    reasons.push(reasonText);
    appliedRules.push(`${reasonText} (+20)`);
  } else if (suspiciousCount >= 1) {
    score += 10;
    const reasonText = `VirusTotal flagged by ${suspiciousCount} engine(s) as suspicious`;
    reasons.push(reasonText);
    appliedRules.push(`${reasonText} (+10)`);
  }

  // 3. SSL / HTTPS Security Status (+15 to +25)
  if (!ssl.enabled) {
    score += 15;
    const reasonText = "Unencrypted connection: Website uses plain HTTP without SSL/TLS encryption";
    reasons.push(reasonText);
    appliedRules.push(`${reasonText} (+15)`);
  } else if (!ssl.valid || ssl.status === "invalid" || ssl.status === "expired" || ssl.status === "self_signed") {
    score += 25;
    const reasonText = `Invalid, self-signed, or expired SSL certificate (${ssl.status})`;
    reasons.push(reasonText);
    appliedRules.push(`${reasonText} (+25)`);
  }

  // 4. High-Risk TLD & Phishing Keywords in URL Path/Domain (+10 to +20)
  const hasSuspiciousKeyword = SUSPICIOUS_KEYWORDS.some((kw) => lowerUrl.includes(kw));
  const hasSuspiciousTld = SUSPICIOUS_TLDS.some((tld) => lowerDomain.endsWith(tld));

  if (hasSuspiciousKeyword && hasSuspiciousTld) {
    score += 20;
    const reasonText = "Targeted phishing keyword combined with disposable high-risk TLD";
    reasons.push(reasonText);
    appliedRules.push(`${reasonText} (+20)`);
  } else if (hasSuspiciousKeyword) {
    score += 10;
    const reasonText = "Suspicious keyword detected in URL path structure";
    reasons.push(reasonText);
    appliedRules.push(`${reasonText} (+10)`);
  } else if (hasSuspiciousTld) {
    score += 10;
    const reasonText = "High-risk top-level domain frequently associated with spam and phishing";
    reasons.push(reasonText);
    appliedRules.push(`${reasonText} (+10)`);
  }

  // 5. Direct IP address used in place of domain name (+25)
  if (/^https?:\/\/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/.test(lowerUrl)) {
    score += 25;
    const reasonText = "Raw IP address used in place of registered domain name";
    reasons.push(reasonText);
    appliedRules.push(`${reasonText} (+25)`);
  }

  // Final score bounded to [0, 100]
  const finalScore = Math.min(100, Math.max(0, score));

  // Determine Levels
  let level: "SAFE" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" = "SAFE";
  let riskLevel: "SAFE" | "SUSPICIOUS" | "DANGEROUS" = "SAFE";

  if (finalScore >= 75) {
    level = "CRITICAL";
    riskLevel = "DANGEROUS";
  } else if (finalScore >= 60) {
    level = "HIGH";
    riskLevel = "DANGEROUS";
  } else if (finalScore >= 30) {
    level = "MEDIUM";
    riskLevel = "SUSPICIOUS";
  } else if (finalScore > 10) {
    level = "LOW";
    riskLevel = "SAFE";
  } else {
    level = "SAFE";
    riskLevel = "SAFE";
  }

  if (reasons.length === 0) {
    reasons.push("No known threat indicators detected by the available security checks.");
  }

  return {
    score: finalScore,
    level,
    reasons,
    appliedRules,
    riskScore: finalScore,
    riskLevel,
  };
}
