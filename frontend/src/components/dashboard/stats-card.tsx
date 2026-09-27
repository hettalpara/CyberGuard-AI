"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface StatItem {
  title: string;
  value: string;
  label: string;
  icon: LucideIcon;
  color: string;
  bg: string;
}

interface StatsCardProps {
  stat?: StatItem;
  loading?: boolean;
}

export function StatsCard({ stat, loading }: StatsCardProps) {
  if (loading || !stat) {
    return (
      <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] shadow-sm animate-pulse">
        <CardContent className="p-4 flex items-center justify-between">
          <div className="space-y-2 flex-1">
            <div className="h-3 w-20 bg-slate-200 dark:bg-slate-850 rounded"></div>
            <div className="h-7 w-14 bg-slate-200 dark:bg-slate-850 rounded"></div>
            <div className="h-2 w-28 bg-slate-100 dark:bg-slate-850 rounded"></div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800"></div>
        </CardContent>
      </Card>
    );
  }

  const IconComponent = stat.icon;

  return (
    <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
      <CardContent className="p-4 flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold">
            {stat.title}
          </p>
          <h3 className="text-2xl font-mono font-black text-slate-900 dark:text-slate-100 tracking-tight">
            {stat.value}
          </h3>
          <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
            {stat.label}
          </p>
        </div>
        <div className={cn("p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60 shrink-0", stat.bg)}>
          <IconComponent className={cn("w-5 h-5", stat.color)} />
        </div>
      </CardContent>
    </Card>
  );
}
