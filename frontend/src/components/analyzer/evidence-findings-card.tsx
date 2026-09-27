"use client";

import React, { useState } from "react";
import { ShieldAlert, AlertTriangle, ChevronDown, ChevronUp, FileCode, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { SecurityFindingData } from "@/services/analyzer.service";

interface EvidenceFindingsProps {
  findings?: SecurityFindingData[];
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

export function EvidenceFindingsCard({ findings }: EvidenceFindingsProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  if (!findings || findings.length === 0) {
    return null;
  }

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "CRITICAL":
        return "bg-red-950/20 text-red-700 border-red-300 dark:bg-red-950/50 dark:text-red-400 dark:border-red-900";
      case "HIGH":
        return "bg-red-50 text-red-600 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800";
      case "MODERATE":
      case "MEDIUM":
        return "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/30 dark:text-orange-400 dark:border-orange-800";
      case "LOW":
        return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800";
      default:
        return "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800";
    }
  };

  return (
    <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] shadow-sm overflow-hidden">
      <CardHeader className="py-3.5 px-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <CardTitle className="text-xs font-bold font-mono uppercase tracking-wider text-slate-800 dark:text-slate-200">
              Security Findings & Discovered Evidence
            </CardTitle>
          </div>
          <span className="text-[11px] font-mono text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
            {findings.length} findings evaluated
          </span>
        </div>
        <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
          Individual indicators synthesized from multi-engine threat queries and lexical analysis.
        </CardDescription>
      </CardHeader>

      <CardContent className="p-5">
        <div className="space-y-3">
          {findings.map((item, idx) => {
            const isExpanded = expandedIndex === idx;
            const evidenceStr = item.evidence ? formatEvidence(item.evidence) : "";

            return (
              <div
                key={idx}
                className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-mono font-bold text-slate-900 dark:text-slate-100">
                        {item.source}
                      </span>
                      <span className="text-slate-300 dark:text-slate-700">•</span>
                      <span className="text-[11px] font-mono font-semibold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                        {item.finding}
                      </span>
                      {item.isConfirmedThreat && (
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-950/60 border border-red-300 dark:border-red-800 px-1.5 py-0.5 rounded">
                          Confirmed Threat
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-mono mt-1">
                      {item.explanation}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-start">
                    <span
                      className={cn(
                        "px-2 py-0.5 text-[10px] font-mono font-bold rounded border uppercase tracking-wider",
                        getSeverityBadge(item.severity)
                      )}
                    >
                      {item.severity}
                    </span>
                    {evidenceStr && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setExpandedIndex(isExpanded ? null : idx)}
                        className="h-6 w-6 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100"
                        title={isExpanded ? "Hide technical evidence" : "Show technical evidence"}
                      >
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </Button>
                    )}
                  </div>
                </div>

                {/* Expandable Technical Evidence */}
                {isExpanded && evidenceStr && (
                  <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800 text-[11px] font-mono text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-950 p-2.5 rounded-lg border">
                    <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                      <FileCode className="w-3.5 h-3.5" />
                      <span className="text-[10px] uppercase font-bold">Technical Evidence:</span>
                    </div>
                    <p className="break-all">{evidenceStr}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
