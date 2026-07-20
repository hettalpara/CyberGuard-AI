"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface SkeletonLoaderProps {
  className?: string;
  variant?: "card" | "table" | "text" | "circle";
  count?: number;
}

export function SkeletonLoader({
  className,
  variant = "card",
  count = 1,
}: SkeletonLoaderProps) {
  const items = Array.from({ length: count });

  const renderSkeleton = () => {
    switch (variant) {
      case "circle":
        return <div className={cn("rounded-full bg-accent/30 animate-pulse shrink-0", className)} />;
      case "text":
        return (
          <div className="space-y-2 w-full">
            <div className={cn("h-4 bg-accent/30 rounded animate-pulse w-3/4", className)} />
            <div className="h-3 bg-accent/30 rounded animate-pulse w-1/2" />
          </div>
        );
      case "table":
        return (
          <div className="space-y-3 w-full p-4 border border-border/40 rounded-lg">
            <div className="h-4 bg-accent/40 rounded animate-pulse w-full mb-4" />
            {items.map((_, i) => (
              <div key={i} className="flex gap-4">
                <div className="h-3 bg-accent/30 rounded animate-pulse w-1/4" />
                <div className="h-3 bg-accent/30 rounded animate-pulse w-2/4" />
                <div className="h-3 bg-accent/30 rounded animate-pulse w-1/4" />
              </div>
            ))}
          </div>
        );
      case "card":
      default:
        return (
          <div className={cn("border border-border/40 p-5 rounded-lg bg-card/65 space-y-4 animate-pulse", className)}>
            <div className="flex gap-3 items-center">
              <div className="h-10 w-10 rounded bg-accent/40" />
              <div className="space-y-1.5 flex-1">
                <div className="h-4 bg-accent/40 rounded w-1/3" />
                <div className="h-3 bg-accent/30 rounded w-1/2" />
              </div>
            </div>
            <div className="h-3 bg-accent/30 rounded w-full" />
            <div className="h-3 bg-accent/30 rounded w-5/6" />
          </div>
        );
    }
  };

  return (
    <>
      {items.map((_, i) => (
        <React.Fragment key={i}>
          {renderSkeleton()}
        </React.Fragment>
      ))}
    </>
  );
}
