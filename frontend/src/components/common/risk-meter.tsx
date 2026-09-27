"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { RiskBadge, normalizeRiskLevel } from "./risk-badge";

interface RiskMeterProps {
  score: number | null;
  threatLevel?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
  showBadge?: boolean;
}

export function RiskMeter({
  score,
  threatLevel = "SAFE",
  size = "md",
  className,
  showBadge = true,
}: RiskMeterProps) {
  const normLevel = normalizeRiskLevel(threatLevel);

  const getBarColor = () => {
    if (score === null || normLevel === "INCONCLUSIVE") return "bg-slate-400";
    if (score >= 80 || normLevel === "CRITICAL") return "bg-red-700";
    if (score >= 60 || normLevel === "HIGH") return "bg-red-500";
    if (score >= 40 || normLevel === "MODERATE") return "bg-orange-500";
    if (score >= 20 || normLevel === "LOW") return "bg-amber-400";
    return "bg-emerald-500";
  };

  const dimensions =
    size === "sm"
      ? "h-1.5 w-20"
      : size === "lg"
      ? "h-3 w-40"
      : "h-2 w-28";

  const clampedScore = score !== null ? Math.min(100, Math.max(0, score)) : 0;

  return (
    <div className={cn("inline-flex items-center gap-2.5", className)}>
      <div
        className={cn(
          "bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden shrink-0",
          dimensions
        )}
      >
        <div
          className={cn("h-full transition-all duration-500 rounded-full", getBarColor())}
          style={{ width: `${score !== null ? clampedScore : 0}%` }}
        />
      </div>

      {showBadge && (
        <RiskBadge level={normLevel} size={size === "lg" ? "md" : "sm"} />
      )}

      {score !== null ? (
        <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
          {score}
          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-normal">/100</span>
        </span>
      ) : (
        <span className="text-[11px] font-mono text-slate-600 dark:text-slate-400">N/A</span>
      )}
    </div>
  );
}
