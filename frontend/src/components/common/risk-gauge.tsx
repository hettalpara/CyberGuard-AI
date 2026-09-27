"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface RiskGaugeProps {
  score: number | null;
  level?: string;
  className?: string;
}

export function RiskGauge({ score, level, className }: RiskGaugeProps) {
  const isAvailable = score !== null && !isNaN(score);
  const clampedScore = isAvailable ? Math.min(100, Math.max(0, score)) : 0;

  // Determine dot border color based on score/level
  const dotBorderColor =
    clampedScore < 20 ? "#13b879" :
    clampedScore < 40 ? "#eab308" :
    clampedScore < 60 ? "#f59e0b" :
    clampedScore < 80 ? "#ef4444" : "#8b1e2d";

  return (
    <div className={cn("w-full select-none", className)}>
      <div className="riskbar-cg">
        {isAvailable && (
          <div 
            className="riskdot-cg"
            style={{ 
              left: `${clampedScore}%`,
              borderColor: dotBorderColor,
              boxShadow: `0 0 0 4px ${dotBorderColor}20`
            }}
            title={`Risk Score: ${clampedScore}/100`}
          />
        )}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "9px", color: "var(--muted)", marginTop: "9px", fontFamily: "monospace" }}>
        <span>0 SAFE</span>
        <span>20 LOW</span>
        <span>40 MODERATE</span>
        <span>60 HIGH</span>
        <span>80 CRITICAL</span>
        <span>100</span>
      </div>
    </div>
  );
}
