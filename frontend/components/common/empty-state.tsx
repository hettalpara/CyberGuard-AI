"use client";

import React from "react";
import { FileQuestion } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: React.ComponentType<any>;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  title = "No threat records found",
  description = "No scan queries or files identified in database matching the search query.",
  icon: Icon = FileQuestion,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center p-12 text-center border border-dashed border-border/60 rounded-lg bg-card/20 space-y-4", className)}>
      <div className="h-12 w-12 rounded-full bg-accent/20 flex items-center justify-center text-muted-foreground/60">
        <Icon className="h-6 w-6" />
      </div>
      <div className="space-y-1.5 max-w-sm">
        <h3 className="text-sm font-bold text-foreground">{title}</h3>
        <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
      </div>
      {action && <div className="pt-2">{action}</div>}
    </div>
  );
}
