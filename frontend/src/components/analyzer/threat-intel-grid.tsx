import React from "react";
import { ShieldAlert, Cpu, AlertTriangle, Globe, Lock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export interface ThreatAnalysisData {
  safeBrowsing: {
    available: boolean;
    match: boolean;
    threatType?: string;
    status: string;
    error?: string;
  };
  virusTotal: {
    status?: string;
    enginesFlagged: number;
    detectionRatio: string;
    maliciousCount: number;
    suspiciousCount: number;
    error?: string;
  };
  urlhaus: {
    available: boolean;
    match: boolean;
    threatType?: string;
    status: string;
    error?: string;
  };
  urlIntelligence?: {
    available: boolean;
    score: number | null;
    riskLevel: string;
    status: string;
    indicators: any[];
  };
  sslAnalysis?: {
    available: boolean;
    score: number | null;
    protocol: string;
    certificateStatus: string;
    issuer?: string;
    validDaysRemaining?: number;
    explanation?: string;
    error?: string;
  };
}

interface ThreatIntelGridProps {
  analysis: ThreatAnalysisData;
}

export function ThreatIntelGrid({ analysis }: ThreatIntelGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {/* Safe Browsing Card */}
      <Card className="border-[#E5E7EB] bg-white shadow-sm">
        <CardContent className="p-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Google Safe Browsing</span>
            <ShieldAlert className={`w-4 h-4 ${
              !analysis.safeBrowsing.available 
                ? "text-slate-400" 
                : analysis.safeBrowsing.match 
                ? "text-red-600" 
                : "text-emerald-600"
            }`} />
          </div>
          <div className="text-base font-bold text-[#1F2937]">
            {!analysis.safeBrowsing.available
              ? "Unavailable"
              : analysis.safeBrowsing.match
              ? "Threat Detected"
              : "Checked Clean"}
          </div>
          <p className="text-[11px] text-slate-500 truncate">
            {!analysis.safeBrowsing.available
              ? (analysis.safeBrowsing.error || "Service unavailable")
              : (analysis.safeBrowsing.threatType || "No threat lists matched")}
          </p>
        </CardContent>
      </Card>

      {/* VirusTotal Card */}
      <Card className="border-[#E5E7EB] bg-white shadow-sm">
        <CardContent className="p-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">VirusTotal Detection</span>
            <Cpu className={`w-4 h-4 ${
              analysis.virusTotal.status === "UNAVAILABLE" || analysis.virusTotal.status === "ERROR"
                ? "text-slate-400"
                : analysis.virusTotal.enginesFlagged > 0
                ? "text-red-600"
                : "text-emerald-600"
            }`} />
          </div>
          <div className="text-base font-bold text-[#1F2937]">
            {analysis.virusTotal.status === "UNAVAILABLE" || analysis.virusTotal.status === "ERROR"
              ? "Unavailable"
              : `${analysis.virusTotal.detectionRatio} Engines`}
          </div>
          <p className="text-[11px] text-slate-500 truncate">
            {analysis.virusTotal.status === "UNAVAILABLE" || analysis.virusTotal.status === "ERROR"
              ? (analysis.virusTotal.error || "Service unavailable")
              : `Malicious: ${analysis.virusTotal.maliciousCount} • Suspicious: ${analysis.virusTotal.suspiciousCount}`}
          </p>
        </CardContent>
      </Card>

      {/* URLhaus Malware Card */}
      <Card className="border-[#E5E7EB] bg-white shadow-sm">
        <CardContent className="p-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">URLhaus Malware</span>
            <AlertTriangle className={`w-4 h-4 ${
              !analysis.urlhaus.available
                ? "text-slate-400"
                : analysis.urlhaus.match
                ? "text-red-600"
                : "text-emerald-600"
            }`} />
          </div>
          <div className="text-base font-bold text-[#1F2937]">
            {!analysis.urlhaus.available
              ? "Unavailable"
              : analysis.urlhaus.match
              ? "Malware Detected"
              : "Checked Clean"}
          </div>
          <p className="text-[11px] text-slate-500 truncate">
            {!analysis.urlhaus.available
              ? (analysis.urlhaus.error || "Service unavailable")
              : analysis.urlhaus.match
              ? (analysis.urlhaus.threatType || "Malware distribution URL")
              : "No malware records found"}
          </p>
        </CardContent>
      </Card>

      {/* Local URL Intelligence Card */}
      <Card className="border-[#E5E7EB] bg-white shadow-sm">
        <CardContent className="p-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">URL Intelligence</span>
            <Globe className={`w-4 h-4 ${
              !analysis.urlIntelligence || !analysis.urlIntelligence.available
                ? "text-slate-400"
                : (analysis.urlIntelligence.score ?? 0) >= 50
                ? "text-red-600"
                : (analysis.urlIntelligence.score ?? 0) >= 20
                ? "text-amber-500"
                : "text-emerald-600"
            }`} />
          </div>
          <div className="text-base font-bold text-[#1F2937]">
            {!analysis.urlIntelligence || !analysis.urlIntelligence.available
              ? "Unavailable"
              : `${analysis.urlIntelligence.score ?? 0}/100 (${analysis.urlIntelligence.riskLevel})`}
          </div>
          <p className="text-[11px] text-slate-500 truncate">
            {!analysis.urlIntelligence || !analysis.urlIntelligence.available
              ? "Local analysis unavailable"
              : analysis.urlIntelligence.indicators && analysis.urlIntelligence.indicators.length > 0
              ? `Flags: ${analysis.urlIntelligence.indicators.map((ind: any) => typeof ind === "string" ? ind : ind.name || ind.reason || "Suspicious Flag").join(", ")}`
              : "Clean URL heuristics"}
          </p>
        </CardContent>
      </Card>

      {/* SSL/TLS Analysis Card */}
      <Card className="border-[#E5E7EB] bg-white shadow-sm">
        <CardContent className="p-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">SSL/TLS Security</span>
            <Lock className={`w-4 h-4 ${
              !analysis.sslAnalysis || !analysis.sslAnalysis.available
                ? "text-slate-400"
                : (analysis.sslAnalysis.score ?? 0) >= 50
                ? "text-red-600"
                : (analysis.sslAnalysis.score ?? 0) >= 20
                ? "text-amber-500"
                : "text-emerald-600"
            }`} />
          </div>
          <div className="text-base font-bold text-[#1F2937]">
            {!analysis.sslAnalysis || !analysis.sslAnalysis.available
              ? "Unavailable"
              : analysis.sslAnalysis.protocol === "HTTP"
              ? "Plain HTTP (40/100)"
              : analysis.sslAnalysis.certificateStatus === "VALID"
              ? "Valid HTTPS (0/100)"
              : `${analysis.sslAnalysis.certificateStatus} (${analysis.sslAnalysis.score ?? 0}/100)`}
          </div>
          <p className="text-[11px] text-slate-500 truncate">
            {!analysis.sslAnalysis || !analysis.sslAnalysis.available
              ? (analysis.sslAnalysis?.error || "Connection unavailable")
              : analysis.sslAnalysis.issuer
              ? `${analysis.sslAnalysis.issuer}${analysis.sslAnalysis.validDaysRemaining !== undefined ? ` • ${analysis.sslAnalysis.validDaysRemaining}d left` : ""}`
              : analysis.sslAnalysis.explanation || "Analyzed"}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
