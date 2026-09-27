"use client";

import React from "react";
import { ShieldCheck, AlertCircle, AlertTriangle, ShieldAlert, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export type RiskLevel = "SAFE" | "LOW" | "MODERATE" | "MEDIUM" | "HIGH" | "CRITICAL" | "INCONCLUSIVE" | string;

interface RiskBadgeProps {
  level: RiskLevel;
  className?: string;
  size?: "sm" | "md" | "lg";
  showIcon?: boolean;
}

export function normalizeRiskLevel(level: RiskLevel): "SAFE" | "LOW" | "MODERATE" | "HIGH" | "CRITICAL" | "INCONCLUSIVE" {
  const upper = String(level || "").toUpperCase();
  if (upper === "MEDIUM") return "MODERATE";
  if (["SAFE", "LOW", "MODERATE", "HIGH", "CRITICAL"].includes(upper)) {
    return upper as "SAFE" | "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
  }
  return "INCONCLUSIVE";
}

export function getRiskLevelStyles(level: RiskLevel) {
  const norm = normalizeRiskLevel(level);
  switch (norm) {
    case "CRITICAL":
      return {
        badge: "bg-red-950/20 text-red-700 border-red-300 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900",
        text: "text-red-700 dark:text-red-400",
        dot: "bg-red-600",
        border: "border-red-500",
        label: "CRITICAL",
        range: "80–100",
      };
    case "HIGH":
      return {
        badge: "bg-red-50 text-red-600 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800",
        text: "text-red-600 dark:text-red-400",
        dot: "bg-red-500",
        border: "border-red-400",
        label: "HIGH",
        range: "60–79",
      };
    case "MODERATE":
      return {
        badge: "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/30 dark:text-orange-400 dark:border-orange-800",
        text: "text-orange-600 dark:text-orange-400",
        dot: "bg-orange-500",
        border: "border-orange-400",
        label: "MODERATE",
        range: "40–59",
      };
    case "LOW":
      return {
        badge: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800",
        text: "text-amber-600 dark:text-amber-400",
        dot: "bg-amber-500",
        border: "border-amber-400",
        label: "LOW",
        range: "20–39",
      };
    case "SAFE":
      return {
        badge: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800",
        text: "text-emerald-600 dark:text-emerald-400",
        dot: "bg-emerald-500",
        border: "border-emerald-400",
        label: "SAFE",
        range: "0–19",
      };
    default:
      return {
        badge: "bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
        text: "text-slate-600 dark:text-slate-400",
        dot: "bg-slate-400",
        border: "border-slate-300",
        label: "INCONCLUSIVE",
        range: "N/A",
      };
  }
}

export function RiskBadge({ level, className, size = "md", showIcon = true }: RiskBadgeProps) {
  const norm = normalizeRiskLevel(level);
  const styles = getRiskLevelStyles(norm);

  const sizeClasses = {
    sm: "px-2 py-0.5 text-[10px] gap-1",
    md: "px-2.5 py-1 text-xs gap-1.5",
    lg: "px-3.5 py-1.5 text-sm gap-2",
  }[size];

  const iconSizes = {
    sm: "w-3 h-3",
    md: "w-3.5 h-3.5",
    lg: "w-4 h-4",
  }[size];

  const renderIcon = () => {
    if (!showIcon) return null;
    switch (norm) {
      case "CRITICAL":
        return <ShieldAlert className={cn(iconSizes, "text-red-700 shrink-0")} />;
      case "HIGH":
        return <AlertTriangle className={cn(iconSizes, "text-red-600 shrink-0")} />;
      case "MODERATE":
        return <AlertCircle className={cn(iconSizes, "text-orange-600 shrink-0")} />;
      case "LOW":
        return <AlertCircle className={cn(iconSizes, "text-amber-600 shrink-0")} />;
      case "SAFE":
        return <ShieldCheck className={cn(iconSizes, "text-emerald-600 shrink-0")} />;
      default:
        return <HelpCircle className={cn(iconSizes, "text-slate-500 shrink-0")} />;
    }
  };

  return (
    <span
      className={cn(
        "inline-flex items-center font-bold tracking-wide uppercase border rounded-md font-mono select-none",
        styles.badge,
        sizeClasses,
        className
      )}
    >
      {renderIcon()}
      <span>{styles.label}</span>
    </span>
  );
}
