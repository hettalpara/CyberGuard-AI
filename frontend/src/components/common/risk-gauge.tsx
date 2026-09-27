"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface RiskGaugeProps {
  score: number | null;
  level?: string;
  className?: string;
}

const SEGMENTS = [
  { name: "SAFE", min: 0, max: 19, color: "bg-emerald-500", text: "text-emerald-700 dark:text-emerald-400" },
  { name: "LOW", min: 20, max: 39, color: "bg-amber-400", text: "text-amber-700 dark:text-amber-400" },
  { name: "MODERATE", min: 40, max: 59, color: "bg-orange-500", text: "text-orange-700 dark:text-orange-400" },
  { name: "HIGH", min: 60, max: 79, color: "bg-red-500", text: "text-red-700 dark:text-red-400" },
  { name: "CRITICAL", min: 80, max: 100, color: "bg-red-700", text: "text-red-800 dark:text-red-300" },
];

export function RiskGauge({ score, className }: RiskGaugeProps) {
  const isAvailable = score !== null && !isNaN(score);
  const clampedScore = isAvailable ? Math.min(100, Math.max(0, score)) : 0;

  return (
    <div className={cn("w-full space-y-2 select-none", className)}>
      {/* Ticks header: 0, 20, 40, 60, 80, 100 */}
      <div className="flex justify-between items-center text-[10px] font-mono text-slate-500 dark:text-slate-400 font-semibold px-0.5">
        <span>0</span>
        <span>20</span>
        <span>40</span>
        <span>60</span>
        <span>80</span>
        <span>100</span>
      </div>

      {/* Main Track with 5 segments and current score marker */}
      <div className="relative">
        <div className="h-3 w-full rounded-md overflow-hidden flex bg-slate-200 dark:bg-slate-800 gap-[2px] p-[1px]">
          {SEGMENTS.map((seg) => {
            const isSegmentActive =
              isAvailable && clampedScore >= seg.min && (clampedScore <= seg.max || (seg.max === 100 && clampedScore === 100));
            return (
              <div
                key={seg.name}
                className={cn(
                  "flex-1 h-full transition-opacity duration-300",
                  seg.color,
                  isAvailable
                    ? isSegmentActive
                      ? "opacity-100 shadow-xs"
                      : "opacity-35"
                    : "opacity-25"
                )}
                title={`${seg.name}: ${seg.min}–${seg.max}`}
              />
            );
          })}
        </div>

        {/* Pointer indicator for exact score */}
        {isAvailable && (
          <div
            className="absolute -top-1.5 -bottom-1.5 w-1.5 bg-slate-900 dark:bg-white rounded-full shadow-md border border-white dark:border-slate-900 pointer-events-none transition-all duration-500"
            style={{
              left: `calc(${clampedScore}% - 3px)`,
            }}
          >
            <div className="absolute -top-5 left-1/2 -translate-x-1/2 px-1.5 py-0.5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-[10px] font-mono font-bold rounded shadow-xs whitespace-nowrap">
              {score}
            </div>
          </div>
        )}
      </div>

      {/* Segment Names below bar: SAFE, LOW, MODERATE, HIGH, CRITICAL */}
      <div className="grid grid-cols-5 text-center text-[10px] font-semibold tracking-wider pt-1">
        {SEGMENTS.map((seg) => {
          const isSegmentActive =
            isAvailable && clampedScore >= seg.min && (clampedScore <= seg.max || (seg.max === 100 && clampedScore === 100));
          return (
            <span
              key={seg.name}
              className={cn(
                "transition-colors duration-200",
                isSegmentActive
                  ? cn(seg.text, "font-black underline decoration-2 underline-offset-4")
                  : "text-slate-600 dark:text-slate-400"
              )}
            >
              {seg.name}
            </span>
          );
        })}
      </div>
    </div>
  );
}
