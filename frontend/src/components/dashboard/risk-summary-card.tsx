import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { DashboardStats } from "@/services/analyzer.service";

interface RiskSummaryCardProps {
  stats: DashboardStats | null;
  loading?: boolean;
}

export function RiskSummaryCard({ stats, loading }: RiskSummaryCardProps) {
  return (
    <Card className="border-[#E5E7EB] bg-white shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-bold text-[#1F2937]">Risk Summary</CardTitle>
        <CardDescription className="text-xs text-slate-500">Your URL threat detection distribution</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-xs text-slate-600">
        {loading ? (
          <div className="space-y-3 animate-pulse">
            <div className="h-4 bg-slate-200 rounded"></div>
            <div className="h-2 bg-slate-100 rounded"></div>
            <div className="h-4 bg-slate-200 rounded"></div>
          </div>
        ) : stats && stats.totalScans > 0 ? (
          <>
            <div className="flex items-center justify-between">
              <span className="font-medium">Verified Clean Domains</span>
              <span className="font-bold text-emerald-600">{stats.cleanRatio}%</span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-[#10B981] h-full transition-all duration-500 rounded-full" 
                style={{ width: `${stats.cleanRatio}%` }} 
              />
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-[#E5E7EB]">
              <span className="font-medium">Threats & Flagged URLs</span>
              <span className="font-bold text-red-600">{stats.threatRatio}%</span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-red-500 h-full transition-all duration-500 rounded-full" 
                style={{ width: `${stats.threatRatio}%` }} 
              />
            </div>
            <div className="pt-2 text-[11px] text-slate-400 flex justify-between">
              <span>Average Risk Score</span>
              <span className="font-semibold text-slate-700">{stats.avgRiskScore}/100</span>
            </div>
          </>
        ) : (
          <div className="text-center py-4 text-slate-400">
            <p>No scan data available yet.</p>
            <p className="text-[11px] mt-1 text-slate-400">Scans will populate your threat breakdown here.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
