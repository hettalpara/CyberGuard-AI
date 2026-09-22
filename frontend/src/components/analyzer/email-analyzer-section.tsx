"use client";

import React, { useState } from "react";
import axios from "axios";
import {
  Mail,
  Shield,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  RefreshCw,
  Zap,
  ChevronDown,
  ChevronUp,
  Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { analyzerService, type EmailAnalysisResult } from "@/services/analyzer.service";

function getStatusBadge(status: "PASS" | "FAIL" | "MISSING" | "UNKNOWN") {
  switch (status) {
    case "PASS":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> PASS
        </span>
      );
    case "FAIL":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-200">
          <XCircle className="w-3.5 h-3.5 text-red-600" /> FAIL
        </span>
      );
    case "MISSING":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> MISSING
        </span>
      );
    case "UNKNOWN":
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-300">
          <HelpCircle className="w-3.5 h-3.5 text-slate-500" /> UNKNOWN
        </span>
      );
  }
}

function getRiskBadge(level: string) {
  switch (level) {
    case "CRITICAL":
      return <span className="px-3 py-1 bg-red-100 text-red-700 border border-red-200 rounded-lg text-xs font-bold">CRITICAL THREAT</span>;
    case "HIGH":
      return <span className="px-3 py-1 bg-orange-100 text-orange-700 border border-orange-200 rounded-lg text-xs font-bold">HIGH RISK</span>;
    case "MODERATE":
      return <span className="px-3 py-1 bg-amber-100 text-amber-700 border border-amber-200 rounded-lg text-xs font-bold">MODERATE RISK</span>;
    case "LOW":
      return <span className="px-3 py-1 bg-yellow-100 text-yellow-700 border border-yellow-200 rounded-lg text-xs font-bold">LOW RISK</span>;
    case "SAFE":
    default:
      return <span className="px-3 py-1 bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold">LEGITIMATE / SAFE</span>;
  }
}

