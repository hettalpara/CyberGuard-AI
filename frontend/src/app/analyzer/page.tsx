"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Search, 
  ShieldAlert, 
  Lock, 
  Cpu, 
  Download, 
  CheckCircle2, 
  RefreshCw,
  Copy,
  Check,
  Zap,
  AlertCircle,
  AlertTriangle,
  Shield,
  Activity,
  Globe,
  Info,
  Bot,
  Sparkles,
  FileText,
  Mail
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { RiskMeter } from "@/components/common/risk-meter";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { generatePdfReport } from "@/utils/pdf-report-generator";
import { analyzerService } from "@/services/analyzer.service";
import type { RiskFactorData, AIAnalysisData, SecurityFindingData } from "@/services/analyzer.service";
import { 
  ScanProgress, 
  ScanState,
  ThreatIntelGrid, 
  EmailAnalyzerSection 
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
    indicators: string[];
    explanation: string;
    reasons: string[];
  };
  safeBrowsing: { available: boolean; match: boolean; threatType?: string; threatTypes?: string[]; status: string; reason?: string; error?: string; score?: number | null };
  urlhaus: { available: boolean; match: boolean; threatType?: string; tags?: string[]; status: string; reason?: string; error?: string };
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

// ============================================================================
// Risk Level & Finding Helpers
// ============================================================================

function getSeverityBadge(severity: string): string {
  switch (severity) {
    case "CRITICAL": return "bg-red-100 text-red-700 border-red-300";
    case "HIGH": return "bg-orange-100 text-orange-700 border-orange-300";
    case "MODERATE":
    case "MEDIUM": return "bg-amber-100 text-amber-700 border-amber-300";
    case "LOW": return "bg-yellow-100 text-yellow-700 border-yellow-300";
    case "INFO": return "bg-blue-50 text-blue-700 border-blue-200";
    default: return "bg-slate-100 text-slate-700 border-slate-200";
  }
}

function formatEvidence(evidence: unknown): string {
  if (!evidence) return "";
  if (typeof evidence === "string") return evidence;
  if (typeof evidence === "object") {
    try {
      const entries = Object.entries(evidence as Record<string, unknown>);
      return entries
        .map(([k, v]) => `${k}: ${typeof v === "object" ? JSON.stringify(v) : String(v)}`)
        .join(" • ");
    } catch {
      return JSON.stringify(evidence);
    }
  }
  return String(evidence);
}

function getRiskLevelColor(level: string): string {
  switch (level) {
    case "CRITICAL": return "text-red-600";
    case "HIGH": return "text-orange-600";
    case "MODERATE":
    case "MEDIUM": return "text-amber-600";
    case "LOW": return "text-yellow-600";
    case "SAFE": return "text-emerald-600";
    case "INCONCLUSIVE": return "text-slate-500";
    default: return "text-slate-600";
  }
}

function getRiskLevelBg(level: string): string {
  switch (level) {
    case "CRITICAL": return "bg-red-100 text-red-700 border-red-200";
    case "HIGH": return "bg-orange-100 text-orange-700 border-orange-200";
    case "MODERATE":
    case "MEDIUM": return "bg-amber-100 text-amber-700 border-amber-200";
    case "LOW": return "bg-yellow-100 text-yellow-700 border-yellow-200";
    case "SAFE": return "bg-emerald-100 text-emerald-700 border-emerald-200";
    case "INCONCLUSIVE": return "bg-slate-100 text-slate-700 border-slate-300";
    default: return "bg-slate-100 text-slate-700 border-slate-200";
  }
}

function getConfidenceColor(confidence: number): string {
  if (confidence >= 80) return "text-emerald-600";
  if (confidence >= 60) return "text-amber-600";
  return "text-red-600";
}

function getConfidenceBg(confidence: number): string {
  if (confidence >= 80) return "bg-emerald-500";
  if (confidence >= 60) return "bg-amber-500";
  return "bg-red-500";
}

function getFactorBarColor(score: number | null): string {
  if (score === null) return "bg-slate-300";
  if (score >= 80) return "bg-red-500";
  if (score >= 60) return "bg-orange-500";
  if (score >= 40) return "bg-amber-500";
  if (score >= 20) return "bg-yellow-500";
  return "bg-emerald-500";
}

