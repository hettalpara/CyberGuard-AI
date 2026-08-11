"use client";

import React from "react";
import { AlertTriangle, AlertCircle, CheckCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

type AlertVariant = "info" | "warning" | "error" | "success";

interface AlertBannerProps {
  title: string;
  description?: string;
  variant?: AlertVariant;
  className?: string;
}

const iconMap = {
  info: Info,
  warning: AlertTriangle,
  error: AlertCircle,
  success: CheckCircle,
};

export function AlertBanner({
  title,
  description,
  variant = "info",
  className,
}: AlertBannerProps) {
  const IconComp = iconMap[variant];

  return (
    <div
      role="alert"
      className={cn(
        "flex gap-3 p-4 rounded-md border text-xs leading-relaxed transition-all",
        variant === "info" && "bg-blue-500/5 text-primary border-blue-500/20",
        variant === "warning" && "bg-amber-500/5 text-amber-500 border-amber-500/20",
        variant === "error" && "bg-destructive/5 text-destructive border-destructive/20",
        variant === "success" && "bg-emerald-500/5 text-emerald-500 border-emerald-500/20",
        className
      )}
    >
      <IconComp className="h-5 w-5 shrink-0 mt-0.5" />
      <div className="space-y-1">
        <h4 className="font-bold">{title}</h4>
        {description && <p className="text-muted-foreground">{description}</p>}
      </div>
    </div>
  );
}
