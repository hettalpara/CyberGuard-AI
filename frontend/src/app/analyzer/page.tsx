"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { 
  Search, 
  Download, 
  Copy, 
  Check, 
  AlertCircle, 
  Globe, 
  Mail, 
  RefreshCw, 
  FileText, 
  Bot, 
  ArrowRight 
} from "lucide-react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { generatePdfReport } from "@/utils/pdf-report-generator";
import { analyzerService } from "@/services/analyzer.service";
import type { RiskFactorData, AIAnalysisData, SecurityFindingData } from "@/services/analyzer.service";
import { 
  EmailAnalyzerSection,
  RiskSummarySection,
  ThreatIntelligenceCard,
  UrlStructureCard,
  ConnectionSecurityCard,
  EvidenceFindingsCard,
  AiAssessmentCard,
  AnalyzerErrorBoundary
} from "@/components/analyzer";
import { formatIssuerDisplay } from "@/components/analyzer/connection-security-card";

export type AnalysisState = "idle" | "loading" | "success" | "error";

export interface DetailedAnalysis {
  scanId?: string;
  url: string;
  normalizedUrl: string;
  isValid: boolean;
  ssl: { 
    valid: boolean; 
    issuer: string; 
    validDaysRemaining: number; 
    status: string; 
  };
  sslAnalysis?: {
    available: boolean;
    protocol: string;
    certificateStatus: string;
    score: number | null;
    riskLevel: string;
    status: string;
    issuer?: string;
    validDaysRemaining?: number;
    hostnameMatch?: boolean;
    authorized?: boolean;
    explanation: string;
    reasons: string[];
    error?: string;
  };
  urlIntelligence?: {
    available: boolean;
    score: number | null;
    riskLevel: string;
    status: string;
    indicators: any[];
    explanation: string;
    reasons: string[];
  };
  threatLevel: "SAFE" | "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
  riskScore: number | null;
  confidence: number;
  analysisStatus: string;
  overrideTriggered?: boolean;
  overrideReason?: string | null;
  overrideType?: string | null;
  calculationMethod?: string;
  riskFactors: RiskFactorData[];
  findings: SecurityFindingData[];
  riskReasons: string[];
  aiAnalysis?: AIAnalysisData | null;
  aiExplanation?: string;
  recommendedActions: string[];
  safeBrowsing: {
    available: boolean;
    status: string;
    matches: any[];
    threatTypes: string[];
    platforms: string[];
    isMalicious: boolean;
    cached?: boolean;
    error?: string;
  };
  virusTotal: {
    available: boolean;
    status: string;
    malicious: number;
    suspicious: number;
    harmless: number;
    undetected: number;
    total: number;
    detectionRatio: string;
    positives: number;
    scanDate?: string;
    permalink?: string;
    isMalicious: boolean;
    cached?: boolean;
    error?: string;
  };
  urlhaus: {
    available: boolean;
    status: string;
    queryStatus: string;
    threatType?: string;
    urlhausUrl?: string;
    reporter?: string;
    dateAdded?: string;
    tags: string[];
    isMalicious: boolean;
    cached?: boolean;
    error?: string;
  };
  timestamp: string;
  reportId: string;
}

/**
 * Normalizes any backend scan response into a strictly-typed, null-safe analysis model.
 * Guarantees that every string, array, and object is safely populated so no component
 * will ever crash from undefined access or raw object interpolation.
 */