function getFactorIcon(name: string) {
  switch (name) {
    case "Google Safe Browsing": return <ShieldAlert className="w-4 h-4" />;
    case "VirusTotal": return <Cpu className="w-4 h-4" />;
    case "URLhaus Malware Reputation": return <AlertTriangle className="w-4 h-4 text-red-500" />;
    case "URL Intelligence": return <Globe className="w-4 h-4" />;
    case "SSL/TLS":
    case "SSL/TLS Analysis": return <Lock className="w-4 h-4" />;
    default: return <Shield className="w-4 h-4" />;
  }
}

function getImpactBadge(impact: string): string {
  switch (impact) {
    case "CRITICAL": return "bg-red-100 text-red-700 border-red-200";
    case "HIGH": return "bg-orange-100 text-orange-700 border-orange-200";
    case "MEDIUM": return "bg-amber-100 text-amber-700 border-amber-200";
    case "LOW": return "bg-yellow-100 text-yellow-700 border-yellow-200";
    case "NONE": return "bg-emerald-100 text-emerald-700 border-emerald-200";
    default: return "bg-slate-100 text-slate-600 border-slate-200";
  }
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

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
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
      setError("Please enter a valid web URL or domain name (e.g. https://example.com).");
      setIsAnalyzing(false);
      return;
    }

    setScanState("SCANNING");

    try {
      const { data } = await analyzerService.scanUrl({ url: rawInput });

      if (data && data.success && data.scan) {
        const scan = data.scan as any;
        
        // Use the risk level directly from the backend
        const threatLevel = scan.risk?.level || scan.riskLevel || "SAFE";

        const malCount = Number(scan.virusTotal?.maliciousCount ?? (scan.virusTotal?.malicious ? 1 : 0));
        const suspCount = Number(scan.virusTotal?.suspiciousCount ?? (scan.virusTotal?.suspicious ? 1 : 0));
        const undetCount = Number(scan.virusTotal?.undetectedCount ?? 0);
        const totEngines = Number(scan.virusTotal?.totalEngines ?? 70);

        // Extract risk factors from the response
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
                "Always verify the address bar before entering credentials.",
                "Never share OTPs or private passwords on unverified sites."
              ],
          timestamp: new Date(scan.scannedAt || Date.now()).toLocaleString(),
          reportId: data.reportId || scan.reportId || `CG-2026-${(scan.id || "").slice(-6).toUpperCase() || Math.floor(100000 + Math.random() * 900000)}`,
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
      // Pass safe dummy whois to pdf report generator if expected
      generatePdfReport({
        ...analysis,
        urlIntelligence: analysis.urlIntelligence,
        sslAnalysis: analysis.sslAnalysis,
        whois: { registrar: "Not Inspected in Phase 5", createdDate: "N/A", domainAgeDays: 0 },
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
      <div className="min-h-screen flex flex-col lg:flex-row bg-[#F8FAFC]">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto w-full">
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 bg-emerald-100 text-[#10B981] font-bold text-xs rounded-md flex items-center gap-1">
                ⭐ Core Threat Intelligence
              </span>
              <span className="text-xs text-slate-500 font-medium">Multi-Vector Security Inspection Pipeline</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1F2937] tracking-tight">Multi-Vector Threat Analyzer</h1>
            <p className="text-slate-500 text-xs sm:text-sm mt-1">
              Select an investigation vector to analyze suspicious URLs, inspect email sender authentication (SPF/DKIM/DMARC), or detect phone scam numbers.
            </p>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex flex-wrap items-center gap-2 mb-6 border-b border-[#E5E7EB] pb-3">
            <button
              type="button"
              onClick={() => setActiveMode("url")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                activeMode === "url"
                  ? "bg-[#111827] text-white shadow-sm"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-[#E5E7EB]"
              }`}
            >
              <Globe className="w-4 h-4 text-[#10B981]" />
              <span>URL & Web Domain</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveMode("email")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                activeMode === "email"
                  ? "bg-[#111827] text-white shadow-sm"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-[#E5E7EB]"
              }`}
            >
              <Mail className="w-4 h-4 text-emerald-400" />
              <span>Email Threat Analyzer</span>
            </button>
          </div>

          {activeMode === "email" && <EmailAnalyzerSection />}

          {activeMode === "url" && (
            <>
              <Card className="border-[#E5E7EB] bg-white shadow-sm mb-8">
                <CardHeader className="pb-3 border-b border-[#E5E7EB]">
                  <CardTitle className="text-base font-semibold text-[#1F2937]">Submit URL for Deep Security Analysis</CardTitle>
              <CardDescription className="text-xs text-slate-500">Supports HTTP, HTTPS, registered domains, raw IP addresses, and Punycode hostnames.</CardDescription>
            </CardHeader>
            <CardContent className="pt-5">
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleAnalyze} className="flex flex-col sm:flex-row gap-3">
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
                    placeholder="Enter URL (e.g. https://example.com or http://192.0.2.1/login/verify)"
                    className="pl-9 bg-slate-50 border-[#E5E7EB] h-11 text-xs rounded-xl focus:ring-[#10B981] focus:border-[#10B981]"
                    disabled={isAnalyzing || scanState === "VALIDATING" || scanState === "SCANNING"}
                  />
                </div>
                <Button 
                  type="submit" 
                  disabled={isAnalyzing || scanState === "VALIDATING" || scanState === "SCANNING" || !inputUrl.trim()}
                  className="bg-[#10B981] hover:bg-[#059669] text-white font-semibold text-xs h-11 px-6 rounded-xl flex items-center gap-2 shrink-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isAnalyzing || scanState === "VALIDATING" || scanState === "SCANNING" ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" /> Analyzing...
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4" /> Start AI Analysis
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

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

          {analysis && scanState === "COMPLETED" && !isAnalyzing && (
            <div className="space-y-6">
              {/* URL Header + Risk Score Overview */}
              <div className="p-5 bg-white border border-[#E5E7EB] rounded-2xl shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-[#1F2937] truncate max-w-md">{analysis.normalizedUrl}</span>
                    <button onClick={copyUrl} className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer" title="Copy URL">
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <span className="text-[11px] text-slate-400 mt-0.5 block">Report ID: {analysis.reportId} • {analysis.timestamp}</span>
                </div>
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full md:w-auto justify-between md:justify-end">
                  <RiskMeter score={analysis.riskScore} threatLevel={analysis.threatLevel as any} size="md" />
                  {analysis.scanId && (
                    <>
                      <Button
                        onClick={() => {
                          if (analysis.reportId && analysis.reportId.startsWith("CG-")) {
                            router.push(`/reports/${analysis.reportId}`);
                          } else {
                            router.push(`/reports/create?scanId=${analysis.scanId}`);
                          }
                        }}
                        className="bg-[#0F172A] hover:bg-slate-800 text-white text-xs px-3.5 h-9 rounded-xl flex items-center gap-1.5 font-semibold cursor-pointer"
                      >
                        <FileText className="w-4 h-4 text-emerald-400" /> View Incident Report
                      </Button>
                      <Button
                        onClick={() => router.push(`/assistant?scanId=${analysis.scanId}`)}
                        variant="outline"
                        className="border-[#10B981] text-[#10B981] hover:bg-emerald-50 text-xs px-3.5 h-9 rounded-xl flex items-center gap-1.5 font-semibold cursor-pointer"
                      >
                        <Bot className="w-4 h-4" /> Ask AI
                      </Button>
                    </>
                  )}
                  <Button onClick={handleDownloadPdf} className="bg-[#10B981] hover:bg-[#059669] text-white text-xs px-4 h-9 rounded-xl flex items-center gap-1.5 font-semibold cursor-pointer">
                    <Download className="w-3.5 h-3.5" /> Download PDF Report
                  </Button>
                </div>
              </div>

              {/* Status Banners for LIMITED or INSUFFICIENT_DATA */}
              {analysis.analysisStatus === "LIMITED" && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="text-xs text-amber-900">
                    <p className="font-bold">Limited Threat Analysis Active</p>
                    <p className="mt-0.5 text-amber-800">
                      External threat intelligence APIs are currently unreachable or timed out. 
                      The risk evaluation below is calculated using Local URL Intelligence and SSL/TLS Analysis.
                    </p>
                  </div>
                </div>
              )}

              {(analysis.analysisStatus === "INSUFFICIENT_DATA" || analysis.threatLevel === "INCONCLUSIVE") && (
                <div className="p-4 bg-slate-100 border border-slate-300 rounded-xl flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-slate-600 shrink-0 mt-0.5" />
                  <div className="text-xs text-slate-900">
                    <p className="font-bold">Inconclusive Security Assessment</p>
                    <p className="mt-0.5 text-slate-700">
                      Insufficient data to evaluate URL security. All local and external analysis modules were unavailable.
                    </p>
                  </div>
                </div>
              )}

              {/* Short-Circuit Override Alert Banner */}
              {analysis.overrideTriggered && (
                <div className="p-5 bg-red-50/90 border-2 border-red-300 rounded-2xl shadow-sm flex flex-col sm:flex-row items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-6 h-6 text-red-600" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-black uppercase tracking-wider text-red-700 bg-red-100 px-3 py-0.5 rounded-full border border-red-300">
                        Critical Override Triggered
                      </span>
                      <span className="text-xs text-slate-600 font-semibold">
                        Calculation Method: <strong className="text-red-700 font-bold">Short-Circuit Override</strong>
                      </span>
                    </div>
                    <p className="text-sm font-bold text-red-950 pt-1">
                      {analysis.overrideReason || "Immediate critical threat detected by security provider."}
                    </p>
                    <p className="text-xs text-red-800 leading-relaxed">
                      To prevent high-severity detections from being diluted by clean results from other providers, the risk engine immediately bypassed the weighted formula and assigned an authoritative score of <strong className="font-bold">{analysis.riskScore} / 100 ({analysis.threatLevel})</strong>.
                    </p>
                  </div>
                </div>
              )}

              {/* ============================================================ */}
              {/* Risk Score Overview Card */}
              {/* ============================================================ */}
              <Card className="border-[#E5E7EB] bg-white shadow-sm overflow-hidden">
                <CardHeader className="pb-3 border-b border-[#E5E7EB]">
                  <div className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-[#10B981]" />
                    <CardTitle className="text-sm font-bold text-[#1F2937]">Risk Assessment Overview</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Risk Score */}
                    <div className="text-center p-4 bg-slate-50 rounded-xl border border-[#E5E7EB]">
                      <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Final Risk Score</p>
                      <p className={`text-4xl font-black tracking-tight ${getRiskLevelColor(analysis.threatLevel)}`}>
                        {analysis.riskScore !== null ? `${analysis.riskScore} / 100` : "—"}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-1">
                        {analysis.riskScore !== null ? (analysis.overrideTriggered ? "Short-Circuit Score" : "Weighted Score") : "Insufficient Data"}
                      </p>
                    </div>

                    {/* Risk Level */}
                    <div className="text-center p-4 bg-slate-50 rounded-xl border border-[#E5E7EB]">
                      <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Final Risk Level</p>
                      <span className={`inline-block px-3 py-1.5 rounded-lg text-sm font-bold border ${getRiskLevelBg(analysis.threatLevel)}`}>
                        {analysis.threatLevel}
                      </span>
                    </div>

                    {/* Confidence */}
                    <div className="text-center p-4 bg-slate-50 rounded-xl border border-[#E5E7EB]">
                      <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Confidence</p>
                      <p className={`text-4xl font-black tracking-tight ${getConfidenceColor(analysis.confidence)}`}>
                        {analysis.confidence}
                        <span className="text-lg font-bold">%</span>
                      </p>
                      <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mt-2">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${getConfidenceBg(analysis.confidence)}`}
                          style={{ width: `${Math.min(100, Math.max(0, analysis.confidence))}%` }}
                        />
                      </div>
                    </div>

                    {/* Calculation Method */}
                    <div className="text-center p-4 bg-slate-50 rounded-xl border border-[#E5E7EB]">
                      <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Calculation Method</p>
                      <span className={`inline-block px-3 py-1.5 rounded-lg text-xs font-bold border ${analysis.overrideTriggered ? "bg-red-100 text-red-700 border-red-300" : "bg-slate-100 text-slate-700 border-slate-300"}`}>
                        {analysis.overrideTriggered ? "Short-Circuit Override" : "Weighted Calculation"}
                      </span>
                      <p className="text-[10px] text-slate-400 mt-2">
                        {analysis.overrideTriggered ? "Bypassed weighted average" : "Multi-provider weighted sum"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* ============================================================ */}
              {/* Evidence-Based Security Findings Card */}
              {/* ============================================================ */}
              {analysis.findings && analysis.findings.length > 0 && (
                <Card className="border-[#E5E7EB] bg-white shadow-sm overflow-hidden">
                  <CardHeader className="pb-3 border-b border-[#E5E7EB]">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ShieldAlert className="w-5 h-5 text-[#10B981]" />
                        <CardTitle className="text-sm font-bold text-[#1F2937]">Evidence-Based Security Findings</CardTitle>
                      </div>
                      <span className="text-xs text-slate-500 font-medium">
                        {analysis.findings.length} findings evaluated
                      </span>
                    </div>
                    <CardDescription className="text-[11px] text-slate-500">
                      Granular security evidence discovered during scan across threat engines and URL inspection.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6">
                    <div className="space-y-3">
                      {analysis.findings.map((item, i) => (
                        <div
                          key={i}
                          className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-start justify-between gap-3 ${
                            item.severity === "CRITICAL"
                              ? "bg-red-50/70 border-red-200"
                              : item.severity === "HIGH"
                              ? "bg-orange-50/70 border-orange-200"
                              : item.severity === "MEDIUM"
                              ? "bg-amber-50/70 border-amber-200"
                              : item.severity === "LOW"
                              ? "bg-yellow-50/50 border-yellow-200"
                              : "bg-slate-50/80 border-slate-200"
                          }`}
                        >
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-xs font-bold text-[#1F2937]">{item.source}</span>
                              <span className="text-slate-400">•</span>
                              <span className="text-[11px] font-mono text-slate-600 bg-white/80 px-2 py-0.5 rounded border border-slate-200">
                                {item.finding}
                              </span>
                              {item.isConfirmedThreat && (
                                <span className="text-[10px] font-bold uppercase tracking-wider text-red-700 bg-red-100 border border-red-300 px-1.5 py-0.5 rounded">
                                  Confirmed Threat
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-700 leading-relaxed font-medium">
                              {item.explanation}
                            </p>
                            {item.evidence && (
                              <p className="text-[11px] text-slate-500 font-mono">
                                Evidence: {formatEvidence(item.evidence)}
                              </p>
                            )}
                          </div>
                          <div className="shrink-0 self-start">
                            <span className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border uppercase tracking-wider ${getSeverityBadge(item.severity)}`}>
                              {item.severity}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* 5 Core Security Provider Cards */}
              <ThreatIntelGrid analysis={analysis} />

              {/* ============================================================ */}
              {/* Risk Factor Breakdown Card (NEW) */}
              {/* ============================================================ */}
              {analysis.riskFactors && analysis.riskFactors.length > 0 && (
                <Card className="border-[#E5E7EB] bg-white shadow-sm overflow-hidden">
                  <CardHeader className="pb-3 border-b border-[#E5E7EB]">
                    <div className="flex items-center gap-2">
                      <Activity className="w-5 h-5 text-[#10B981]" />
                      <CardTitle className="text-sm font-bold text-[#1F2937]">Risk Factor Breakdown</CardTitle>
                    </div>
                    <CardDescription className="text-[11px] text-slate-500">
                      Each factor&apos;s individual score, weight, and contribution to the final risk score.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6">
                    <div className="space-y-4">
                      {analysis.riskFactors.map((factor, i) => (
                        <div 
                          key={i} 
                          className={`p-4 rounded-xl border transition-all ${
                            !factor.available 
                              ? "bg-slate-50 border-slate-200 opacity-75" 
                              : "bg-white border-[#E5E7EB] hover:border-slate-300"
                          }`}
                        >
                          {/* Factor Header */}
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className={`${
                                !factor.available ? "text-slate-400" 
                                : factor.score !== null && factor.score >= 50 ? "text-red-500" 
                                : "text-emerald-600"
                              }`}>
                                {getFactorIcon(factor.name)}
                              </span>
                              <span className="text-xs font-bold text-[#1F2937]">{factor.name}</span>
                              {!factor.available ? (
                                <span className="px-1.5 py-0.5 bg-slate-200 text-slate-600 text-[10px] font-bold rounded">
                                  {factor.status === "ERROR" ? "ERROR" : "UNAVAILABLE"}
                                </span>
                              ) : factor.status === "MALWARE_DETECTED" ? (
                                <span className="px-1.5 py-0.5 bg-red-100 text-red-700 text-[10px] font-bold rounded border border-red-200">
                                  MALWARE DETECTED
                                </span>
                              ) : factor.status === "THREAT_DETECTED" || (factor.score !== null && factor.score >= 50) ? (
                                <span className="px-1.5 py-0.5 bg-red-100 text-red-700 text-[10px] font-bold rounded border border-red-200">
                                  THREAT DETECTED
                                </span>
                              ) : (
                                <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded border border-emerald-200">
                                  CHECKED
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`px-1.5 py-0.5 text-[10px] font-semibold rounded border ${getImpactBadge(factor.impact)}`}>
                                {factor.impact}
                              </span>
                            </div>
                          </div>

                          {/* Score Bar + Metrics */}
                          <div className="flex items-center gap-3 mb-2">
                            <div className="flex-1 bg-slate-100 h-2 rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full transition-all duration-500 ${getFactorBarColor(factor.score)}`}
                                style={{ width: `${factor.score !== null ? Math.min(100, Math.max(0, factor.score)) : 0}%` }}
                              />
                            </div>
                            <div className="flex items-center gap-2 text-[11px] font-semibold shrink-0">
                              <span className="text-[#1F2937]">
                                {factor.score !== null ? `${factor.score}/100` : "N/A"}
                              </span>
                              <span className="text-slate-400">•</span>
                              <span className="text-slate-500">
                                Weight: {(factor.weight * 100).toFixed(0)}%
                              </span>
                              <span className="text-slate-400">•</span>
                              <span className={`${
                                factor.contribution > 0 ? "text-red-600" : "text-emerald-600"
                              }`}>
                                +{factor.contribution.toFixed(1)}
                              </span>
                            </div>
                          </div>

                          {/* Factor Reason */}
                          <p className="text-[11px] text-slate-600 leading-relaxed flex items-start gap-1.5">
                            <Info className="w-3 h-3 text-slate-400 shrink-0 mt-0.5" />
                            {factor.reason}
                          </p>
                        </div>
                      ))}
                    </div>

                    {/* Evidence-Based Methodology Legend */}
                    <div className="mt-5 p-3 bg-slate-50 rounded-xl border border-[#E5E7EB]">
                      <p className="text-[10px] text-slate-500 font-medium flex items-center gap-1.5">
                        <Info className="w-3 h-3 text-[#10B981] shrink-0" />
                        <span>
                          <strong>Evidence-Based Model:</strong> CyberGuard AI computes deterministic risk scores directly from collected security findings and confirmed threat signals rather than fixed percentages. Independent verified malware/phishing findings dominate weak positive indicators (e.g. valid SSL). Risk score (0–100) and scan confidence (0–100%) are calculated independently.
                        </span>
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Gemini AI Security Analysis Card */}
              <Card className="border-[#E5E7EB] bg-white shadow-sm overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-emerald-50/80 via-teal-50/40 to-slate-50 border-b border-emerald-100/80 pb-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-emerald-100 text-[#10B981] rounded-lg">
                      <Bot className="w-4 h-4" />
                    </div>
                    <div>
                      <CardTitle className="text-sm font-bold text-[#1F2937] flex items-center gap-2">
                        Gemini AI Security Analysis
                      </CardTitle>
                      <p className="text-[11px] text-slate-500 font-normal">
                        Defensive threat explanation synthesized from verified security intelligence
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {analysis.scanId && (
                      <button
                        type="button"
                        onClick={() => router.push(`/assistant?scanId=${analysis.scanId}`)}
                        className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-[#10B981] hover:bg-emerald-100 rounded-full text-[10px] font-bold border border-emerald-200 transition cursor-pointer"
                        title="Chat with AI Assistant about this scan"
                      >
                        <Bot className="w-3 h-3" />
                        Ask Assistant
                      </button>
                    )}
                    {analysis.aiAnalysis?.available ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-bold border border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        AI Explanation Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 text-slate-600 rounded-full text-[10px] font-semibold border border-slate-200">
                        <AlertCircle className="w-3 h-3 text-slate-400" />
                        AI Explanation Unavailable
                      </span>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-5">
                  {/* Meta badges: Threat Type & Severity */}
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                      <span className="text-slate-400 font-medium text-[11px]">Threat Type:</span>
                      <span className="font-bold text-slate-800">
                        {analysis.aiAnalysis?.threatType || "Security Assessment"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                      <span className="text-slate-400 font-medium text-[11px]">Descriptive Severity:</span>
                      <span className={`font-bold ${getRiskLevelColor(analysis.threatLevel)}`}>
                        {analysis.aiAnalysis?.severity || analysis.threatLevel}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400">
                      Official risk classification: <strong className={getRiskLevelColor(analysis.threatLevel)}>{analysis.riskScore !== null ? `${analysis.riskScore}/100` : "Inconclusive"} ({analysis.threatLevel})</strong>
                    </span>
                  </div>

                  {/* Summary & Explanation */}
                  <div className="p-4 bg-slate-50/80 rounded-xl border border-[#E5E7EB] space-y-2">
                    {analysis.aiAnalysis?.summary && (
                      <p className="text-xs font-bold text-slate-900 border-b border-slate-200/60 pb-2">
                        {analysis.aiAnalysis.summary}
                      </p>
                    )}
                    <p className="text-xs leading-relaxed text-slate-700 font-medium">
                      {analysis.aiExplanation}
                    </p>
                  </div>

                  {/* Key Indicators */}
                  {analysis.aiAnalysis?.keyIndicators && analysis.aiAnalysis.keyIndicators.length > 0 && (
                    <div>
                      <h4 className="text-xs font-bold text-[#1F2937] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-[#10B981]" />
                        Key Security Indicators:
                      </h4>
                      <div className="space-y-1.5 bg-emerald-50/40 border border-emerald-200/60 rounded-xl p-3.5">
                        {analysis.aiAnalysis.keyIndicators.map((indicator, i) => (
                          <div key={i} className="flex items-start gap-2 text-xs text-slate-800 font-medium">
                            <span className="text-[#10B981] font-bold">✓</span>
                            <span>{indicator}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Risk Reasons from Deterministic Engine */}
                  {analysis.riskReasons && analysis.riskReasons.length > 0 && (
                    <div>
                      <h4 className="text-xs font-bold text-[#1F2937] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                        Identified Risk Factors:
                      </h4>
                      <div className="space-y-1.5 bg-amber-50/60 border border-amber-200/80 rounded-xl p-3.5">
                        {analysis.riskReasons.map((reason, i) => (
                          <div key={i} className="flex items-start gap-2 text-xs text-amber-900 font-medium">
                            <span className="text-amber-500 font-bold">•</span>
                            <span>{reason}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recommended Defensive Actions */}
                  <div>
                    <h4 className="text-xs font-bold text-[#1F2937] uppercase tracking-wider mb-3">
                      Recommended Defensive Actions:
                    </h4>
                    <div className="space-y-2">
                      {analysis.recommendedActions.map((act, i) => (
                        <div key={i} className="flex items-start gap-2.5 text-xs text-slate-700">
                          <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" />
                          <span>{act}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Confidence Note */}
                  {analysis.aiAnalysis?.confidenceNote && (
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-600 flex items-center gap-2">
                      <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{analysis.aiAnalysis.confidenceNote}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
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
