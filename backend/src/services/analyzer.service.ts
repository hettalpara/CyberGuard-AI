import { Types } from "mongoose";
import { Scan, IScan } from "../models/Scan";
import { validateAndNormalizeUrl } from "../utils/url.util";
import { analyzeSsl, SslAnalysisResult } from "./ssl.service";
import { checkGoogleSafeBrowsing, SafeBrowsingResult } from "./safe-browsing.service";
import { checkUrlWithVirusTotal, VirusTotalResult } from "./virustotal.service";
import { calculateRiskScore } from "./risk-score.service";
import { generateAnalysisSummary } from "./analysis-summary.service";

export interface PerformScanParams {
  rawUrl: string;
  userId: string | Types.ObjectId;
}

export async function performUrlAnalysis(params: {
  rawUrl: string;
  userId: string | Types.ObjectId;
}): Promise<IScan> {
  const { rawUrl, userId } = params;

  // 1. Validation & Normalization
  const validation = validateAndNormalizeUrl(rawUrl);
  if (!validation.isValid || !validation.normalizedUrl || !validation.domain || !validation.hostname) {
    throw new Error(validation.error || "Invalid URL provided");
  }

  const { normalizedUrl, domain, hostname, protocol } = validation;
  const isHttps = protocol === "https:";

  console.log(`[ANALYZER] Initiating security scan for: ${domain}`);
  console.log(`[SSL] SSL/TLS certificate inspection started`);
  console.log(`[SAFE_BROWSING] Google Safe Browsing threat check started`);
  console.log(`[VIRUSTOTAL] VirusTotal multi-engine scan started`);

  // 2. Resilient Parallel Execution of Security Checks (SSL, Safe Browsing, VirusTotal)
  const [sslResultSettled, safeBrowsingSettled, virusTotalSettled] =
    await Promise.allSettled([
      analyzeSsl(hostname, isHttps),
      checkGoogleSafeBrowsing(normalizedUrl),
      checkUrlWithVirusTotal(normalizedUrl),
    ]);

  // Handle SSL result
  const ssl: SslAnalysisResult =
    sslResultSettled.status === "fulfilled"
      ? sslResultSettled.value
      : { enabled: isHttps, valid: false, status: "unavailable" };
  console.log(`[SSL] SSL inspection completed (valid: ${ssl.valid}, status: ${ssl.status})`);

  // Handle Safe Browsing result
  const safeBrowsing: SafeBrowsingResult =
    safeBrowsingSettled.status === "fulfilled"
      ? safeBrowsingSettled.value
      : { checked: false, threatDetected: false, status: "unavailable" };
  console.log(`[SAFE_BROWSING] Safe Browsing completed (threatDetected: ${safeBrowsing.threatDetected})`);

  // Handle VirusTotal result
  const virusTotal: VirusTotalResult =
    virusTotalSettled.status === "fulfilled"
      ? virusTotalSettled.value
      : {
          checked: false,
          available: false,
          malicious: false,
          suspicious: false,
          harmless: 0,
          maliciousCount: 0,
          suspiciousCount: 0,
          undetectedCount: 0,
          totalEngines: 0,
          error: "VirusTotal service unavailable",
          status: "unavailable",
        };
  console.log(`[VIRUSTOTAL] VirusTotal check completed (flagged: ${(virusTotal.maliciousCount || 0) + (virusTotal.suspiciousCount || 0)}, status: ${virusTotal.status})`);

  // 3. Deterministic Risk Scoring
  const risk = calculateRiskScore({
    normalizedUrl,
    domain,
    ssl,
    safeBrowsing,
    virusTotal,
  });

  // 4. Analysis Summary & Mitigation Recommendations
  const summaryData = generateAnalysisSummary({
    url: rawUrl,
    domain,
    risk,
    ssl,
    safeBrowsing,
    virusTotal,
  });

  // 5. Persist to MongoDB Atlas
  const scanDoc = await Scan.create({
    userId: new Types.ObjectId(userId.toString()),
    url: rawUrl.trim(),
    normalizedUrl,
    domain,
    riskScore: risk.score,
    riskLevel: risk.level,
    risk: {
      score: risk.score,
      level: risk.level,
      reasons: risk.reasons,
    },
    ssl: {
      enabled: ssl.enabled,
      valid: ssl.valid,
      status: ssl.status,
      issuer: ssl.issuer,
      validDaysRemaining: ssl.validDaysRemaining,
      protocol: ssl.protocol,
    },
    safeBrowsing: {
      checked: safeBrowsing.checked,
      threatDetected: safeBrowsing.threatDetected,
      threatType: safeBrowsing.threatType,
      status: safeBrowsing.status,
      threats: safeBrowsing.threats || [],
    },
    virusTotal: {
      checked: virusTotal.checked,
      available: virusTotal.available,
      malicious: virusTotal.malicious,
      suspicious: virusTotal.suspicious,
      harmless: virusTotal.harmless ?? 0,
      maliciousCount: virusTotal.maliciousCount ?? 0,
      suspiciousCount: virusTotal.suspiciousCount ?? 0,
      undetectedCount: virusTotal.undetectedCount ?? 0,
      totalEngines: virusTotal.totalEngines ?? 0,
      detectionRatio: virusTotal.detectionRatio || "0 / 0",
      enginesFlagged: (virusTotal.maliciousCount || 0) + (virusTotal.suspiciousCount || 0),
      permalink: virusTotal.permalink || null,
      status: virusTotal.status || "unavailable",
      error: virusTotal.error,
    },
    summary: summaryData.summary,
    aiExplanation: summaryData.aiExplanation,
    recommendedActions: summaryData.recommendedActions,
    scannedAt: new Date(),
  });

  return scanDoc;
}
