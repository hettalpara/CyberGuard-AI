import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import type { LucideIcon } from "lucide-react";

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
      <Card className="border-[#E5E7EB] bg-white shadow-sm animate-pulse">
        <CardContent className="p-5 flex items-center justify-between">
          <div className="space-y-2 flex-1">
            <div className="h-3 w-20 bg-slate-200 rounded"></div>
            <div className="h-7 w-14 bg-slate-200 rounded"></div>
            <div className="h-2 w-28 bg-slate-100 rounded"></div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-slate-100"></div>
        </CardContent>
      </Card>
    );
  }

  const IconComponent = stat.icon;

  return (
    <Card className="border-[#E5E7EB] bg-white shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-5 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-500">{stat.title}</p>
          <h3 className="text-2xl font-black text-[#1F2937] mt-1">{stat.value}</h3>
          <p className="text-[11px] text-slate-400 mt-1">{stat.label}</p>
        </div>
        <div className={`p-3 rounded-2xl ${stat.bg}`}>
          <IconComponent className={`w-6 h-6 ${stat.color}`} />
        </div>
      </CardContent>
    </Card>
  );
}
