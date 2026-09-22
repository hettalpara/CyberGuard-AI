import React from "react";
import Link from "next/link";
import { Search, ArrowRight, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RiskMeter } from "@/components/common/risk-meter";
import type { ScanResultData } from "@/services/analyzer.service";

interface RecentScansProps {
  scans: ScanResultData[];
  loading?: boolean;
  formatTimeAgo: (dateString?: string) => string;
}

export function RecentScans({ scans, loading, formatTimeAgo }: RecentScansProps) {
  return (
    <Card className="lg:col-span-2 border-[#E5E7EB] bg-white shadow-sm flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-[#E5E7EB]">
        <div>
          <CardTitle className="text-sm font-bold text-[#1F2937]">Recent Scan History</CardTitle>
          <CardDescription className="text-xs text-slate-500">Your latest URL risk investigations</CardDescription>
        </div>
        {scans.length > 0 && (
          <Link href="/history" className="text-xs font-bold text-[#10B981] hover:underline flex items-center gap-1">
            View All <ArrowRight className="w-3 h-3" />
          </Link>
        )}
      </CardHeader>
      <CardContent className="p-0 flex-1 flex flex-col">
        {loading ? (
          <div className="p-6 space-y-4">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div key={idx} className="flex items-center justify-between animate-pulse">
                <div className="space-y-2">
                  <div className="h-3 w-48 bg-slate-200 rounded"></div>
                  <div className="h-2 w-24 bg-slate-100 rounded"></div>
                </div>
                <div className="h-4 w-28 bg-slate-200 rounded"></div>
              </div>
            ))}
          </div>
        ) : scans.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className="p-3 bg-slate-100 rounded-full mb-3">
              <Search className="w-6 h-6 text-slate-400" />
            </div>
            <h4 className="text-sm font-bold text-slate-700">No scans yet.</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-xs mb-4">
              Analyze a URL to detect phishing, malware, SSL vulnerabilities, and reputation flags.
            </p>
            <Link href="/analyzer">
              <Button size="sm" className="bg-[#10B981] hover:bg-[#059669] text-white text-xs rounded-xl font-semibold">
                Run Your First Scan
              </Button>
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-[#E5E7EB]">
            {scans.map((scan) => {
              const level = (scan.risk?.level || scan.riskLevel || "SAFE") as
                | "SAFE"
                | "LOW"
                | "MODERATE"
                | "MEDIUM"
                | "HIGH"
                | "CRITICAL";
              const score = scan.riskScore ?? scan.risk?.score ?? 0;
              const timeAgo = formatTimeAgo(scan.scannedAt || scan.createdAt);
              return (
                <div key={scan.id || (scan as any)._id} className="p-4 flex items-center justify-between gap-4 hover:bg-slate-50 transition">
                  <div className="min-w-0 flex-1">
                    <div className="font-mono text-xs font-bold text-[#1F2937] truncate">{scan.url}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2">
                      <Clock className="w-3 h-3" /> {timeAgo}
                      <span className="text-slate-300">•</span>
                      <span className="text-slate-500 font-sans">{scan.domain}</span>
                    </div>
                  </div>
                  <div className="shrink-0 flex items-center gap-3">
                    <RiskMeter score={score} threatLevel={level === "MODERATE" ? "MEDIUM" : level} size="sm" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
