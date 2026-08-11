"use client";

import React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  className?: string;
  sizeClassName?: string;
  label?: string;
}

export function LoadingSpinner({
  className,
  sizeClassName = "h-8 w-8",
  label = "Querying secure databases...",
}: LoadingSpinnerProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center p-8 text-center space-y-3", className)}>
      <Loader2 className={cn("text-primary animate-spin", sizeClassName)} />
      {label && <p className="text-xs text-muted-foreground font-mono animate-pulse">{label}</p>}
    </div>
  );
}
