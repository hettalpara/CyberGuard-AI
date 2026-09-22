import { Types } from "mongoose";
import { Scan, IScan } from "../models/Scan";
import { validateAndNormalizeUrl } from "../utils/url.util";
import { SslAnalysisResult } from "./ssl.service";
import { analyzeSslUrl, SslAnalysisOutput } from "./ssl-analysis.service";
import { analyzeUrlIntelligence, UrlIntelligenceResult } from "./url-intelligence.service";
import { checkGoogleSafeBrowsing, SafeBrowsingResult } from "./safe-browsing.service";
import { checkUrlWithVirusTotal, VirusTotalResult } from "./virustotal.service";
import { checkUrlWithUrlhaus, UrlhausResult } from "./threat-intelligence/urlhaus.service";
import { calculateRiskScore } from "./risk-score.service";
import { generateAnalysisSummary } from "./analysis-summary.service";
import { generateSecurityExplanation } from "./ai-analysis.service";
import { AIAnalysisResult } from "./ai/ai.interface";
import { createAutomaticIncidentReportForScan } from "./report.service";

export interface PerformScanParams {
  rawUrl: string;
  userId: string | Types.ObjectId;
}

export async function performUrlAnalysis(params: {
  rawUrl: string;
  userId: string | Types.ObjectId;
}): Promise<IScan> {
  const startTime = Date.now();
  console.log(`[Analyzer] Started`);
  const { rawUrl, userId } = params;

  // 1. Validation & Normalization
  const tValStart = Date.now();
  const validation = validateAndNormalizeUrl(rawUrl);
  if (!validation.isValid || !validation.normalizedUrl || !validation.domain || !validation.hostname) {
    throw new Error(validation.error || "Invalid URL provided");
  }
  console.log(`[Analyzer] URL validation completed: ${Date.now() - tValStart} ms`);

  const { normalizedUrl, domain, hostname, protocol } = validation;
  const isHttps = protocol === "https:";

  // 2. Resilient Parallel Execution of 5 Security Checks
  // (SSL/TLS, Google Safe Browsing, VirusTotal, URLhaus, Local URL Intelligence)
  let sslDuration = 0;
  let sbDuration = 0;
  let vtDuration = 0;
  let uhDuration = 0;
  let urlIntelDuration = 0;

  const tSslStart = Date.now();
  const sslPromise = analyzeSslUrl(normalizedUrl).finally(() => {
    sslDuration = Date.now() - tSslStart;
  });

  const tSbStart = Date.now();
  const safeBrowsingPromise = checkGoogleSafeBrowsing(normalizedUrl).finally(() => {
    sbDuration = Date.now() - tSbStart;
  });

  const tVtStart = Date.now();
  const vtPromise = checkUrlWithVirusTotal(normalizedUrl).finally(() => {
    vtDuration = Date.now() - tVtStart;
  });

  const tUhStart = Date.now();
  const urlhausPromise = checkUrlWithUrlhaus(normalizedUrl).finally(() => {
    uhDuration = Date.now() - tUhStart;
  });

  const tUrlIntelStart = Date.now();
  const urlIntelPromise = Promise.resolve()
    .then(() => analyzeUrlIntelligence(normalizedUrl))
    .finally(() => {
      urlIntelDuration = Date.now() - tUrlIntelStart;
    });

  const [sslResultSettled, safeBrowsingSettled, virusTotalSettled, urlhausSettled, urlIntelSettled] =
    await Promise.allSettled([sslPromise, safeBrowsingPromise, vtPromise, urlhausPromise, urlIntelPromise]);

  console.log(`[Analyzer] SSL/TLS completed: ${sslDuration} ms`);
  console.log(`[Analyzer] Google Safe Browsing completed: ${sbDuration} ms`);
  console.log(`[Analyzer] VirusTotal completed: ${vtDuration} ms`);
  console.log(`[Analyzer] URLhaus completed: ${uhDuration} ms`);
  console.log(`[Analyzer] URL Intelligence completed: ${urlIntelDuration} ms`);

  // Handle SSL result
  const sslAnalysis: SslAnalysisOutput =
    sslResultSettled.status === "fulfilled"
      ? sslResultSettled.value
      : {
          status: "UNAVAILABLE",
          protocol: isHttps ? "HTTPS" : "HTTP",
          score: null,
          level: null,
          certificate: {},
          reason:
            sslResultSettled.status === "rejected"
              ? sslResultSettled.reason?.message || "SSL/TLS check failed"
              : "SSL/TLS service unavailable",
          checkedAt: new Date().toISOString(),
        };

  // Convert for legacy ssl field backwards compatibility
  const ssl: SslAnalysisResult = {
    enabled: sslAnalysis.protocol === "HTTPS",
    valid: sslAnalysis.status === "CHECKED" && sslAnalysis.score === 0,
    status:
      sslAnalysis.status === "UNAVAILABLE"
        ? "unavailable"
        : sslAnalysis.score === 0
        ? "valid"
        : sslAnalysis.score === 60
        ? "expired"
        : sslAnalysis.score === 70 || sslAnalysis.score === 80
        ? "invalid"
        : "unavailable",
    issuer:
      typeof sslAnalysis.certificate?.issuer === "object"
        ? String((sslAnalysis.certificate.issuer as any)?.O || (sslAnalysis.certificate.issuer as any)?.CN || "Unknown CA")
        : typeof sslAnalysis.certificate?.issuer === "string"
        ? sslAnalysis.certificate.issuer
        : sslAnalysis.protocol === "HTTP"
        ? "No SSL (HTTP Only)"
        : "Unknown CA",
    protocol: sslAnalysis.protocol,
  };

  // Handle Google Safe Browsing result
  const safeBrowsing: SafeBrowsingResult =
    safeBrowsingSettled.status === "fulfilled"
      ? safeBrowsingSettled.value
      : {
          checked: false,
          available: false,
          status: "UNAVAILABLE",
          threatDetected: false,
          threatTypes: [],
          score: null,
          provider: "GOOGLE_SAFE_BROWSING",
          reason:
            safeBrowsingSettled.status === "rejected"
              ? safeBrowsingSettled.reason?.message || "Google Safe Browsing check failed"
              : "Google Safe Browsing was unavailable.",
          checkedAt: new Date().toISOString(),
          error:
            safeBrowsingSettled.status === "rejected"
              ? safeBrowsingSettled.reason?.message
              : "Safe Browsing unavailable",
        };

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
          detectionRatio: "0 / 0",
          enginesFlagged: 0,
          permalink: null,
          status: "unavailable",
          error:
            virusTotalSettled.status === "rejected"
              ? virusTotalSettled.reason?.message
              : "VirusTotal unavailable",
        };

  // Handle URLhaus result
  const urlhaus: UrlhausResult =
    urlhausSettled.status === "fulfilled"
      ? urlhausSettled.value
      : {
          available: false,
          status: "UNAVAILABLE",
          match: false,
          provider: "URLHAUS",
          reason:
            urlhausSettled.status === "rejected"
              ? urlhausSettled.reason?.message || "URLhaus check failed"
              : "URLhaus unavailable",
          checkedAt: new Date().toISOString(),
          error:
            urlhausSettled.status === "rejected"
              ? urlhausSettled.reason?.message
              : "URLhaus unavailable",
        };

  // Handle Local URL Intelligence result
  const urlIntelligence: UrlIntelligenceResult =
    urlIntelSettled.status === "fulfilled"
      ? urlIntelSettled.value
      : {
          status: "ERROR",
          score: 0,
          level: "SAFE",
          indicators: [],
          reasons: [
            urlIntelSettled.status === "rejected"
              ? urlIntelSettled.reason?.message || "URL Intelligence check failed"
              : "URL Intelligence unavailable",
          ],
          evidence: {
            error:
              urlIntelSettled.status === "rejected"
                ? urlIntelSettled.reason?.message
                : "URL Intelligence error",
          },
        };

  // 3. Deterministic Risk Scoring (Professional Engine V2)
  const tRiskStart = Date.now();
  const risk = calculateRiskScore({
    normalizedUrl,
    domain,
    ssl,
    sslAnalysis,
    safeBrowsing,
    virusTotal,
    urlhaus,
    urlIntelligence,
  });
  console.log(`[Analyzer] Risk Engine completed: ${Date.now() - tRiskStart} ms`);

  // 4. Analysis Summary & Mitigation Recommendations (Deterministic Fallback)
  const summaryData = generateAnalysisSummary({
    url: rawUrl,
    domain,
    risk,
    ssl,
    safeBrowsing,
    virusTotal,
    urlhaus,
  });

  // 5. Gemini AI Security Analysis (Explanation & Cybersecurity Guidance)
  // NOTE: Gemini receives structured metrics; it does NOT calculate or modify risk scores.
  let aiAnalysis: AIAnalysisResult;
  const tGeminiStart = Date.now();
  try {
    aiAnalysis = await generateSecurityExplanation({
      url: normalizedUrl,
      domain,
      riskScore: risk.score,
      riskLevel: risk.level,
      confidence: risk.confidence,
      overrideTriggered: risk.overrideTriggered,
      overrideReason: risk.overrideReason,
      overrideType: risk.overrideType,
      calculationMethod: risk.calculationMethod,
      factors: (risk.factors || []).map((f) => ({
        name: f.name,
        score: f.score,
        impact: f.impact,
        status: f.status,
        reason: f.reason,
        weight: f.weight,
        contribution: f.contribution,
      })),
      securityEvidence: {
        ssl: {
          valid: ssl.valid,
          status: ssl.status,
          issuer: ssl.issuer,
          protocol: ssl.protocol,
        },
        sslAnalysis: {
          status: sslAnalysis.status,
          protocol: sslAnalysis.protocol,
          score: sslAnalysis.score,
          level: sslAnalysis.level,
          certificate: sslAnalysis.certificate,
          reason: sslAnalysis.reason,
          checkedAt: sslAnalysis.checkedAt,
        },
        urlIntelligence: {
          status: urlIntelligence.status,
          score: urlIntelligence.score,
          level: urlIntelligence.level,
          indicators: urlIntelligence.indicators,
          reasons: urlIntelligence.reasons,
          evidence: urlIntelligence.evidence,
        },
        safeBrowsing: {
          checked: safeBrowsing.available && safeBrowsing.status !== "UNAVAILABLE",
          available: safeBrowsing.available,
          status: safeBrowsing.status,
          threatDetected: safeBrowsing.threatDetected,
          threatTypes: safeBrowsing.threatTypes,
          score: safeBrowsing.score,
          reason: safeBrowsing.reason,
        },
        urlhaus: {
          checked: urlhaus.available && urlhaus.status !== "UNAVAILABLE",
          available: urlhaus.available,
          status: urlhaus.status,
          match: urlhaus.match,
          threatType: urlhaus.threatType,
          tags: urlhaus.tags,
        },
        virusTotal: {
          checked: virusTotal.checked,
          available: virusTotal.available,
          maliciousCount: virusTotal.maliciousCount,
          suspiciousCount: virusTotal.suspiciousCount,
          totalEngines: virusTotal.totalEngines,
          detectionRatio: virusTotal.detectionRatio,
        },
        riskReasons: risk.reasons,
      },
    });
  } catch (aiErr: any) {
    console.warn(`[AI_ANALYSIS] Gemini explanation failed: ${aiErr?.message || aiErr}`);
    aiAnalysis = {
      available: false,
      summary: "The security analysis was completed, but the AI explanation is temporarily unavailable.",
      error: "AI analysis could not be generated.",
    };
  }
  console.log(`[Analyzer] Gemini completed: ${Date.now() - tGeminiStart} ms`);

  // 6. Persist to MongoDB Atlas
  const tMongoStart = Date.now();
  const scanDoc = await Scan.create({
    userId: new Types.ObjectId(userId.toString()),
    url: rawUrl.trim(),
    normalizedUrl,
    domain,
    riskScore: risk.score,
    riskLevel: risk.level,
    confidence: risk.confidence,
    riskCalculationVersion: "2.0",
    analysisStatus: risk.analysisStatus,
    overrideTriggered: risk.overrideTriggered,
    overrideReason: risk.overrideReason,
    overrideType: risk.overrideType,
    calculationMethod: risk.calculationMethod,
    risk: {
      score: risk.score,
      level: risk.level,
      reasons: risk.reasons,
      confidence: risk.confidence,
      factors: risk.factors,
      findings: risk.findings,
      analysisStatus: risk.analysisStatus,
      overrideTriggered: risk.overrideTriggered,
      overrideReason: risk.overrideReason,
      overrideType: risk.overrideType,
      calculationMethod: risk.calculationMethod,
    },
    urlIntelligence: {
      status: urlIntelligence.status,
      score: urlIntelligence.score,
      level: urlIntelligence.level,
      indicators: urlIntelligence.indicators,
      reasons: urlIntelligence.reasons,
      evidence: urlIntelligence.evidence,
    },
    sslAnalysis: {
      status: sslAnalysis.status,
      protocol: sslAnalysis.protocol,
      score: sslAnalysis.score,
      level: sslAnalysis.level,
      certificate: sslAnalysis.certificate,
      reason: sslAnalysis.reason,
      checkedAt: sslAnalysis.checkedAt,
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
      available: safeBrowsing.available,
      status: safeBrowsing.status,
      threatDetected: safeBrowsing.threatDetected,
      threatTypes: safeBrowsing.threatTypes,
      score: safeBrowsing.score,
      reason: safeBrowsing.reason,
      checkedAt: safeBrowsing.checkedAt,
      error: safeBrowsing.error,
    },
    urlhaus: {
      available: urlhaus.available,
      status: urlhaus.status,
      match: urlhaus.match,
      threatType: urlhaus.threatType,
      tags: urlhaus.tags,
      confidence: urlhaus.confidence,
      reason: urlhaus.reason,
      checkedAt: urlhaus.checkedAt,
      error: urlhaus.error,
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
    riskFactors: risk.factors,
    findings: risk.findings,
    summary: summaryData.summary,
    aiExplanation: aiAnalysis.available && aiAnalysis.explanation ? aiAnalysis.explanation : summaryData.aiExplanation,
    recommendedActions:
      aiAnalysis.available && aiAnalysis.recommendedActions && aiAnalysis.recommendedActions.length > 0
        ? aiAnalysis.recommendedActions
        : summaryData.recommendedActions,
    aiAnalysis: {
      available: aiAnalysis.available,
      summary: aiAnalysis.summary,
      threatType: aiAnalysis.threatType,
      severity: risk.level, // strictly maintain risk.level as authoritative
      explanation: aiAnalysis.explanation,
      keyIndicators: aiAnalysis.keyIndicators,
      recommendedActions: aiAnalysis.recommendedActions,
      confidenceNote: aiAnalysis.confidenceNote,
      generatedAt: aiAnalysis.generatedAt,
      model: aiAnalysis.model,
      error: aiAnalysis.error,
    },
    scannedAt: new Date(),
  });

  console.log(`[Analyzer] MongoDB persistence completed: ${Date.now() - tMongoStart} ms`);

  // 7. Automatically create official Incident Report for completed scan
  try {
    const reportDoc = await createAutomaticIncidentReportForScan(scanDoc, userId.toString());
    if (reportDoc) {
      scanDoc.reportId = reportDoc.reportId;
    }
  } catch (repErr: any) {
    console.error(`[Analyzer] Automatic report creation error: ${repErr?.message || repErr}`);
  }

  console.log(`[Analyzer] Total pipeline duration: ${Date.now() - startTime} ms`);

  return scanDoc;
}
