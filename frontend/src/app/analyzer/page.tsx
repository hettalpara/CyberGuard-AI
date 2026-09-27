"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Search, 
  Download, 
  Copy, 
  Check, 
  Zap, 
  AlertCircle, 
  Globe, 
  Mail, 
  RefreshCw,
  FileText,
  Bot,
  ShieldCheck,
  ArrowRight
} from "lucide-react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { generatePdfReport } from "@/utils/pdf-report-generator";
import { analyzerService } from "@/services/analyzer.service";
import type { RiskFactorData, AIAnalysisData, SecurityFindingData } from "@/services/analyzer.service";
import { 
  ScanProgress, 
  type ScanState,
  EmailAnalyzerSection,
  RiskSummarySection,
  ThreatIntelligenceCard,
  UrlStructureCard,
  ConnectionSecurityCard,
  EvidenceFindingsCard,
  AiAssessmentCard
} from "@/components/analyzer";

interface DetailedAnalysis {
  scanId?: string;
  url: string;
  normalizedUrl: string;
  isValid: boolean;
  ssl: { valid: boolean; issuer: string; validDaysRemaining: number; status?: string };
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
  threatLevel: string;
  riskScore: number | null;
  confidence: number;
  analysisStatus: string;
  overrideTriggered?: boolean;
  overrideReason?: string | null;
  overrideType?: string | null;
  calculationMethod?: string;
  riskFactors?: RiskFactorData[];
  findings?: SecurityFindingData[];
  riskReasons?: string[];
  aiAnalysis?: AIAnalysisData;
  aiExplanation?: string;
  recommendedActions?: string[];
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

export default function AnalyzerPage() {
  const router = useRouter();
  const [inputUrl, setInputUrl] = useState("http://xn--paypa1-9za.example/login");
  const [activeMode, setActiveMode] = useState<"url" | "email">("url");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [scanState, setScanState] = useState<ScanState>("IDLE");
  const [analysis, setAnalysis] = useState<DetailedAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

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
  }, []);

  const handleAnalyze = async (overrideUrl?: string) => {
    const targetUrl = (overrideUrl || inputUrl).trim();
    if (!targetUrl) {
      setError("Please enter a valid URL to analyze.");
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setScanState("VALIDATING");

    try {
      await new Promise((resolve) => setTimeout(resolve, 400));
      setScanState("SCANNING");

      const response = await analyzerService.scanUrl({ url: targetUrl });
      const data = response.data;

      if (data && data.success && data.scan) {
        const scan = data.scan;
        const threatLevel = (scan.riskLevel || scan.risk?.level || "SAFE").toUpperCase();

        const riskFactors: RiskFactorData[] = [];
        if (scan.risk && Array.isArray(scan.risk.reasons)) {
          scan.risk.reasons.forEach((reason: string) => {
            riskFactors.push({
              name: "Local Heuristics",
              reason,
              score: null,
              weight: 0,
              contribution: 0,
              impact: threatLevel === "CRITICAL" || threatLevel === "HIGH" ? "HIGH" : "MODERATE",
              status: "DETECTED",
              available: true,
            });
          });
        }

        const result: DetailedAnalysis = {
          url: scan.url || targetUrl,
          normalizedUrl: scan.normalizedUrl || targetUrl,
          isValid: true,
          ssl: {
            valid: scan.sslAnalysis?.status === "VALID" || scan.sslAnalysis?.status === "COMPLETED",
            issuer: (scan.sslAnalysis?.certificate as any)?.issuer || "Unknown CA",
            validDaysRemaining: (scan.sslAnalysis?.certificate as any)?.validDaysRemaining || 0,
            status: scan.sslAnalysis?.status || "UNKNOWN",
          },
          safeBrowsing: {
            available: scan.safeBrowsing?.available !== false && scan.safeBrowsing?.status !== "UNAVAILABLE",
            status: scan.safeBrowsing?.status || (scan.safeBrowsing?.threatDetected ? "MALICIOUS" : "CLEAN"),
            matches: [],
            threatTypes: scan.safeBrowsing?.threatTypes || [],
            platforms: [],
            isMalicious: scan.safeBrowsing?.threatDetected || false,
            cached: undefined,
            error: scan.safeBrowsing?.error,
          },
          virusTotal: {
            available: scan.virusTotal?.available !== false && scan.virusTotal?.status !== "UNAVAILABLE",
            status: scan.virusTotal?.status || (scan.virusTotal?.malicious ? "MALICIOUS" : "CLEAN"),
            malicious: scan.virusTotal?.maliciousCount || (scan.virusTotal?.malicious ? 1 : 0),
            suspicious: scan.virusTotal?.suspiciousCount || 0,
            harmless: scan.virusTotal?.harmless || 0,
            undetected: scan.virusTotal?.undetectedCount || 0,
            total: scan.virusTotal?.totalEngines || 0,
            detectionRatio: scan.virusTotal?.detectionRatio || "0/0",
            positives: scan.virusTotal?.enginesFlagged || 0,
            scanDate: undefined,
            permalink: scan.virusTotal?.permalink || undefined,
            isMalicious: Boolean(scan.virusTotal?.malicious),
            cached: undefined,
            error: scan.virusTotal?.error,
          },
          urlhaus: {
            available: scan.urlhaus?.available !== false && scan.urlhaus?.status !== "UNAVAILABLE",
            status: scan.urlhaus?.status || (scan.urlhaus?.match ? "MALICIOUS" : "CLEAN"),
            queryStatus: "ok",
            threatType: scan.urlhaus?.threatType,
            urlhausUrl: undefined,
            reporter: undefined,
            dateAdded: undefined,
            tags: scan.urlhaus?.tags || [],
            isMalicious: scan.urlhaus?.match || false,
            cached: undefined,
            error: scan.urlhaus?.error,
          },
          urlIntelligence: scan.urlIntelligence
            ? {
                available: scan.urlIntelligence.status !== "UNAVAILABLE",
                score: scan.urlIntelligence.score,
                riskLevel: scan.urlIntelligence.level || "SAFE",
                status: scan.urlIntelligence.status || "COMPLETED",
                indicators: scan.urlIntelligence.indicators || [],
                explanation: scan.urlIntelligence.reasons?.[0] || "",
                reasons: scan.urlIntelligence.reasons || [],
              }
            : undefined,
          sslAnalysis: scan.sslAnalysis
            ? {
                available: scan.sslAnalysis.status !== "UNAVAILABLE",
                protocol: scan.sslAnalysis.protocol || "UNKNOWN",
                certificateStatus: scan.sslAnalysis.status || "UNKNOWN",
                score: scan.sslAnalysis.score,
                riskLevel: scan.sslAnalysis.level || "SAFE",
                status: scan.sslAnalysis.status || "COMPLETED",
                issuer: (scan.sslAnalysis.certificate as any)?.issuer,
                validDaysRemaining: (scan.sslAnalysis.certificate as any)?.validDaysRemaining,
                hostnameMatch: (scan.sslAnalysis.certificate as any)?.hostnameMatch,
                authorized: (scan.sslAnalysis.certificate as any)?.authorized,
                explanation: scan.sslAnalysis.reason || "",
                reasons: [],
                error: undefined,
              }
            : undefined,
          riskScore: scan.riskScore,
          threatLevel,
          confidence: scan.confidence ?? scan.risk?.confidence ?? 0,
          analysisStatus: scan.analysisStatus || (scan.riskScore === null ? "INSUFFICIENT_DATA" : "COMPLETE"),
          overrideTriggered: scan.overrideTriggered !== undefined ? scan.overrideTriggered : scan.risk?.overrideTriggered ?? false,
          overrideReason: scan.overrideReason !== undefined ? scan.overrideReason : scan.risk?.overrideReason ?? null,
          overrideType: scan.overrideType !== undefined ? scan.overrideType : scan.risk?.overrideType ?? null,
          calculationMethod: scan.calculationMethod || scan.risk?.calculationMethod || "WEIGHTED_CALCULATION",
          riskFactors,
          findings: scan.findings || scan.risk?.findings || [],
          riskReasons: scan.risk?.reasons || [],
          aiAnalysis: scan.aiAnalysis,
          aiExplanation: scan.aiExplanation || scan.summary,
          recommendedActions: scan.recommendedActions && scan.recommendedActions.length > 0
            ? scan.recommendedActions
            : [
                "Always verify the address bar domain before submitting credentials.",
                "Never share OTPs or one-time verification tokens on unverified pages."
              ],
          timestamp: new Date(scan.scannedAt || Date.now()).toLocaleString(),
          reportId: data.reportId || scan.reportId || `CG-2026-${(scan.id || "").slice(-7).toUpperCase() || "579F328"}`,
          scanId: scan.id || (scan as any)._id || (scan as any).scanId,
        };

        setScanState("COMPLETED");
        setAnalysis(result);
      } else {
        throw new Error(data?.message || "Scan returned unsuccessful response.");
      }
    } catch (err: any) {
      setScanState("FAILED");
      const msg = err?.response?.data?.message || err?.message || "URL analysis failed. Please try again.";
      setError(msg);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDownloadPdf = () => {
    if (analysis) {
      generatePdfReport({
        ...analysis,
        urlIntelligence: analysis.urlIntelligence,
        sslAnalysis: analysis.sslAnalysis,
        whois: { registrar: "Forensic WHOIS", createdDate: "N/A", domainAgeDays: 0 },
      } as any);
    }
  };

  const copyUrl = () => {
    if (analysis) {
      navigator.clipboard.writeText(analysis.normalizedUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

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
                    onSubmit={(e) => { e.preventDefault(); handleAnalyze(); }}
                    className="urlbox-cg"
                  >
                    <div className="search-cg" style={{ height: 44, maxWidth: "none" }}>
                      <Search size={16} />
                      <input 
                        value={inputUrl} 
                        onChange={(e) => setInputUrl(e.target.value)} 
                        placeholder="Enter URL to analyze (e.g. http://example.com/login)..."
                        disabled={isAnalyzing}
                      />
                    </div>
                    <button 
                      type="submit"
                      className="btn-cg primary"
                      disabled={isAnalyzing || !inputUrl.trim()}
                      style={{ height: 44, padding: "0 18px", fontSize: 12 }}
                    >
                      {isAnalyzing ? (
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
                {isAnalyzing && (
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
                      ].map((x, i) => (
                        <div key={x} style={{ padding: "10px 0", borderBottom: "1px solid var(--line)", fontSize: 11, display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ color: i < 2 ? "var(--green)" : "var(--blue)" }}>
                            {i < 2 ? "✓" : "⟳"}
                          </span>
                          <span style={{ color: "var(--text)" }}>{x}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Error Banner */}
                {error && (
                  <div className="notice-cg" style={{ marginBottom: 14 }}>
                    <AlertCircle size={14} style={{ verticalAlign: "middle", marginRight: 7 }} />
                    {error}
                  </div>
                )}

                {/* Result Sections */}
                {analysis && !isAnalyzing && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    
                    {/* Header Card */}
                    <div className="card-cg">
                      <div className="card-head-cg" style={{ flexWrap: "wrap", gap: 12 }}>
                        <div>
                          <strong style={{ fontSize: 13, color: "var(--text)", display: "flex", alignItems: "center", gap: 6 }}>
                            <span>{analysis.normalizedUrl}</span>
                            <button onClick={copyUrl} style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer" }}>
                              {copied ? <Check size={13} color="var(--green)" /> : <Copy size={13} />}
                            </button>
                          </strong>
                          <div style={{ fontSize: 10, color: "var(--muted)", marginTop: 4, fontFamily: "monospace" }}>
                            Report ID: {analysis.reportId} · {analysis.timestamp}
                          </div>
                        </div>

                        <div className="quick-cg">
                          <button className="btn-cg" onClick={() => handleAnalyze()}>
                            <RefreshCw size={13} /> 
                            <span>Re-analyze</span>
                          </button>
                          {analysis.scanId && (
                            <button 
                              className="btn-cg"
                              onClick={() => router.push(`/reports/create?scanId=${analysis.scanId}`)}
                            >
                              <FileText size={13} /> 
                              <span>View Incident Report</span>
                            </button>
                          )}
                          {analysis.scanId && (
                            <button 
                              className="btn-cg ai"
                              onClick={() => router.push(`/assistant?scanId=${analysis.scanId}&url=${encodeURIComponent(analysis.normalizedUrl)}&riskScore=${analysis.riskScore}&riskLevel=${analysis.threatLevel}`)}
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
                        riskScore={analysis.riskScore}
                        riskLevel={analysis.threatLevel}
                        confidence={analysis.confidence}
                        calculationMethod={analysis.calculationMethod}
                        overrideTriggered={analysis.overrideTriggered}
                        overrideReason={analysis.overrideReason}
                        overrideType={analysis.overrideType}
                        analysisStatus={analysis.analysisStatus}
                        riskFactors={analysis.riskFactors}
                      />

                      <ThreatIntelligenceCard
                        safeBrowsing={analysis.safeBrowsing}
                        virusTotal={analysis.virusTotal}
                        urlhaus={analysis.urlhaus}
                      />
                    </div>

                    {/* Structure, Connection, and AI Grid */}
                    <div className="grid-cg grid3-cg">
                      <UrlStructureCard
                        intelligence={analysis.urlIntelligence}
                        findings={analysis.findings}
                      />

                      <ConnectionSecurityCard
                        ssl={analysis.ssl}
                        sslAnalysis={analysis.sslAnalysis}
                      />

                      <AiAssessmentCard
                        aiAnalysis={analysis.aiAnalysis}
                        aiExplanation={analysis.aiExplanation}
                        recommendedActions={analysis.recommendedActions}
                        scanId={analysis.scanId}
                        threatLevel={analysis.threatLevel}
                        riskScore={analysis.riskScore}
                      />
                    </div>

                    {/* Discovered Security Findings */}
                    <EvidenceFindingsCard
                      findings={analysis.findings}
                    />

                  </div>
                )}
              </>
            )}

          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