export function EmailAnalyzerSection() {
  const [email, setEmail] = useState("");
  const [headers, setHeaders] = useState("");
  const [showHeaders, setShowHeaders] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<EmailAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || isAnalyzing) return;

    setIsAnalyzing(true);
    setError(null);
    setResult(null);

    try {
      const response = await analyzerService.analyzeEmail({
        email: email.trim(),
        headers: headers.trim() ? headers.trim() : undefined,
      });

      if (response.data && (response.data.emailAnalysis || response.data.data)) {
        setResult(response.data.emailAnalysis || response.data.data);
      } else {
        setError("Invalid response received from email analyzer");
      }
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || "Failed to analyze email address");
      } else {
        setError("An unexpected error occurred during email analysis");
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Input Card */}
      <Card className="border-[#E5E7EB] bg-white shadow-sm">
        <CardHeader className="pb-3 border-b border-[#E5E7EB]">
          <div className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-[#10B981]" />
            <CardTitle className="text-base font-semibold text-[#1F2937]">
              Submit Email for Spoofing & Phishing Inspection
            </CardTitle>
          </div>
          <CardDescription className="text-xs text-slate-500">
            Checks sender domain authenticity, SPF, DKIM, DMARC alignment, free webmail impersonation, and header mismatches.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-5">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleAnalyze} className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                <Input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter sender email (e.g. security-alert@paypal.com or service@support-bank.xyz)"
                  className="pl-9 bg-slate-50 border-[#E5E7EB] h-11 text-xs rounded-xl focus:ring-[#10B981] focus:border-[#10B981]"
                  disabled={isAnalyzing}
                />
              </div>
              <Button
                type="submit"
                disabled={isAnalyzing || !email.trim()}
                className="bg-[#10B981] hover:bg-[#059669] text-white font-semibold text-xs h-11 px-6 rounded-xl flex items-center gap-2 shrink-0 cursor-pointer disabled:opacity-40"
              >
                {isAnalyzing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Inspecting...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" /> Analyze Email
                  </>
                )}
              </Button>
            </div>

            {/* Collapsible Headers Section */}
            <div>
              <button
                type="button"
                onClick={() => setShowHeaders(!showHeaders)}
                className="text-xs font-semibold text-slate-600 hover:text-[#10B981] flex items-center gap-1.5 transition cursor-pointer"
              >
                {showHeaders ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                <span>{showHeaders ? "Hide Email Headers (Optional)" : "Add Raw Email Headers (Optional)"}</span>
              </button>

              {showHeaders && (
                <div className="mt-2 space-y-1">
                  <textarea
                    value={headers}
                    onChange={(e) => setHeaders(e.target.value)}
                    placeholder="Paste RFC 2822 raw email headers (e.g. Received, From, Reply-To, Authentication-Results, Message-ID)..."
                    rows={5}
                    maxLength={100 * 1024}
                    className="w-full p-3 bg-slate-50 border border-[#E5E7EB] rounded-xl text-xs font-mono text-slate-700 focus:ring-1 focus:ring-[#10B981] focus:outline-none"
                    disabled={isAnalyzing}
                  />
                  <p className="text-[11px] text-slate-400">
                    Headers allow CyberGuard to verify DKIM signatures and detect From vs Reply-To redirection attacks.
                  </p>
                </div>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Analysis Result Display */}
      {result && (
        <div className="space-y-5 animate-in fade-in duration-300">
          {/* Header Summary Banner */}
          <Card className="border-[#E5E7EB] bg-white shadow-sm overflow-hidden">
            <div className="p-5 border-b border-[#E5E7EB] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-50/50">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
                    Email Security Evaluation
                  </span>
                  {getRiskBadge(result.riskLevel)}
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 font-mono break-all">
                  {result.email}
                </h2>
                <p className="text-xs text-slate-600 mt-1 max-w-2xl">{result.summary}</p>
              </div>

              <div className="text-right shrink-0 bg-white p-3 rounded-xl border border-slate-200">
                <div className="text-[11px] text-slate-400 font-medium">Risk Score</div>
                <div className="text-2xl font-black text-slate-900">{result.riskScore}/100</div>
                <div className="text-[10px] text-slate-500">Confidence: {result.confidence}%</div>
              </div>
            </div>

            {/* Crucial Context Disclaimer Banner */}
            <div className="p-3 bg-blue-50 border-b border-blue-100 flex items-start gap-2.5 text-xs text-blue-800">
              <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <span>
                <strong>Defensive Security Principle:</strong> Missing SPF, DKIM, or DMARC records indicate an unprotected domain that is vulnerable to unauthorized sender spoofing. However, missing records alone do <em>not</em> automatically prove an email is malicious.
              </span>
            </div>

            {/* 3-Card Authentication Grid (SPF, DKIM, DMARC) */}
            <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* SPF Card */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                    <Shield className="w-4 h-4 text-[#10B981]" /> SPF Authentication
                  </span>
                  {getStatusBadge(result.spf.status)}
                </div>
                <p className="text-xs text-slate-600">{result.spf.details}</p>
                {result.spf.record && (
                  <div className="p-2 bg-white rounded border border-slate-200 text-[10px] font-mono text-slate-700 break-all">
                    {result.spf.record}
                  </div>
                )}
              </div>

              {/* DKIM Card */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                    <Shield className="w-4 h-4 text-blue-500" /> DKIM Cryptography
                  </span>
                  {getStatusBadge(result.dkim.status)}
                </div>
                <p className="text-xs text-slate-600">{result.dkim.details}</p>
                {result.dkim.record && (
                  <div className="p-2 bg-white rounded border border-slate-200 text-[10px] font-mono text-slate-700 break-all">
                    {result.dkim.record}
                  </div>
                )}
              </div>

              {/* DMARC Card */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                    <Shield className="w-4 h-4 text-purple-500" /> DMARC Policy
                  </span>
                  {getStatusBadge(result.dmarc.status)}
                </div>
                <p className="text-xs text-slate-600">{result.dmarc.details}</p>
                {result.dmarc.record && (
                  <div className="p-2 bg-white rounded border border-slate-200 text-[10px] font-mono text-slate-700 break-all">
                    {result.dmarc.record}
                  </div>
                )}
              </div>
            </div>

            {/* Header Mismatches Section (if headers analyzed) */}
            {result.headers && (
              <div className="px-5 pb-5 space-y-3">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Header Integrity Analysis
                </h3>
                {result.headers.mismatches.length > 0 ? (
                  <div className="space-y-2">
                    {result.headers.mismatches.map((m, idx) => (
                      <div
                        key={idx}
                        className={`p-3 rounded-xl border text-xs flex items-start gap-2 ${
                          m.severity === "HIGH"
                            ? "bg-red-50 border-red-200 text-red-800"
                            : "bg-amber-50 border-amber-200 text-amber-800"
                        }`}
                      >
                        <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                        <div>
                          <strong>{m.type}: </strong> {m.description}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Headers examined: No sender identity mismatches or Reply-To redirection detected.</span>
                  </div>
                )}
              </div>
            )}

            {/* Domain & Sender Indicators */}
            <div className="p-5 border-t border-[#E5E7EB] grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="space-y-2">
                <h4 className="font-bold text-slate-800">Domain & Mail Infrastructure</h4>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Domain:</span>
                    <span className="font-mono font-medium text-slate-900">{result.domainInfo.domain}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Mail Exchanger (MX):</span>
                    <span className={result.domainInfo.hasMx ? "text-emerald-600 font-semibold" : "text-amber-600 font-semibold"}>
                      {result.domainInfo.hasMx ? "Configured" : "Missing MX"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Provider Type:</span>
                    <span className="font-medium text-slate-800">
                      {result.domainInfo.isFreeProvider ? "Free Public Webmail" : result.domainInfo.isDisposable ? "Temporary / Disposable" : "Custom Domain"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Punycode / Homograph:</span>
                    <span className={result.domainInfo.isPunycode ? "text-red-600 font-semibold" : "text-slate-700"}>
                      {result.domainInfo.isPunycode ? "Detected" : "Clean"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-slate-800">Threat Findings & Warnings</h4>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                  {result.warnings.length > 0 ? (
                    result.warnings.map((w, i) => (
                      <div key={i} className="flex items-start gap-1.5 text-amber-800">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                        <span>{w}</span>
                      </div>
                    ))
                  ) : (
                    <div className="flex items-center gap-1.5 text-emerald-700">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>No suspicious indicators detected for this sender address.</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
