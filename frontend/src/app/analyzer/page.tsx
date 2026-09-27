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
  RotateCw,
  FileText,
  Bot,
  ShieldCheck,
  Activity
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
  safeBrowsing: {
    available: boolean;
    match: boolean;
    threatType?: string;
    threatTypes?: string[];
    status: string;
    reason?: string;
    error?: string;
    score?: number | null;
  };
  urlhaus: {
    available: boolean;
    match: boolean;
    threatType?: string;
    tags?: string[];
    status: string;
    reason?: string;
    error?: string;
  };
  virusTotal: {
    detectionRatio: string;
    enginesFlagged: number;
    totalEngines: number;
    maliciousCount: number;
    suspiciousCount: number;
    undetectedCount: number;
    status?: string;
    error?: string;
  };
  riskScore: number | null;
  threatLevel: string;
  confidence: number;
  analysisStatus?: string;
  overrideTriggered?: boolean;
  overrideReason?: string | null;
  overrideType?: string | null;
  calculationMethod?: string;
  riskFactors: RiskFactorData[];
  findings?: SecurityFindingData[];
  riskReasons: string[];
  aiAnalysis?: AIAnalysisData;
  aiExplanation: string;
  recommendedActions: string[];
  timestamp: string;
  reportId: string;
}

export default function SmartUrlAnalyzerPage() {
  const router = useRouter();
  const [activeMode, setActiveMode] = useState<"url" | "email">("url");
  const [inputUrl, setInputUrl] = useState("");
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
      }
      const modeParam = params.get("mode");
      if (modeParam === "email") {
        setActiveMode("email");
      }
    }
  }, []);

  const handleAnalyze = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const rawInput = inputUrl.trim();
    if (!rawInput || isAnalyzing || scanState === "VALIDATING" || scanState === "SCANNING") {
      return;
    }

    setIsAnalyzing(true);
    setScanState("VALIDATING");
    setAnalysis(null);
    setError(null);

    // Client-side URL validation
    let parsedUrl: URL | null = null;
    try {
      const urlWithScheme = /^https?:\/\//i.test(rawInput) ? rawInput : `http://${rawInput}`;
      parsedUrl = new URL(urlWithScheme);
      if (!parsedUrl.hostname || parsedUrl.hostname.length < 3 || !parsedUrl.hostname.includes(".")) {
        throw new Error("Invalid domain name");
      }
    } catch {
      setScanState("FAILED");
      setError("Please enter a valid web URL or domain name (e.g. https://example.com or 192.0.2.1).");
      setIsAnalyzing(false);
      return;
    }

    setScanState("SCANNING");

    try {
      const { data } = await analyzerService.scanUrl({ url: rawInput });

      if (data && data.success && data.scan) {
        const scan = data.scan as any;
        
        // Use risk level directly from backend
        const threatLevel = scan.risk?.level || scan.riskLevel || "SAFE";

        const malCount = Number(scan.virusTotal?.maliciousCount ?? (scan.virusTotal?.malicious ? 1 : 0));
        const suspCount = Number(scan.virusTotal?.suspiciousCount ?? (scan.virusTotal?.suspicious ? 1 : 0));
        const undetCount = Number(scan.virusTotal?.undetectedCount ?? 0);
        const totEngines = Number(scan.virusTotal?.totalEngines ?? 70);

        const riskFactors: RiskFactorData[] = scan.riskFactors || scan.risk?.factors || [];

        const result: DetailedAnalysis = {
          url: scan.url,
          normalizedUrl: scan.normalizedUrl,
          isValid: true,
          ssl: {
            valid: scan.ssl?.valid ?? false,
            issuer: scan.ssl?.issuer || (scan.ssl?.valid ? "Verified Certificate Authority" : "No SSL / Insecure"),
            validDaysRemaining: scan.ssl?.validDaysRemaining ?? 0,
            status: scan.ssl?.status,
          },
          safeBrowsing: {
            available:
              Boolean(scan.safeBrowsing?.available) &&
              scan.safeBrowsing?.status !== "UNAVAILABLE" &&
              scan.safeBrowsing?.status !== "ERROR",
            match: Boolean(scan.safeBrowsing?.threatDetected),
            threatType:
              scan.safeBrowsing?.threatTypes && scan.safeBrowsing.threatTypes.length > 0
                ? scan.safeBrowsing.threatTypes.join(", ")
                : scan.safeBrowsing?.threatDetected
                ? "Threat Flagged"
                : undefined,
            threatTypes: scan.safeBrowsing?.threatTypes || [],
            status: scan.safeBrowsing?.status || "UNAVAILABLE",
            reason: scan.safeBrowsing?.reason,
            error: scan.safeBrowsing?.error,
            score: scan.safeBrowsing?.score ?? null,
          },
          urlhaus: {
            available:
              Boolean(scan.urlhaus?.available) &&
              scan.urlhaus?.status !== "UNAVAILABLE" &&
              scan.urlhaus?.status !== "ERROR",
            match: Boolean(scan.urlhaus?.match),
            threatType: scan.urlhaus?.threatType,
            tags: scan.urlhaus?.tags || [],
            status: scan.urlhaus?.status || "UNAVAILABLE",
            reason: scan.urlhaus?.reason,
            error: scan.urlhaus?.error,
          },
          virusTotal: {
            detectionRatio: scan.virusTotal?.detectionRatio || `${malCount + suspCount} / ${totEngines || 70}`,
            enginesFlagged: malCount + suspCount,
            totalEngines: totEngines || 70,
            maliciousCount: malCount,
            suspiciousCount: suspCount,
            undetectedCount: undetCount,
            status: scan.virusTotal?.status,
            error: scan.virusTotal?.error,
          },
          urlIntelligence: scan.urlIntelligence
            ? {
                available:
                  scan.urlIntelligence.available !== false &&
                  scan.urlIntelligence.status !== "UNAVAILABLE" &&
                  scan.urlIntelligence.status !== "ERROR",
                score: scan.urlIntelligence.score,
                riskLevel: scan.urlIntelligence.riskLevel || "SAFE",
                status: scan.urlIntelligence.status || "COMPLETED",
                indicators: scan.urlIntelligence.indicators || [],
                explanation: scan.urlIntelligence.explanation || scan.urlIntelligence.reasons?.[0] || "",
                reasons: scan.urlIntelligence.reasons || [],
              }
            : undefined,
          sslAnalysis: scan.sslAnalysis
            ? {
                available:
                  scan.sslAnalysis.available !== false &&
                  scan.sslAnalysis.status !== "UNAVAILABLE" &&
                  scan.sslAnalysis.status !== "ERROR",
                protocol: scan.sslAnalysis.protocol || "UNKNOWN",
                certificateStatus: scan.sslAnalysis.certificateStatus || "UNKNOWN",
                score: scan.sslAnalysis.score,
                riskLevel: scan.sslAnalysis.riskLevel || "SAFE",
                status: scan.sslAnalysis.status || "COMPLETED",
                issuer: scan.sslAnalysis.certificate?.issuer,
                validDaysRemaining: scan.sslAnalysis.certificate?.validDaysRemaining,
                hostnameMatch: scan.sslAnalysis.certificate?.hostnameMatch,
                authorized: scan.sslAnalysis.certificate?.authorized,
                explanation: scan.sslAnalysis.explanation || scan.sslAnalysis.reason || "",
                reasons: scan.sslAnalysis.reasons || [],
                error: scan.sslAnalysis.error,
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
          reportId: data.reportId || scan.reportId || `CG-${(scan.id || "").slice(-6).toUpperCase() || Math.floor(100000 + Math.random() * 900000)}`,
          scanId: scan._id || scan.id || scan.scanId,
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
      <div className="min-h-screen flex flex-col lg:flex-row bg-slate-50 dark:bg-[#0B0F19]">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <Header />
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto w-full space-y-6">
            
            {/* Top Page Header */}
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 font-mono font-bold text-[10px] rounded border border-emerald-300 dark:border-emerald-800">
                  CORE SOC PIPELINE
                </span>
                <span className="text-[11px] font-mono text-slate-500">
                  Multi-Source Threat Inspection Engine
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-mono font-black text-slate-900 dark:text-slate-100 tracking-tight">
                URL Security Analysis
              </h1>
              <p className="text-slate-500 text-xs sm:text-sm mt-1 max-w-3xl">
                Analyze a URL using multiple threat intelligence sources and local security checks.
              </p>
            </div>

            {/* Vector Selector Mode Switcher */}
            <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
              <button
                type="button"
                onClick={() => setActiveMode("url")}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-semibold transition flex items-center gap-2 cursor-pointer ${
                  activeMode === "url"
                    ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs"
                    : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 border border-slate-200 dark:border-slate-800"
                }`}
              >
                <Globe className="w-3.5 h-3.5 text-emerald-500" />
                <span>URL & Web Domain</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveMode("email")}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-semibold transition flex items-center gap-2 cursor-pointer ${
                  activeMode === "email"
                    ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs"
                    : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 border border-slate-200 dark:border-slate-800"
                }`}
              >
                <Mail className="w-3.5 h-3.5 text-emerald-500" />
                <span>Email Threat Analyzer</span>
              </button>
            </div>

            {/* Email Vector Tab */}
            {activeMode === "email" && <EmailAnalyzerSection />}

            {/* URL Vector Tab */}
            {activeMode === "url" && (
              <>
                {/* Prominent URL Input Card */}
                <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] shadow-sm">
                  <CardHeader className="py-3.5 px-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40">
                    <CardTitle className="text-xs font-bold font-mono uppercase tracking-wider text-slate-800 dark:text-slate-200">
                      Submit URL for Deep Security Analysis
                    </CardTitle>
                    <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
                      Supports HTTP, HTTPS, registered domains, raw IP addresses, and Punycode hostnames.
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="p-5">
                    {error && (
                      <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-400 text-xs rounded-lg flex items-center gap-2 font-mono">
                        <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                        <span>{error}</span>
                      </div>
                    )}

                    <form onSubmit={handleAnalyze} className="flex flex-col sm:flex-row gap-2.5">
                      <div className="relative flex-1">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                        <Input
                          value={inputUrl}
                          onChange={(e) => {
                            setInputUrl(e.target.value);
                            if (scanState === "FAILED") {
                              setScanState("IDLE");
                              setError(null);
                            }
                          }}
                          placeholder="https://example.com/login"
                          className="pl-9 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 h-10 text-xs font-mono rounded-lg focus:ring-emerald-500"
                          disabled={isAnalyzing || scanState === "VALIDATING" || scanState === "SCANNING"}
                        />
                      </div>
                      <Button 
                        type="submit" 
                        disabled={isAnalyzing || scanState === "VALIDATING" || scanState === "SCANNING" || !inputUrl.trim()}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-mono font-bold text-xs h-10 px-5 rounded-lg flex items-center gap-2 shrink-0 cursor-pointer disabled:opacity-50"
                      >
                        {isAnalyzing || scanState === "VALIDATING" || scanState === "SCANNING" ? (
                          <>
                            <RotateCw className="w-4 h-4 animate-spin" />
                            <span>Analyzing...</span>
                          </>
                        ) : (
                          <>
                            <Zap className="w-4 h-4" />
                            <span>Analyze URL</span>
                          </>
                        )}
                      </Button>
                    </form>
                  </CardContent>
                </Card>

                {/* Progress UI */}
                {(scanState === "VALIDATING" || scanState === "SCANNING" || scanState === "FAILED") && (
                  <ScanProgress
                    state={scanState}
                    targetUrl={inputUrl.trim()}
                    errorMessage={error}
                    onRetry={() => {
                      setScanState("IDLE");
                      setError(null);
                    }}
                  />
                )}

                {/* Analysis Results Display */}
                {analysis && scanState === "COMPLETED" && !isAnalyzing && (
                  <div className="space-y-6">
                    {/* 1. Result Header: URL, Scan ID, Date, Action Controls */}
                    <div className="p-4 sm:p-5 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-bold text-slate-900 dark:text-slate-100 truncate max-w-lg">
                            {analysis.normalizedUrl}
                          </span>
                          <button
                            onClick={copyUrl}
                            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 cursor-pointer transition"
                            title="Copy Normalized URL"
                          >
                            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] font-mono text-slate-500">
                          <span>Scan ID: <strong className="text-slate-700 dark:text-slate-300">{analysis.reportId}</strong></span>
                          <span>•</span>
                          <span>{analysis.timestamp}</span>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-start md:justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAnalyze()}
                          className="text-xs font-mono border-slate-200 dark:border-slate-800 h-8 px-3 rounded-lg flex items-center gap-1.5"
                          title="Re-run security analysis on this URL"
                        >
                          <RotateCw className="w-3.5 h-3.5" /> Re-analyze
                        </Button>

                        {analysis.scanId && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => {
                                if (analysis.reportId && analysis.reportId.startsWith("CG-")) {
                                  router.push(`/reports/${analysis.reportId}`);
                                } else {
                                  router.push(`/reports/create?scanId=${analysis.scanId}`);
                                }
                              }}
                              className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 text-xs font-mono h-8 px-3 rounded-lg flex items-center gap-1.5"
                            >
                              <FileText className="w-3.5 h-3.5" /> View Incident Report
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => router.push(`/assistant?scanId=${analysis.scanId}`)}
                              className="border-emerald-500/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-xs font-mono h-8 px-3 rounded-lg flex items-center gap-1.5"
                            >
                              <Bot className="w-3.5 h-3.5" /> Ask AI
                            </Button>
                          </>
                        )}

                        <Button
                          size="sm"
                          onClick={handleDownloadPdf}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-mono h-8 px-3 rounded-lg flex items-center gap-1.5"
                        >
                          <Download className="w-3.5 h-3.5" /> Download PDF
                        </Button>
                      </div>
                    </div>

                    {/* 2. Visual Focus: Risk Assessment Summary Card + Horizontal Risk Gauge */}
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

                    {/* 3. Threat Intelligence Section: Safe Browsing, VirusTotal, URLhaus */}
                    <ThreatIntelligenceCard
                      safeBrowsing={analysis.safeBrowsing}
                      virusTotal={analysis.virusTotal}
                      urlhaus={analysis.urlhaus}
                    />

                    {/* 4. Local URL Structure Analysis Section */}
                    <UrlStructureCard
                      intelligence={analysis.urlIntelligence}
                      findings={analysis.findings}
                    />

                    {/* 5. Connection Security Section (SSL/TLS) */}
                    <ConnectionSecurityCard
                      ssl={analysis.ssl}
                      sslAnalysis={analysis.sslAnalysis}
                    />

                    {/* 6. Discovered Security Findings & Evidence List */}
                    <EvidenceFindingsCard
                      findings={analysis.findings}
                    />

                    {/* 7. Gemini AI Security Assessment Card */}
                    <AiAssessmentCard
                      aiAnalysis={analysis.aiAnalysis}
                      aiExplanation={analysis.aiExplanation}
                      recommendedActions={analysis.recommendedActions}
                      scanId={analysis.scanId}
                      threatLevel={analysis.threatLevel}
                      riskScore={analysis.riskScore}
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
