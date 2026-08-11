"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface RiskMeterProps {
  score: number;
  threatLevel?: "SAFE" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  size?: "sm" | "md" | "lg";
}

export function RiskMeter({ score, threatLevel = "SAFE", size = "md" }: RiskMeterProps) {
  const getBadgeStyle = () => {
    if (score >= 80 || threatLevel === "CRITICAL") return "bg-red-100 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900";
    if (score >= 50 || threatLevel === "HIGH") return "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900";
    if (score >= 20 || threatLevel === "MEDIUM" || threatLevel === "LOW") return "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-950/40 dark:text-yellow-400 dark:border-yellow-900";
    return "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900";
  };

  const getBarColor = () => {
    if (score >= 80) return "bg-red-500";
    if (score >= 50) return "bg-amber-500";
    if (score >= 20) return "bg-yellow-500";
    return "bg-emerald-500";
  };

  const dimensions = size === "sm" ? "h-2 w-24" : size === "lg" ? "h-4 w-48" : "h-3 w-36";

  return (
    <div className="flex items-center gap-3">
      <div className={cn("w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700", dimensions)}>
        <div
          className={cn("h-full transition-all duration-500 rounded-full", getBarColor())}
          style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
        />
      </div>
      <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-md border", getBadgeStyle())}>
        {score}/100 Risk
      </span>
    </div>
  );
}