function normalizeAnalysisResponse(data: any, fallbackUrl: string): DetailedAnalysis {
  if (!data || typeof data !== "object") {
    throw new Error("Invalid API response received from security scanner.");
  }

  const scan = data.scan || data.data || data;
  if (!scan || typeof scan !== "object") {
    throw new Error("Security scan payload is missing or incomplete.");
  }

  // 1. URL & Validation
  const rawUrl = typeof scan.url === "string" && scan.url.trim().length > 0 ? scan.url : fallbackUrl;
  const normalizedUrl = typeof scan.normalizedUrl === "string" && scan.normalizedUrl.trim().length > 0 ? scan.normalizedUrl : rawUrl;

  // 2. Risk Scoring & Classification
  let rawLevel = String(scan.riskLevel || scan.risk?.level || "SAFE").toUpperCase();
  if (rawLevel === "MEDIUM") rawLevel = "MODERATE";
  const validLevels = ["SAFE", "LOW", "MODERATE", "HIGH", "CRITICAL"] as const;
  const threatLevel: "SAFE" | "LOW" | "MODERATE" | "HIGH" | "CRITICAL" = 
    validLevels.includes(rawLevel as any) ? (rawLevel as any) : "SAFE";

  const rawScore = scan.riskScore !== undefined ? scan.riskScore : scan.risk?.score;
  const riskScore = typeof rawScore === "number" && !isNaN(rawScore) ? Math.round(rawScore) : null;

  const rawConf = scan.confidence !== undefined ? scan.confidence : scan.risk?.confidence;
  const confidence = typeof rawConf === "number" && !isNaN(rawConf) ? Math.min(100, Math.max(0, Math.round(rawConf))) : 0;

  // 3. SSL / TLS Details
  const rawSslAnalysis = scan.sslAnalysis;
  const rawCert = rawSslAnalysis?.certificate || scan.ssl?.certificate || {};
  const formattedIssuer = formatIssuerDisplay(
    scan.ssl?.issuer || rawCert?.issuer || rawSslAnalysis?.issuer
  );

  const isSslValid = Boolean(
    scan.ssl?.valid ||
    (rawSslAnalysis?.status === "CHECKED" && rawSslAnalysis?.score === 0) ||
    rawSslAnalysis?.status === "VALID" ||
    rawSslAnalysis?.status === "COMPLETED"
  );

  const ssl = {
    valid: isSslValid,
    issuer: formattedIssuer,
    validDaysRemaining: typeof rawCert?.validDaysRemaining === "number" ? rawCert.validDaysRemaining : (scan.ssl?.validDaysRemaining || 0),
    status: String(scan.ssl?.status || rawSslAnalysis?.status || (isSslValid ? "VALID" : "UNENCRYPTED")),
  };

  const sslAnalysis = rawSslAnalysis && typeof rawSslAnalysis === "object"
    ? {
        available: rawSslAnalysis.available !== false && rawSslAnalysis.status !== "UNAVAILABLE",
        protocol: String(rawSslAnalysis.protocol || (isSslValid ? "HTTPS" : "HTTP")),
        certificateStatus: String(rawSslAnalysis.status || (isSslValid ? "VALID" : "UNKNOWN")),
        score: typeof rawSslAnalysis.score === "number" ? rawSslAnalysis.score : null,
        riskLevel: String(rawSslAnalysis.level || (isSslValid ? "SAFE" : "LOW")),
        status: String(rawSslAnalysis.status || "COMPLETED"),
        issuer: formattedIssuer,
        validDaysRemaining: typeof rawCert?.validDaysRemaining === "number" ? rawCert.validDaysRemaining : undefined,
        hostnameMatch: typeof rawCert?.hostnameMatch === "boolean" ? rawCert.hostnameMatch : undefined,
        authorized: typeof rawCert?.authorized === "boolean" ? rawCert.authorized : undefined,
        explanation: String(rawSslAnalysis.reason || rawSslAnalysis.explanation || ""),
        reasons: Array.isArray(rawSslAnalysis.reasons) ? rawSslAnalysis.reasons.map(String) : [],
        error: rawSslAnalysis.error ? String(rawSslAnalysis.error) : undefined,
      }
    : undefined;

  // 4. Google Safe Browsing
  const rawSb = scan.safeBrowsing || {};
  const sbAvailable = rawSb.available !== false && rawSb.status !== "UNAVAILABLE";
  const sbThreatDetected = Boolean(rawSb.threatDetected || rawSb.isMalicious);
  const safeBrowsing = {
    available: sbAvailable,
    status: String(rawSb.status || (sbThreatDetected ? "MALICIOUS" : "CLEAN")),
    matches: Array.isArray(rawSb.matches) ? rawSb.matches : [],
    threatTypes: Array.isArray(rawSb.threatTypes) ? rawSb.threatTypes.map(String) : [],
    platforms: Array.isArray(rawSb.platforms) ? rawSb.platforms.map(String) : [],
    isMalicious: sbThreatDetected,
    cached: typeof rawSb.cached === "boolean" ? rawSb.cached : undefined,
    error: rawSb.error ? String(rawSb.error) : undefined,
  };

  // 5. VirusTotal
  const rawVt = scan.virusTotal || {};
  const vtAvailable = rawVt.available !== false && rawVt.status !== "UNAVAILABLE";
  const vtMalicious = Boolean(rawVt.malicious || (rawVt.maliciousCount && rawVt.maliciousCount > 0));
  const virusTotal = {
    available: vtAvailable,
    status: String(rawVt.status || (vtMalicious ? "MALICIOUS" : "CLEAN")),
    malicious: typeof rawVt.maliciousCount === "number" ? rawVt.maliciousCount : (rawVt.malicious ? 1 : 0),
    suspicious: typeof rawVt.suspiciousCount === "number" ? rawVt.suspiciousCount : 0,
    harmless: typeof rawVt.harmless === "number" ? rawVt.harmless : 0,
    undetected: typeof rawVt.undetectedCount === "number" ? rawVt.undetectedCount : 0,
    total: typeof rawVt.totalEngines === "number" ? rawVt.totalEngines : 0,
    detectionRatio: String(rawVt.detectionRatio || "0/0"),
    positives: typeof rawVt.enginesFlagged === "number" ? rawVt.enginesFlagged : 0,
    scanDate: rawVt.scanDate ? String(rawVt.scanDate) : undefined,
    permalink: rawVt.permalink ? String(rawVt.permalink) : undefined,
    isMalicious: vtMalicious,
    cached: typeof rawVt.cached === "boolean" ? rawVt.cached : undefined,
    error: rawVt.error ? String(rawVt.error) : undefined,
  };

  // 6. URLhaus
  const rawUh = scan.urlhaus || {};
  const uhAvailable = rawUh.available !== false && rawUh.status !== "UNAVAILABLE";
  const uhMatch = Boolean(rawUh.match || rawUh.isMalicious);
  const urlhaus = {
    available: uhAvailable,
    status: String(rawUh.status || (uhMatch ? "MALICIOUS" : "CLEAN")),
    queryStatus: String(rawUh.queryStatus || "ok"),
    threatType: rawUh.threatType ? String(rawUh.threatType) : undefined,
    urlhausUrl: rawUh.urlhausUrl ? String(rawUh.urlhausUrl) : undefined,
    reporter: rawUh.reporter ? String(rawUh.reporter) : undefined,
    dateAdded: rawUh.dateAdded ? String(rawUh.dateAdded) : undefined,
    tags: Array.isArray(rawUh.tags) ? rawUh.tags.map(String) : [],
    isMalicious: uhMatch,
    cached: typeof rawUh.cached === "boolean" ? rawUh.cached : undefined,
    error: rawUh.error ? String(rawUh.error) : undefined,
  };

  // 7. Local URL Intelligence
  const rawIntel = scan.urlIntelligence;
  const urlIntelligence = rawIntel && typeof rawIntel === "object"
    ? {
        available: rawIntel.available !== false && rawIntel.status !== "UNAVAILABLE",
        score: typeof rawIntel.score === "number" ? rawIntel.score : null,
        riskLevel: String(rawIntel.level || rawIntel.riskLevel || "SAFE"),
        status: String(rawIntel.status || "COMPLETED"),
        indicators: Array.isArray(rawIntel.indicators) ? rawIntel.indicators : [],
        explanation: String(rawIntel.reasons?.[0] || rawIntel.explanation || ""),
        reasons: Array.isArray(rawIntel.reasons) ? rawIntel.reasons.map(String) : [],
      }
    : undefined;

  // 8. Risk Factors & Reasons
  const riskFactors: RiskFactorData[] = [];
  if (Array.isArray(scan.risk?.factors)) {
    scan.risk.factors.forEach((f: any) => {
      if (f && typeof f === "object") {
        riskFactors.push({
          name: String(f.name || "Risk Metric"),
          reason: String(f.reason || ""),
          score: typeof f.score === "number" ? f.score : null,
          weight: typeof f.weight === "number" ? f.weight : 0,
          contribution: typeof f.contribution === "number" ? f.contribution : 0,
          impact: String(f.impact || "MODERATE"),
          status: String(f.status || "DETECTED"),
          available: f.available !== false,
        });
      }
    });
  } else if (Array.isArray(scan.risk?.reasons)) {
    scan.risk.reasons.forEach((reason: string) => {
      riskFactors.push({
        name: "Local Heuristics",
        reason: String(reason),
        score: null,
        weight: 0,
        contribution: 0,
        impact: threatLevel === "CRITICAL" || threatLevel === "HIGH" ? "HIGH" : "MODERATE",
        status: "DETECTED",
        available: true,
      });
    });
  }

  // 9. Findings
  const rawFindings = Array.isArray(scan.findings) 
    ? scan.findings 
    : Array.isArray(scan.risk?.findings) 
    ? scan.risk.findings 
    : [];

  const findings: SecurityFindingData[] = rawFindings.map((f: any) => ({
    source: String(f?.source || "Multi-Engine Inspection"),
    finding: String(f?.finding || "Security Finding"),
    severity: String(f?.severity || "INFO").toUpperCase() as any,
    explanation: String(f?.explanation || ""),
    evidence: f?.evidence,
    isConfirmedThreat: Boolean(f?.isConfirmedThreat),
  }));

  // 10. AI Analysis
  let aiAnalysis: AIAnalysisData | null = null;
  if (scan.aiAnalysis && typeof scan.aiAnalysis === "object") {
    aiAnalysis = {
      available: scan.aiAnalysis.available !== false,
      summary: String(scan.aiAnalysis.summary || ""),
      threatType: scan.aiAnalysis.threatType ? String(scan.aiAnalysis.threatType) : undefined,
      severity: scan.aiAnalysis.severity ? String(scan.aiAnalysis.severity) : undefined,
      explanation: scan.aiAnalysis.explanation ? String(scan.aiAnalysis.explanation) : undefined,
      keyIndicators: Array.isArray(scan.aiAnalysis.keyIndicators) ? scan.aiAnalysis.keyIndicators.map(String) : [],
      recommendedActions: Array.isArray(scan.aiAnalysis.recommendedActions) ? scan.aiAnalysis.recommendedActions.map(String) : [],
      confidenceNote: scan.aiAnalysis.confidenceNote ? String(scan.aiAnalysis.confidenceNote) : undefined,
      generatedAt: scan.aiAnalysis.generatedAt ? String(scan.aiAnalysis.generatedAt) : undefined,
      model: scan.aiAnalysis.model ? String(scan.aiAnalysis.model) : undefined,
      error: scan.aiAnalysis.error ? String(scan.aiAnalysis.error) : undefined,
    };
  }

  // 11. Recommendations
  const rawRecs = Array.isArray(scan.recommendedActions) && scan.recommendedActions.length > 0
    ? scan.recommendedActions
    : Array.isArray(aiAnalysis?.recommendedActions) && aiAnalysis.recommendedActions.length > 0
    ? aiAnalysis.recommendedActions
    : [
        "Always verify the address bar domain before submitting credentials.",
        "Never share OTPs or one-time verification tokens on unverified pages."
      ];
  const recommendedActions = rawRecs.map(String);

  // 12. Report & Scan Identifiers
  const rawId = scan.id || scan._id || scan.scanId;
  const scanId = rawId !== undefined && rawId !== null ? String(rawId) : undefined;
  const reportId = String(
    data.reportId || 
    scan.reportId || 
    `CG-2026-${(scanId ? scanId.slice(-7) : Math.random().toString(36).slice(-7)).toUpperCase()}`
  );

  let formattedTimestamp: string;
  try {
    const rawDate = scan.scannedAt || scan.createdAt || Date.now();
    const d = new Date(rawDate);
    formattedTimestamp = isNaN(d.getTime()) ? new Date().toLocaleString() : d.toLocaleString();
  } catch {
    formattedTimestamp = new Date().toLocaleString();
  }

  return {
    url: rawUrl,
    normalizedUrl,
    isValid: true,
    ssl,
    sslAnalysis,
    safeBrowsing,
    virusTotal,
    urlhaus,
    urlIntelligence,
    riskScore,
    threatLevel,
    confidence,
    analysisStatus: String(scan.analysisStatus || (riskScore === null ? "INSUFFICIENT_DATA" : "COMPLETE")),
    overrideTriggered: Boolean(scan.overrideTriggered || scan.risk?.overrideTriggered),
    overrideReason: scan.overrideReason ? String(scan.overrideReason) : scan.risk?.overrideReason ? String(scan.risk.overrideReason) : null,
    overrideType: scan.overrideType ? String(scan.overrideType) : scan.risk?.overrideType ? String(scan.risk.overrideType) : null,
    calculationMethod: String(scan.calculationMethod || scan.risk?.calculationMethod || "WEIGHTED_CALCULATION"),
    riskFactors,
    findings,
    riskReasons: Array.isArray(scan.risk?.reasons) ? scan.risk.reasons.map(String) : [],
    aiAnalysis,
    aiExplanation: scan.aiExplanation ? String(scan.aiExplanation) : scan.summary ? String(scan.summary) : undefined,
    recommendedActions,
    timestamp: formattedTimestamp,
    reportId,
    scanId,
  };
}

