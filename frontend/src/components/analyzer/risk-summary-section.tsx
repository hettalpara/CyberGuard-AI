"use client";

import React from "react";
import { Shield, ShieldAlert, Cpu, Lock, Globe, Info, Zap, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RiskBadge, normalizeRiskLevel, getRiskLevelStyles } from "@/components/common/risk-badge";
import { RiskGauge } from "@/components/common/risk-gauge";
import type { RiskFactorData } from "@/services/analyzer.service";

interface RiskSummarySectionProps {
  riskScore: number | null;
  riskLevel: string;
  confidence: number;
  calculationMethod?: string;
  overrideTriggered?: boolean;
  overrideReason?: string | null;
  overrideType?: string | null;
  analysisStatus?: string;
  riskFactors?: RiskFactorData[];
}

export function RiskSummarySection({
  riskScore,
  riskLevel,
  confidence,
  calculationMethod,
  overrideTriggered,
  overrideReason,
  analysisStatus,
}: RiskSummarySectionProps) {
  const normLevel = normalizeRiskLevel(riskLevel);
  const styles = getRiskLevelStyles(normLevel);
  const isScoreAvailable = riskScore !== null && !isNaN(riskScore);

  return (
    <div className="space-y-4">
      {/* Short-Circuit Override Alert Banner if triggered */}
      {overrideTriggered && (
        <div className="p-4 bg-red-50/90 dark:bg-red-950/40 border border-red-300 dark:border-red-900 rounded-xl flex flex-col sm:flex-row items-start gap-3.5">
          <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/60 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0 mt-0.5">
            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
          </div>
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900/50 px-2 py-0.5 rounded border border-red-300 dark:border-red-800">
                Critical Override Triggered
              </span>
              <span className="text-xs text-slate-600 dark:text-slate-400">
                Method: <strong className="text-red-700 dark:text-red-400 font-mono">SHORT_CIRCUIT_OVERRIDE</strong>
              </span>
            </div>
            <p className="text-xs font-bold text-red-950 dark:text-red-200">
              {overrideReason || "Immediate high-severity threat detection bypassed weighted formula."}
            </p>
            <p className="text-[11px] text-red-800 dark:text-red-300/90 leading-relaxed">
              To prevent high-confidence malware or phishing signals from being diluted by clean scores from other providers, the engine automatically elevated the risk evaluation.
            </p>
          </div>
        </div>
      )}

      {/* Main Focus: 3 Summary Cards + Risk Gauge */}
      <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] shadow-sm overflow-hidden">
        <CardHeader className="py-3.5 px-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <CardTitle className="text-xs font-bold font-mono uppercase tracking-wider text-slate-800 dark:text-slate-200">
                Risk Assessment Summary
              </CardTitle>
            </div>
            <span className="text-[11px] font-mono text-slate-600 dark:text-slate-400">
              Method: {overrideTriggered ? "Short-Circuit Override" : calculationMethod || "Multi-Vector Weighted"}
            </span>
          </div>
        </CardHeader>

        <CardContent className="p-5 space-y-6">
          {/* 3 Main Metric Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 1. RISK SCORE */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
              <div>
                <p className="text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold mb-1">
                  Risk Score
                </p>
                <div className="flex items-baseline gap-2">
                  <span className={`text-4xl font-mono font-black tracking-tight ${styles.text}`}>
                    {isScoreAvailable ? riskScore : "—"}
                  </span>
                  <span className="text-xs font-mono text-slate-600 dark:text-slate-400">
                    out of 100
                  </span>
                </div>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 font-mono">
                {isScoreAvailable
                  ? overrideTriggered
                    ? "Bypassed weighted averaging"
                    : "Deterministic multi-factor score"
                  : analysisStatus === "INSUFFICIENT_DATA"
                  ? "Insufficient data to calculate score"
                  : "Score pending or inconclusive"}
              </p>
            </div>

            {/* 2. RISK LEVEL */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
              <div>
                <p className="text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold mb-2">
                  Risk Level
                </p>
                <div>
                  <RiskBadge level={normLevel} size="lg" />
                </div>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 font-mono">
                Standard classification: {styles.range}
              </p>
            </div>

            {/* 3. CONFIDENCE */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
              <div>
                <p className="text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold mb-1">
                  Confidence
                </p>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-mono font-black tracking-tight text-slate-900 dark:text-slate-100">
                    {confidence}
                  </span>
                  <span className="text-lg font-mono font-bold text-slate-500">%</span>
                </div>
              </div>
              {/* Progress bar */}
              <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden mt-2">
                <div
                  className="h-full rounded-full transition-all duration-500 bg-emerald-500"
                  style={{ width: `${Math.min(100, Math.max(0, confidence))}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
                Confidence reflects the consistency and availability of security evidence used during this analysis.
              </p>
            </div>
          </div>

          {/* Horizontal Risk Gauge */}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
            <div className="mb-2 flex items-center justify-between text-xs">
              <span className="font-mono text-slate-600 dark:text-slate-400 font-medium">
                Risk Classification Spectrum
              </span>
              <span className="font-mono text-[11px] text-slate-500">
                Authoritative Backend Scale
              </span>
            </div>
            <RiskGauge score={riskScore} level={normLevel} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
