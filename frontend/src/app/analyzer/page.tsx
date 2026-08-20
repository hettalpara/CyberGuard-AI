"use client";

import React, { useState, useEffect } from "react";
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
  AlertTriangle
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

interface DetailedAnalysis {
  url: string;
  normalizedUrl: string;
  isValid: boolean;
  ssl: { valid: boolean; issuer: string; validDaysRemaining: number; status?: string };
  safeBrowsing: { match: boolean; threatType?: string; status?: string };
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
  riskScore: number;
  threatLevel: "SAFE" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  riskReasons: string[];
  aiExplanation: string;
  recommendedActions: string[];
  timestamp: string;
  reportId: string;
}

export default function SmartUrlAnalyzerPage() {
  const [inputUrl, setInputUrl] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [step, setStep] = useState<number>(0);
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
    }
  }, []);

  const pipelineSteps = [
    "1. Validating URL format & scheme structure...",
    "2. Checking SSL/TLS certificate authenticity & chain...",
    "3. Scanning Google Safe Browsing threat database...",
    "4. Checking VirusTotal 70+ multi-engine signatures...",
    "5. Calculating risk score & threat heuristics...",
    "6. Synthesizing risk metrics & generating report..."
  ];

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputUrl.trim() || isAnalyzing) return;

    setIsAnalyzing(true);
    setAnalysis(null);
    setError(null);

    // Visual step progress
    const stepInterval = setInterval(() => {
      setStep((prev) => (prev < pipelineSteps.length - 1 ? prev + 1 : prev));
    }, 300);

    try {
      const { data } = await analyzerService.scanUrl({ url: inputUrl.trim() });
      clearInterval(stepInterval);
      setStep(pipelineSteps.length - 1);

      if (data && data.success && data.scan) {
        const scan = data.scan as any;
        
        let threatLevel: "SAFE" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" = "SAFE";
        if (scan.riskScore >= 75) {
          threatLevel = "CRITICAL";
        } else if (scan.riskScore >= 60) {
          threatLevel = "HIGH";
        } else if (scan.riskScore >= 30) {
          threatLevel = "MEDIUM";
        } else if (scan.riskScore > 10) {
          threatLevel = "LOW";
        } else {
          threatLevel = "SAFE";
        }

        const malCount = Number(scan.virusTotal?.maliciousCount ?? (scan.virusTotal?.malicious ? 1 : 0));
        const suspCount = Number(scan.virusTotal?.suspiciousCount ?? (scan.virusTotal?.suspicious ? 1 : 0));
        const undetCount = Number(scan.virusTotal?.undetectedCount ?? 0);
        const totEngines = Number(scan.virusTotal?.totalEngines ?? 70);

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
            match: scan.safeBrowsing?.threatDetected ?? false,
            threatType: scan.safeBrowsing?.threatType || (scan.safeBrowsing?.threatDetected ? "Threat Flagged" : undefined),
            status: scan.safeBrowsing?.status,
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
          riskScore: scan.riskScore,
          threatLevel: (scan.risk?.level as any) || threatLevel,
          riskReasons: scan.risk?.reasons || [],
          aiExplanation: scan.aiExplanation || scan.summary,
          recommendedActions: scan.recommendedActions && scan.recommendedActions.length > 0
            ? scan.recommendedActions
            : [
                "Always verify the address bar before entering credentials.",
                "Never share OTPs or private passwords on unverified sites."
              ],
          timestamp: new Date(scan.scannedAt || Date.now()).toLocaleString(),
          reportId: `REP-2026-${(scan.id || "").slice(-6).toUpperCase() || Math.floor(100000 + Math.random() * 900000)}`,
        };

        setAnalysis(result);
      }
    } catch (err: any) {
      clearInterval(stepInterval);
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
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 bg-emerald-100 text-[#10B981] font-bold text-xs rounded-md flex items-center gap-1">
                ⭐ Core Feature
              </span>
              <span className="text-xs text-slate-500 font-medium">Multi-Engine Security Analysis Pipeline</span>
            </div>
            <h1 className="text-3xl font-extrabold text-[#1F2937] tracking-tight">Smart Phishing URL Analyzer</h1>
            <p className="text-slate-500 text-xs sm:text-sm mt-1">
              Enter any suspicious web address for automated SSL, Google Safe Browsing, VirusTotal, and AI risk assessment.
            </p>
          </div>

          <Card className="border-[#E5E7EB] bg-white shadow-sm mb-8">
            <CardHeader className="pb-3 border-b border-[#E5E7EB]">
              <CardTitle className="text-base font-semibold text-[#1F2937]">Submit URL for Deep Security Analysis</CardTitle>
              <CardDescription className="text-xs text-slate-500">Supports HTTP, HTTPS, domain names, and shortened URL links.</CardDescription>
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
                    onChange={(e) => setInputUrl(e.target.value)}
                    placeholder="Enter URL (e.g. https://sbi-verify-account.xyz/login)"
                    className="pl-9 bg-slate-50 border-[#E5E7EB] h-11 text-xs rounded-xl focus:ring-[#10B981] focus:border-[#10B981]"
                    disabled={isAnalyzing}
                  />
                </div>
                <Button 
                  type="submit" 
                  disabled={isAnalyzing || !inputUrl.trim()}
                  className="bg-[#10B981] hover:bg-[#059669] text-white font-semibold text-xs h-11 px-6 rounded-xl flex items-center gap-2 shrink-0 cursor-pointer"
                >
                  {isAnalyzing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" /> Scanning...
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4" /> Start AI Analysis
                    </>
                  )}
                </Button>
              </form>

              <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
                <span className="text-slate-400 text-[11px] font-medium">Quick Test Prompts:</span>
                <button
                  type="button"
                  onClick={() => setInputUrl("https://sbi-verify-account.xyz/login")}
                  className="px-2.5 py-1 bg-red-50 text-red-600 border border-red-200 rounded-lg text-[11px] font-medium hover:bg-red-100 transition cursor-pointer"
                >
                  Phishing Link Demo
                </button>
                <button
                  type="button"
                  onClick={() => setInputUrl("https://github.com")}
                  className="px-2.5 py-1 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-lg text-[11px] font-medium hover:bg-emerald-100 transition cursor-pointer"
                >
                  Safe Domain Demo
                </button>
              </div>
            </CardContent>
          </Card>

          {isAnalyzing && (
            <Card className="border-[#E5E7EB] bg-white shadow-sm mb-8 p-6 text-center">
              <div className="max-w-md mx-auto space-y-4">
                <div className="p-3 bg-emerald-50 text-[#10B981] rounded-full w-fit mx-auto animate-pulse">
                  <RefreshCw className="w-6 h-6 animate-spin" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[#1F2937]">Analyzing URL Threat Intelligence...</h3>
                  <p className="text-xs text-[#10B981] font-semibold mt-1">{pipelineSteps[step]}</p>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-[#10B981] h-full transition-all duration-300"
                    style={{ width: `${((step + 1) / pipelineSteps.length) * 100}%` }}
                  />
                </div>
              </div>
            </Card>
          )}

          {analysis && !isAnalyzing && (
            <div className="space-y-6">
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
                <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
                  <RiskMeter score={analysis.riskScore} threatLevel={analysis.threatLevel} size="md" />
                  <Button onClick={handleDownloadPdf} className="bg-[#10B981] hover:bg-[#059669] text-white text-xs px-4 h-9 rounded-xl flex items-center gap-1.5 font-semibold cursor-pointer">
                    <Download className="w-3.5 h-3.5" /> Download PDF Report
                  </Button>
                </div>
              </div>

              {/* 3 Core Security Provider Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* SSL Certificate Card */}
                <Card className="border-[#E5E7EB] bg-white shadow-sm">
                  <CardContent className="p-5 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-500">SSL Certificate</span>
                      <Lock className={`w-4 h-4 ${analysis.ssl.valid ? "text-emerald-600" : "text-red-500"}`} />
                    </div>
                    <div className="text-base font-bold text-[#1F2937]">
                      {analysis.ssl.valid ? "Secure (HTTPS)" : "Untrusted / Insecure"}
                    </div>
                    <p className="text-[11px] text-slate-500 truncate">{analysis.ssl.issuer}</p>
                  </CardContent>
                </Card>

                {/* Google Safe Browsing Card */}
                <Card className="border-[#E5E7EB] bg-white shadow-sm">
                  <CardContent className="p-5 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-500">Google Safe Browsing</span>
                      <ShieldAlert className={`w-4 h-4 ${analysis.safeBrowsing.match ? "text-red-600" : "text-emerald-600"}`} />
                    </div>
                    <div className="text-base font-bold text-[#1F2937]">
                      {analysis.safeBrowsing.match ? "Threat Flagged" : "No Threat Found"}
                    </div>
                    <p className="text-[11px] text-slate-500 truncate">{analysis.safeBrowsing.threatType || "Clean Database Match"}</p>
                  </CardContent>
                </Card>

                {/* VirusTotal Card */}
                <Card className="border-[#E5E7EB] bg-white shadow-sm">
                  <CardContent className="p-5 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-500">VirusTotal Detection</span>
                      <Cpu className={`w-4 h-4 ${analysis.virusTotal.enginesFlagged > 0 ? "text-red-600" : "text-emerald-600"}`} />
                    </div>
                    <div className="text-base font-bold text-[#1F2937]">
                      {analysis.virusTotal.detectionRatio} Engines
                    </div>
                    <p className="text-[11px] text-slate-500">
                      {analysis.virusTotal.error
                        ? analysis.virusTotal.error
                        : `Malicious: ${analysis.virusTotal.maliciousCount} • Suspicious: ${analysis.virusTotal.suspiciousCount}`}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Threat Explanation & Risk Reasons */}
              <Card className="border-[#E5E7EB] bg-white shadow-sm overflow-hidden">
                <CardHeader className="bg-emerald-50/60 border-b border-emerald-100 pb-3">
                  <div className="flex items-center gap-2">
                    <Cpu className="w-5 h-5 text-[#10B981]" />
                    <CardTitle className="text-sm font-bold text-[#1F2937]">AI Analysis & Threat Intelligence Summary</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <p className="text-xs leading-relaxed text-slate-700 font-medium bg-slate-50 p-4 rounded-xl border border-[#E5E7EB]">
                    {analysis.aiExplanation}
                  </p>

                  {analysis.riskReasons && analysis.riskReasons.length > 0 && (
                    <div>
                      <h4 className="text-xs font-bold text-[#1F2937] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                        Identified Risk Indicators:
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

                  <div>
                    <h4 className="text-xs font-bold text-[#1F2937] uppercase tracking-wider mb-3">Recommended Mitigation Steps:</h4>
                    <div className="space-y-2">
                      {analysis.recommendedActions.map((act, i) => (
                        <div key={i} className="flex items-start gap-2.5 text-xs text-slate-700">
                          <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" />
                          <span>{act}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </main>
      </div>
    </div>
    </ProtectedRoute>
  );
}
