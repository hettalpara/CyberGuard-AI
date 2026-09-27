"use client";

import React from "react";
import Link from "next/link";
import { Search, ArrowRight, ShieldCheck, ShieldAlert, Clock, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RiskBadge, normalizeRiskLevel } from "@/components/common/risk-badge";
import { RiskMeter } from "@/components/common/risk-meter";
import type { ScanResultData } from "@/services/analyzer.service";

interface RecentScansProps {
  scans: ScanResultData[];
  loading?: boolean;
  formatTimeAgo: (dateString?: string) => string;
}

export function RecentScans({ scans, loading, formatTimeAgo }: RecentScansProps) {
  return (
    <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] shadow-sm flex flex-col overflow-hidden">
      <CardHeader className="py-3.5 px-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-xs font-bold font-mono uppercase tracking-wider text-slate-800 dark:text-slate-200">
            Recent Scans
          </CardTitle>
          <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
            Real-time feed of multi-vector URL investigations
          </CardDescription>
        </div>
        {scans.length > 0 && (
          <Link
            href="/history"
            className="text-xs font-mono font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
          >
            <span>View All</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        )}
      </CardHeader>

      <CardContent className="p-0 flex-1 flex flex-col">
        {loading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div key={idx} className="flex items-center justify-between animate-pulse p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
                <div className="space-y-1.5 flex-1">
                  <div className="h-3 w-48 bg-slate-200 dark:bg-slate-800 rounded"></div>
                  <div className="h-2 w-28 bg-slate-100 dark:bg-slate-850 rounded"></div>
                </div>
                <div className="h-5 w-24 bg-slate-200 dark:bg-slate-800 rounded"></div>
              </div>
            ))}
          </div>
        ) : scans.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3 text-slate-400">
              <Search className="w-5 h-5" />
            </div>
            <h4 className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200">No scans recorded yet</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mb-4">
              Analyze your first URL to begin building your threat intelligence and scan history.
            </p>
            <Link href="/analyzer">
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-mono rounded-lg">
                Analyze URL
              </Button>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-mono text-[11px]">
                <tr>
                  <th className="px-4 py-3">URL</th>
                  <th className="px-4 py-3">Risk Score</th>
                  <th className="px-4 py-3">Risk Level</th>
                  <th className="px-4 py-3">Confidence</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {scans.map((scan) => {
                  const level = (scan.risk?.level || scan.riskLevel || "SAFE") as string;
                  const score = scan.riskScore ?? scan.risk?.score ?? 0;
                  const confidence = scan.confidence ?? scan.risk?.confidence ?? 0;
                  const timeStr = formatTimeAgo(scan.scannedAt || scan.createdAt);
                  const isThreat = normalizeRiskLevel(level) === "HIGH" || normalizeRiskLevel(level) === "CRITICAL";

                  return (
                    <tr
                      key={scan.id || (scan as any)._id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-900/60 transition-colors font-mono"
                    >
                      {/* URL */}
                      <td className="px-4 py-3.5 max-w-[220px]">
                        <div className="font-bold text-slate-900 dark:text-slate-100 truncate" title={scan.url}>
                          {scan.url}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate">
                          {scan.domain || "Web URL"}
                        </div>
                      </td>

                      {/* Risk Score */}
                      <td className="px-4 py-3.5">
                        <RiskMeter score={score} threatLevel={level} size="sm" showBadge={false} />
                      </td>

                      {/* Risk Level */}
                      <td className="px-4 py-3.5">
                        <RiskBadge level={level} size="sm" />
                      </td>

                      {/* Confidence */}
                      <td className="px-4 py-3.5">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          {confidence}%
                        </span>
                      </td>

                      {/* Date */}
                      <td className="px-4 py-3.5 text-slate-500 text-[11px] whitespace-nowrap">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {timeStr}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded border uppercase ${
                          isThreat
                            ? "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900"
                            : "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900"
                        }`}>
                          {isThreat ? (
                            <>
                              <ShieldAlert className="w-3 h-3 text-red-600" /> THREAT
                            </>
                          ) : (
                            <>
                              <ShieldCheck className="w-3 h-3 text-emerald-600" /> CLEAN
                            </>
                          )}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="px-4 py-3.5 text-right">
                        <Link href={`/analyzer?url=${encodeURIComponent(scan.url)}`}>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs font-mono font-semibold border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg px-2.5"
                          >
                            View Analysis
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
