"use client";

import React from "react";
import Link from "next/link";
import { Shield } from "lucide-react";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  iconClassName?: string;
  textClassName?: string;
  showText?: boolean;
}

export function Logo({
  className,
  iconClassName,
  textClassName,
  showText = true,
}: LogoProps) {
  return (
    <Link href="/" className={cn("inline-flex items-center gap-2.5 select-none", className)}>
      <Shield className={cn("h-6 w-6 text-primary animate-pulse shrink-0", iconClassName)} />
      {showText && (
        <span className={cn("font-bold tracking-tight text-gradient-cyber", textClassName)}>
          CyberGuard AI
        </span>
      )}
    </Link>
  );
}
