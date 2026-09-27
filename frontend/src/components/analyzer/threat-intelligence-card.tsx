"use client";

import React from "react";
import { ShieldCheck, ShieldAlert, Cpu, AlertTriangle, CheckCircle2, XCircle, AlertCircle, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface ThreatIntelligenceProps {
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
  virusTotal: {
    status?: string;
    enginesFlagged: number;
    totalEngines: number;
    detectionRatio: string;
    maliciousCount: number;
    suspiciousCount: number;
    undetectedCount: number;
    error?: string;
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
}

export function ThreatIntelligenceCard({
  safeBrowsing,
  virusTotal,
  urlhaus,
}: ThreatIntelligenceProps) {
  // Count active/evaluated providers
  const providersCount = 3;
  const availableCount = [
    safeBrowsing.available && safeBrowsing.status !== "UNAVAILABLE" && safeBrowsing.status !== "ERROR",
    virusTotal.status !== "UNAVAILABLE" && virusTotal.status !== "ERROR",
    urlhaus.available && urlhaus.status !== "UNAVAILABLE" && urlhaus.status !== "ERROR",
  ].filter(Boolean).length;

  const threatsFlagged = [
    safeBrowsing.match,
    virusTotal.enginesFlagged > 0,
    urlhaus.match,
  ].filter(Boolean).length;

  return (
    <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] shadow-sm overflow-hidden">
      <CardHeader className="py-3.5 px-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <CardTitle className="text-xs font-bold font-mono uppercase tracking-wider text-slate-800 dark:text-slate-200">
              Threat Intelligence
            </CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
              Provider Results: {availableCount} of {providersCount} sources evaluated
            </span>
            {threatsFlagged > 0 ? (
              <span className="text-[10px] font-mono font-bold text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-950/60 px-2 py-0.5 rounded border border-red-300 dark:border-red-800">
                {threatsFlagged} flagged threat
              </span>
            ) : availableCount > 0 ? (
              <span className="text-[10px] font-mono font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-300 dark:border-emerald-800">
                No external hits
              </span>
            ) : null}
          </div>
        </div>
        <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
          Independent cross-verification from authoritative external threat intelligence databases.
        </CardDescription>
      </CardHeader>

      <CardContent className="p-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* 1. Google Safe Browsing */}
          <div className={cn(
            "p-4 rounded-xl border flex flex-col justify-between transition-colors",
            !safeBrowsing.available || safeBrowsing.status === "UNAVAILABLE" || safeBrowsing.status === "ERROR"
              ? "bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800"
              : safeBrowsing.match
              ? "bg-red-50/50 dark:bg-red-950/20 border-red-200 dark:border-red-900"
              : "bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800"
          )}>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold font-mono text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-slate-500" />
                  Google Safe Browsing
                </span>
                {/* Status Badge */}
                {!safeBrowsing.available || safeBrowsing.status === "UNAVAILABLE" ? (
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700">
                    UNAVAILABLE
                  </span>
                ) : safeBrowsing.status === "ERROR" ? (
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-100 text-amber-800 border border-amber-200 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-800">
                    ERROR
                  </span>
                ) : safeBrowsing.match ? (
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-red-100 text-red-700 border border-red-300 dark:bg-red-950 dark:text-red-400 dark:border-red-800">
                    THREAT DETECTED
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800">
                    CLEAN
                  </span>
                )}
              </div>

              {/* Status explanation */}
              <div className="space-y-1 mt-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200">
                  {safeBrowsing.match ? (
                    <>
                      <XCircle className="w-4 h-4 text-red-600 shrink-0" />
                      <span>{safeBrowsing.threatType || "Malicious URL matched"}</span>
                    </>
                  ) : !safeBrowsing.available || safeBrowsing.status === "UNAVAILABLE" ? (
                    <>
                      <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                      <span>Service Unavailable</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>No threat detected</span>
                    </>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-mono">
                  {safeBrowsing.error
                    ? safeBrowsing.error
                    : safeBrowsing.match
                    ? `Lists: ${safeBrowsing.threatTypes?.join(", ") || safeBrowsing.threatType || "Phishing/Malware"}`
                    : "No matches found on Google Safe Browsing threat lists"}
                </p>
              </div>
            </div>
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 mt-3 text-[10px] font-mono text-slate-400">
              API Status: {safeBrowsing.status || (safeBrowsing.available ? "CHECKED" : "UNAVAILABLE")}
            </div>
          </div>

          {/* 2. VirusTotal */}
          <div className={cn(
            "p-4 rounded-xl border flex flex-col justify-between transition-colors",
            virusTotal.status === "UNAVAILABLE" || virusTotal.status === "ERROR"
              ? "bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800"
              : virusTotal.enginesFlagged > 0
              ? "bg-red-50/50 dark:bg-red-950/20 border-red-200 dark:border-red-900"
              : "bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800"
          )}>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold font-mono text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-slate-500" />
                  VirusTotal Consensus
                </span>
                {virusTotal.status === "UNAVAILABLE" ? (
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700">
                    UNAVAILABLE
                  </span>
                ) : virusTotal.status === "ERROR" ? (
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-100 text-amber-800 border border-amber-200 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-800">
                    ERROR
                  </span>
                ) : virusTotal.enginesFlagged > 0 ? (
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-red-100 text-red-700 border border-red-300 dark:bg-red-950 dark:text-red-400 dark:border-red-800">
                    {virusTotal.enginesFlagged} ENGINES
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800">
                    0 DETECTIONS
                  </span>
                )}
              </div>

              {/* Status explanation */}
              <div className="space-y-1 mt-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200">
                  {virusTotal.status === "UNAVAILABLE" || virusTotal.status === "ERROR" ? (
                    <>
                      <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                      <span>{virusTotal.status === "ERROR" ? "Lookup Error" : "Service Unavailable"}</span>
                    </>
                  ) : virusTotal.enginesFlagged > 0 ? (
                    <>
                      <XCircle className="w-4 h-4 text-red-600 shrink-0" />
                      <span>Flagged by {virusTotal.enginesFlagged} antivirus engines</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>No engine detections</span>
                    </>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-mono">
                  {virusTotal.error
                    ? virusTotal.error
                    : `Ratio: ${virusTotal.detectionRatio || `${virusTotal.enginesFlagged}/${virusTotal.totalEngines || 70}`} (Malicious: ${virusTotal.maliciousCount}, Suspicious: ${virusTotal.suspiciousCount})`}
                </p>
              </div>
            </div>
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 mt-3 text-[10px] font-mono text-slate-400">
              Engines Evaluated: {virusTotal.totalEngines || 70}
            </div>
          </div>

          {/* 3. URLhaus */}
          <div className={cn(
            "p-4 rounded-xl border flex flex-col justify-between transition-colors",
            !urlhaus.available || urlhaus.status === "UNAVAILABLE" || urlhaus.status === "ERROR"
              ? "bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800"
              : urlhaus.match
              ? "bg-red-50/50 dark:bg-red-950/20 border-red-200 dark:border-red-900"
              : "bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800"
          )}>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold font-mono text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-slate-500" />
                  URLhaus Malware
                </span>
                {!urlhaus.available || urlhaus.status === "UNAVAILABLE" ? (
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700">
                    UNAVAILABLE
                  </span>
                ) : urlhaus.status === "ERROR" ? (
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-100 text-amber-800 border border-amber-200 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-800">
                    ERROR
                  </span>
                ) : urlhaus.match ? (
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-red-100 text-red-700 border border-red-300 dark:bg-red-950 dark:text-red-400 dark:border-red-800">
                    MALWARE LISTED
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800">
                    CLEAN
                  </span>
                )}
              </div>

              {/* Status explanation */}
              <div className="space-y-1 mt-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200">
                  {urlhaus.match ? (
                    <>
                      <XCircle className="w-4 h-4 text-red-600 shrink-0" />
                      <span>{urlhaus.threatType || "Active malware distribution site"}</span>
                    </>
                  ) : !urlhaus.available || urlhaus.status === "UNAVAILABLE" ? (
                    <>
                      <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                      <span>Service Unavailable</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>URL not listed in malware database</span>
                    </>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-mono">
                  {urlhaus.error
                    ? urlhaus.error
                    : urlhaus.match
                    ? `Tags: ${urlhaus.tags?.join(", ") || "malware, payload"}`
                    : "No known active malware payload distribution records"}
                </p>
              </div>
            </div>
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 mt-3 text-[10px] font-mono text-slate-400">
              Database: abuse.ch URLhaus
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
