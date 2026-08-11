"use client";

import React from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = "Database Connection Interrupt",
  description = "Failed to establish a secure handshake to the threat databases. Please verify your token parameters and try again.",
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center p-8 text-center border border-destructive/20 bg-destructive/5 rounded-lg space-y-4 max-w-md mx-auto", className)}>
      <div className="h-12 w-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center">
        <AlertCircle className="h-6 w-6" />
      </div>
      <div className="space-y-1.5">
        <h3 className="text-sm font-bold text-destructive">{title}</h3>
        <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
      </div>
      {onRetry && (
        <Button size="sm" variant="outline" onClick={onRetry} className="h-8 border-destructive/20 text-destructive hover:bg-destructive/10">
          <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Reconnect Handshake
        </Button>
      )}
    </div>
  );
}
