"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Bot, Sparkles, AlertCircle, CheckCircle2, ShieldAlert, ArrowRight, Info, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { AIAnalysisData } from "@/services/analyzer.service";

interface AiAssessmentProps {
  aiAnalysis?: AIAnalysisData;
  aiExplanation?: string;
  recommendedActions?: string[];
  scanId?: string;
  threatLevel: string;
  riskScore: number | null;
}

export function AiAssessmentCard({
  aiAnalysis,
  aiExplanation,
  recommendedActions = [],
  scanId,
  threatLevel,
  riskScore,
}: AiAssessmentProps) {
  const router = useRouter();
  const isAiAvailable = aiAnalysis?.available && !aiAnalysis?.error;

  return (
    <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] shadow-sm overflow-hidden">
      {/* Card Header */}
      <CardHeader className="py-3.5 px-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Bot className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <div>
              <CardTitle className="text-xs font-bold font-mono uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2">
                AI Security Assessment
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800">
                  Gemini
                </span>
              </CardTitle>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {scanId && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push(`/assistant?scanId=${scanId}`)}
                className="h-7 text-xs font-mono border-emerald-500/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg gap-1.5"
              >
                <Bot className="w-3.5 h-3.5" />
                Ask Assistant
              </Button>
            )}
            <span
              className={cn(
                "px-2 py-0.5 rounded text-[10px] font-mono font-bold border uppercase tracking-wider",
                isAiAvailable
                  ? "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-400"
                  : "bg-slate-100 text-slate-600 border-slate-300 dark:bg-slate-800 dark:text-slate-400"
              )}
            >
              {isAiAvailable ? "AI Active" : "AI Unavailable"}
            </span>
          </div>
        </div>
        <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
          Natural language threat explanation and incident response recommendations.
        </CardDescription>
      </CardHeader>

      <CardContent className="p-5 space-y-4">
        {/* If AI is unavailable */}
        {!isAiAvailable ? (
          <div className="p-4 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-300 flex items-start gap-2.5 font-mono">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">AI analysis temporarily unavailable.</p>
              <p className="text-[11px] text-amber-700 dark:text-amber-400 mt-0.5">
                The URL security result is still available from the deterministic analysis above.
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Meta Tags: Threat Type & Severity */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="px-2.5 py-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-mono">
                <span className="text-slate-500 text-[11px]">Threat Type: </span>
                <span className="font-bold text-slate-900 dark:text-slate-100">
                  {aiAnalysis?.threatType || "Phishing / Deceptive URL"}
                </span>
              </div>
              <div className="px-2.5 py-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-mono">
                <span className="text-slate-500 text-[11px]">Descriptive Severity: </span>
                <span className="font-bold text-slate-900 dark:text-slate-100">
                  {aiAnalysis?.severity || threatLevel}
                </span>
              </div>
              <span className="text-[11px] font-mono text-slate-500">
                Deterministic: <strong className="text-slate-800 dark:text-slate-200">{riskScore !== null ? `${riskScore}/100` : "N/A"} ({threatLevel})</strong>
              </span>
            </div>

            {/* AI Summary & Explanation */}
            <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2 font-mono">
              {aiAnalysis?.summary && (
                <p className="text-xs font-bold text-slate-900 dark:text-slate-100 border-b border-slate-200 dark:border-slate-800 pb-2">
                  {aiAnalysis.summary}
                </p>
              )}
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-sans">
                {aiExplanation || aiAnalysis?.explanation || "Analysis generated based on multi-source threat intelligence."}
              </p>
            </div>

            {/* Key Indicators */}
            {aiAnalysis?.keyIndicators && aiAnalysis.keyIndicators.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  Key Security Indicators
                </h4>
                <div className="p-3 bg-emerald-50/30 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-800/40 rounded-xl space-y-1.5 font-mono text-xs">
                  {aiAnalysis.keyIndicators.map((indicator, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-slate-800 dark:text-slate-200">
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">✓</span>
                      <span>{indicator}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommended Defensive Actions */}
            {recommendedActions.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Recommended Defensive Actions
                </h4>
                <div className="space-y-1.5 font-mono text-xs">
                  {recommendedActions.map((action, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-lg flex items-start gap-2 text-slate-800 dark:text-slate-300"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                      <span>{action}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Confidence Note */}
            {aiAnalysis?.confidenceNote && (
              <div className="p-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-200 dark:border-slate-800 text-[11px] font-mono text-slate-600 dark:text-slate-400 flex items-center gap-2">
                <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>{aiAnalysis.confidenceNote}</span>
              </div>
            )}
          </>
        )}

        {/* Deterministic Disclaimer */}
        <div className="pt-2 border-t border-slate-200 dark:border-slate-800 text-[10px] font-mono text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
          <Info className="w-3 h-3 text-emerald-600 shrink-0" />
          <span>
            Gemini AI serves as an explanation and defensive recommendation layer. Deterministic security algorithms govern authoritative risk scores and provider agreement.
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