export default function AnalyzerPage() {
  const router = useRouter();
  const [inputUrl, setInputUrl] = useState("http://xn--paypa1-9za.example/login");
  const [activeMode, setActiveMode] = useState<"url" | "email">("url");
  
  // Single authoritative state machine
  const [analysisState, setAnalysisState] = useState<AnalysisState>("idle");
  const [analysisResult, setAnalysisResult] = useState<DetailedAnalysis | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Race condition and concurrency control
  const activeRequestIdRef = useRef<number>(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Clean up any ongoing async requests on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const handleAnalyze = useCallback(async (overrideUrl?: string) => {
    const targetUrl = (overrideUrl !== undefined ? overrideUrl : inputUrl).trim();
    if (!targetUrl) {
      setErrorMessage("Please enter a valid URL to analyze.");
      setAnalysisState("error");
      return;
    }

    // 1. Cancel previous pending request to prevent race condition overwrites
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    const currentRequestId = ++activeRequestIdRef.current;

    // 2. Safely reset all previous analysis state before starting new scan
    setAnalysisResult(null);
    setErrorMessage(null);
    setAnalysisState("loading");

    try {
      // Small debounce delay for smooth UI transition
      await new Promise((resolve) => setTimeout(resolve, 300));
      if (currentRequestId !== activeRequestIdRef.current) return;

      const response = await analyzerService.scanUrl({ url: targetUrl });
      if (currentRequestId !== activeRequestIdRef.current) return;

      const rawData = response.data;
      if (!rawData || !rawData.success) {
        throw new Error(rawData?.message || "Scan returned an unsuccessful response.");
      }

      // 3. Normalize scan response through resilient defensive layer
      const normalized = normalizeAnalysisResponse(rawData, targetUrl);
      if (currentRequestId !== activeRequestIdRef.current) return;

      // 4. Update authoritative result and transition to success
      setAnalysisResult(normalized);
      setAnalysisState("success");
    } catch (err: any) {
      if (currentRequestId !== activeRequestIdRef.current) return;
      console.error("[Analyzer Scan Error]:", err);
      const msg = err?.response?.data?.message || err?.message || "URL analysis failed. Please try again.";
      setErrorMessage(msg);
      setAnalysisState("error");
    }
  }, [inputUrl]);

  // Initial load from URL query param (?url=...)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const urlParam = params.get("url");
      if (urlParam) {
        setInputUrl(urlParam);
        setTimeout(() => {
          handleAnalyze(urlParam);
        }, 100);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDownloadPdf = () => {
    if (!analysisResult) return;
    try {
      generatePdfReport({
        ...analysisResult,
        urlIntelligence: analysisResult.urlIntelligence,
        sslAnalysis: analysisResult.sslAnalysis,
        whois: { registrar: "Forensic WHOIS", createdDate: "N/A", domainAgeDays: 0 },
      } as any);
    } catch (pdfErr) {
      console.error("[PDF Generation Error]:", pdfErr);
      alert("Incident PDF could not be generated. Technical details logged to console.");
    }
  };

  const copyUrl = () => {
    if (analysisResult?.normalizedUrl) {
      navigator.clipboard.writeText(analysisResult.normalizedUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const isScanning = analysisState === "loading";

  return (
    <ProtectedRoute>
      <div className="app-cg">
        <Sidebar />
        <div className="main-cg">
          <Header />
          <main className="content-cg">
            
            {/* Page Title */}
            <div className="page-title-cg">
              <div>
                <h1>URL Security Analysis</h1>
                <p>Analyze URLs using multiple threat intelligence sources and AI-powered analysis.</p>
              </div>
              <span style={{ color: "var(--blue)", fontSize: 11 }}>ⓘ Multi-Engine Pipeline</span>
            </div>

            {/* Selector: URL vs Email Threat Analyzer */}
            <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
              <button
                type="button"
                onClick={() => setActiveMode("url")}
                className={`btn-cg ${activeMode === "url" ? "primary" : ""}`}
              >
                <Globe size={14} />
                <span>URL Security Scanner</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveMode("email")}
                className={`btn-cg ${activeMode === "email" ? "primary" : ""}`}
              >
                <Mail size={14} />
                <span>Email Threat Analyzer</span>
              </button>
            </div>

            {activeMode === "email" && <EmailAnalyzerSection />}

            {activeMode === "url" && (
              <>
                {/* Search / Input Box Card */}
                <div className="card-cg" style={{ marginBottom: 14 }}>
                  <form 
                    onSubmit={(e) => { 
                      e.preventDefault(); 
                      if (!isScanning) handleAnalyze(); 
                    }}
                    className="urlbox-cg"
                  >
                    <div className="search-cg" style={{ height: 44, maxWidth: "none" }}>
                      <Search size={16} />
                      <input 
                        value={inputUrl} 
                        onChange={(e) => setInputUrl(e.target.value)} 
                        placeholder="Enter URL to analyze (e.g. http://example.com/login)..."
                        disabled={isScanning}
                      />
                    </div>
                    <button 
                      type="submit"
                      className="btn-cg primary"
                      disabled={isScanning || !inputUrl.trim()}
                      style={{ height: 44, padding: "0 18px", fontSize: 12 }}
                    >
                      {isScanning ? (
                        <>
                          <RefreshCw size={14} className="animate-spin" />
                          <span>Analyzing URL...</span>
                        </>
                      ) : (
                        <>
                          <span>Analyze URL</span>
                          <ArrowRight size={14} />
                        </>
                      )}
                    </button>
                  </form>
                  <div style={{ padding: "0 16px 13px", fontSize: 10, color: "var(--muted)" }}>
                    Supports HTTP, HTTPS, registered domains, raw IP addresses, and Punycode hostnames.
                  </div>
                </div>

                {/* Progress Card during active scanning */}
                {isScanning && (
                  <div className="card-cg" style={{ marginBottom: 14 }}>
                    <div className="card-body-cg">
                      <h3 style={{ marginTop: 0, marginBottom: 12, fontSize: 13, color: "var(--text)" }}>Analyzing URL...</h3>
                      {[
                        "URL normalization",
                        "Google Safe Browsing",
                        "VirusTotal",
                        "URLhaus",
                        "Local URL intelligence",
                        "SSL/TLS analysis"
                      ].map((stepName, i) => (
                        <div key={stepName} style={{ padding: "10px 0", borderBottom: "1px solid var(--line)", fontSize: 11, display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ color: i < 2 ? "var(--green)" : "var(--blue)" }}>
                            {i < 2 ? "✓" : "⟳"}
                          </span>
                          <span style={{ color: "var(--text)" }}>{stepName}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Error Banner */}
                {errorMessage && (
                  <div className="notice-cg" style={{ marginBottom: 14 }}>
                    <AlertCircle size={14} style={{ verticalAlign: "middle", marginRight: 7 }} />
                    <span>{errorMessage}</span>
                    <button 
                      type="button" 
                      onClick={() => handleAnalyze()}
                      style={{ 
                        marginLeft: 12, 
                        background: "none", 
                        border: "underline", 
                        color: "inherit", 
                        cursor: "pointer", 
                        fontWeight: 600,
                        fontSize: "inherit"
                      }}
                    >
                      Retry
                    </button>
                  </div>
                )}

                {/* Result Sections wrapped in dedicated Error Boundary */}
                {analysisResult && !isScanning && (
                  <AnalyzerErrorBoundary onRetry={() => handleAnalyze()}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                      
                      {/* Header Card */}
                      <div className="card-cg">
                        <div className="card-head-cg" style={{ flexWrap: "wrap", gap: 12 }}>
                          <div>
                            <strong style={{ fontSize: 13, color: "var(--text)", display: "flex", alignItems: "center", gap: 6 }}>
                              <span>{analysisResult.normalizedUrl}</span>
                              <button onClick={copyUrl} style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer" }}>
                                {copied ? <Check size={13} color="var(--green)" /> : <Copy size={13} />}
                              </button>
                            </strong>
                            <div style={{ fontSize: 10, color: "var(--muted)", marginTop: 4, fontFamily: "monospace" }}>
                              Report ID: {analysisResult.reportId} · {analysisResult.timestamp}
                            </div>
                          </div>

                          <div className="quick-cg">
                            <button className="btn-cg" onClick={() => handleAnalyze()}>
                              <RefreshCw size={13} /> 
                              <span>Re-analyze</span>
                            </button>
                            {analysisResult.scanId && (
                              <button 
                                className="btn-cg"
                                onClick={() => router.push(`/reports/create?scanId=${analysisResult.scanId}`)}
                              >
                                <FileText size={13} /> 
                                <span>View Incident Report</span>
                              </button>
                            )}
                            {analysisResult.scanId && (
                              <button 
                                className="btn-cg ai"
                                onClick={() => router.push(`/assistant?scanId=${analysisResult.scanId}&url=${encodeURIComponent(analysisResult.normalizedUrl)}&riskScore=${analysisResult.riskScore}&riskLevel=${analysisResult.threatLevel}`)}
                              >
                                <Bot size={13} /> 
                                <span>Ask AI</span>
                              </button>
                            )}
                            <button className="btn-cg success" onClick={handleDownloadPdf}>
                              <Download size={13} /> 
                              <span>Download PDF</span>
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Risk Assessment & Threat Intelligence Grid */}
                      <div className="grid-cg grid2-cg">
                        <RiskSummarySection
                          riskScore={analysisResult.riskScore}
                          riskLevel={analysisResult.threatLevel}
                          confidence={analysisResult.confidence}
                          calculationMethod={analysisResult.calculationMethod}
                          overrideTriggered={analysisResult.overrideTriggered}
                          overrideReason={analysisResult.overrideReason}
                          overrideType={analysisResult.overrideType}
                          analysisStatus={analysisResult.analysisStatus}
                          riskFactors={analysisResult.riskFactors}
                        />

                        <ThreatIntelligenceCard
                          safeBrowsing={analysisResult.safeBrowsing}
                          virusTotal={analysisResult.virusTotal}
                          urlhaus={analysisResult.urlhaus}
                        />
                      </div>

                      {/* Structure, Connection, and AI Grid */}
                      <div className="grid-cg grid3-cg">
                        <UrlStructureCard
                          intelligence={analysisResult.urlIntelligence}
                          findings={analysisResult.findings}
                        />

                        <ConnectionSecurityCard
                          ssl={analysisResult.ssl}
                          sslAnalysis={analysisResult.sslAnalysis}
                        />

                        <AiAssessmentCard
                          aiAnalysis={analysisResult.aiAnalysis}
                          aiExplanation={analysisResult.aiExplanation}
                          recommendedActions={analysisResult.recommendedActions}
                          scanId={analysisResult.scanId}
                          threatLevel={analysisResult.threatLevel}
                          riskScore={analysisResult.riskScore}
                        />
                      </div>

                      {/* Discovered Security Findings */}
                      <EvidenceFindingsCard
                        findings={analysisResult.findings}
                      />

                    </div>
                  </AnalyzerErrorBoundary>
                )}
              </>
            )}

          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
