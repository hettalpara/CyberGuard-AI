"use client";

import React from "react";
import { Globe, AlertCircle, CheckCircle2, ShieldAlert, AlertTriangle, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface IndicatorItem {
  name?: string;
  finding?: string;
  reason?: string;
  explanation?: string;
  severity?: "CRITICAL" | "HIGH" | "MODERATE" | "MEDIUM" | "LOW" | "INFO" | string;
  score?: number;
  evidence?: unknown;
}

interface UrlStructureProps {
  intelligence?: {
    available: boolean;
    score: number | null;
    riskLevel: string;
    status: string;
    indicators: IndicatorItem[] | string[];
    explanation?: string;
    reasons?: string[];
  };
  findings?: Array<{
    source: string;
    finding: string;
    severity: string;
    explanation: string;
  }>;
}

export function UrlStructureCard({ intelligence, findings }: UrlStructureProps) {
  const isAvailable = intelligence && intelligence.available !== false && intelligence.status !== "UNAVAILABLE" && intelligence.status !== "ERROR";

  // Filter local URL findings from general findings if needed
  const localFindings = (findings || []).filter(
    (f) => f.source?.toLowerCase().includes("local") || f.source?.toLowerCase().includes("url")
  );

  const getSeverityBadgeClass = (severity?: string) => {
    const s = String(severity || "INFO").toUpperCase();
    switch (s) {
      case "CRITICAL":
      case "HIGH":
        return "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-800";
      case "MODERATE":
      case "MEDIUM":
        return "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-400 dark:border-orange-800";
      case "LOW":
        return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800";
      default:
        return "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800";
    }
  };

  return (
    <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] shadow-sm overflow-hidden">
      <CardHeader className="py-3.5 px-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <CardTitle className="text-xs font-bold font-mono uppercase tracking-wider text-slate-800 dark:text-slate-200">
              URL Structure Analysis
            </CardTitle>
          </div>
          {isAvailable && (
            <span className="text-[11px] font-mono text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
              Local Heuristics Score: {intelligence.score !== null ? `${intelligence.score}/100` : "0/100"} ({intelligence.riskLevel || "SAFE"})
            </span>
          )}
        </div>
        <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
          Inspection of lexical patterns, Punycode hostnames, subdomain depth, and suspicious URL parameters.
        </CardDescription>
      </CardHeader>

      <CardContent className="p-5">
        {!isAvailable ? (
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 text-xs text-slate-500 font-mono flex items-center gap-2">
            <Info className="w-4 h-4 text-slate-400" />
            <span>Local URL intelligence analysis is unavailable for this request.</span>
          </div>
        ) : intelligence.indicators && intelligence.indicators.length > 0 ? (
          <div className="space-y-3">
            {intelligence.indicators.map((indicator, idx) => {
              const name = typeof indicator === "string" ? indicator : indicator.name || indicator.finding || "URL Indicator";
              const reason = typeof indicator === "string" ? "Flagged during URL structure inspection." : indicator.reason || indicator.explanation || "";
              const severity = typeof indicator === "string" ? "MEDIUM" : indicator.severity || "INFO";

              return (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 flex flex-col sm:flex-row sm:items-start justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span className="text-xs font-mono font-bold text-slate-900 dark:text-slate-100">
                        {name}
                      </span>
                    </div>
                    {reason && (
                      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-mono">
                        {reason}
                      </p>
                    )}
                  </div>
                  <span className={cn(
                    "text-[10px] font-mono font-bold px-2 py-0.5 rounded border uppercase tracking-wider shrink-0 self-start",
                    getSeverityBadgeClass(severity)
                  )}>
                    {severity}
                  </span>
                </div>
              );
            })}
          </div>
        ) : localFindings.length > 0 ? (
          <div className="space-y-3">
            {localFindings.map((f, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 flex flex-col sm:flex-row sm:items-start justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span className="text-xs font-mono font-bold text-slate-900 dark:text-slate-100">
                      {f.finding}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-mono">
                    {f.explanation}
                  </p>
                </div>
                <span className={cn(
                  "text-[10px] font-mono font-bold px-2 py-0.5 rounded border uppercase tracking-wider shrink-0 self-start",
                  getSeverityBadgeClass(f.severity)
                )}>
                  {f.severity}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/60 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <div className="font-mono">
              <span className="font-bold block">No Suspicious URL Structure Patterns Detected</span>
              <span className="text-[11px] text-emerald-700 dark:text-emerald-400">
                Punycode, excessive subdomain nesting, and suspicious keyword masquerading checks returned clean.
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
