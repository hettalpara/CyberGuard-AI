"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { 
  ShieldCheck, 
  ShieldAlert, 
  Search, 
  FileText, 
  Zap, 
  LifeBuoy,
  RefreshCw,
  AlertCircle,
  Bot,
  Activity,
  ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { 
  StatsCard, 
  RecentScans, 
  RecentReports, 
  RiskSummaryCard,
  type StatItem 
} from "@/components/dashboard";
import { analyzerService, type DashboardStats, type ScanResultData } from "@/services/analyzer.service";
import { reportService } from "@/services/report.service";
import type { IncidentReport } from "@/types";

function formatTimeAgo(dateString?: string): string {
  if (!dateString) return "Recently";
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (isNaN(diffInSeconds)) return "Recently";
  if (diffInSeconds < 60) return "Just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  return date.toLocaleDateString();
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentScans, setRecentScans] = useState<ScanResultData[]>([]);
  const [recentReports, setRecentReports] = useState<IncidentReport[]>([]);
  const [totalReportsCount, setTotalReportsCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsRes, scansRes, reportsRes] = await Promise.all([
        analyzerService.getDashboardStats().catch(() => null),
        analyzerService.getScanHistory({ page: 1, limit: 6 }).catch(() => null),
        reportService.getReports({ page: 1, limit: 5 }).catch(() => null),
      ]);

      if (!statsRes && !scansRes && !reportsRes) {
        throw new Error("Unable to connect to security services");
      }

      if (statsRes?.data?.stats) {
        setStats(statsRes.data.stats);
      } else {
        setStats({
          totalScans: 0,
          safeScans: 0,
          suspiciousScans: 0,
          dangerousScans: 0,
          threatScans: 0,
          highRiskScans: 0,
          criticalScans: 0,
          lowRiskScans: 0,
          moderateRiskScans: 0,
          cleanRatio: 0,
          threatRatio: 0,
          avgRiskScore: 0,
        });
      }

      if (scansRes?.data?.data && Array.isArray(scansRes.data.data)) {
        setRecentScans(scansRes.data.data);
      } else {
        setRecentScans([]);
      }

      if (reportsRes?.data) {
        if (Array.isArray(reportsRes.data.data)) {
          setRecentReports(reportsRes.data.data);
        }
        if (reportsRes.data.pagination?.total !== undefined) {
          setTotalReportsCount(reportsRes.data.pagination.total);
        }
      } else {
        setRecentReports([]);
        setTotalReportsCount(0);
      }
    } catch (err: unknown) {
      console.error("Dashboard fetch error:", err);
      setError("Unable to load dashboard data. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Derive authoritative recent risk level from the most recent scan
  const mostRecentScan = recentScans[0];
  const recentRiskLevel = mostRecentScan
    ? mostRecentScan.risk?.level || mostRecentScan.riskLevel || "SAFE"
    : stats && stats.totalScans > 0
    ? stats.avgRiskScore >= 60 ? "HIGH" : stats.avgRiskScore >= 40 ? "MODERATE" : stats.avgRiskScore >= 20 ? "LOW" : "SAFE"
    : "NONE";

  const threatsDetectedCount = stats
    ? stats.threatScans || (stats.highRiskScans + stats.criticalScans) || stats.dangerousScans || 0
    : 0;

  const statCards: StatItem[] = [
    {
      title: "Total Scans",
      value: stats ? stats.totalScans.toString() : "0",
      label: "All-time URL investigations",
      icon: Search,
      color: "text-slate-700 dark:text-slate-300",
      bg: "bg-slate-100 dark:bg-slate-800",
    },
    {
      title: "Threats Detected",
      value: threatsDetectedCount.toString(),
      label: stats && stats.totalScans > 0 ? `${stats.threatRatio}% flagged threats` : "Zero threats found",
      icon: ShieldAlert,
      color: "text-red-600 dark:text-red-400",
      bg: "bg-red-50 dark:bg-red-950/40",
    },
    {
      title: "Reports Generated",
      value: totalReportsCount.toString(),
      label: "Documented incident records",
      icon: FileText,
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-50 dark:bg-blue-950/40",
    },
    {
      title: "Recent Risk Level",
      value: recentRiskLevel,
      label: mostRecentScan ? `Last score: ${mostRecentScan.riskScore ?? mostRecentScan.risk?.score ?? 0}/100` : "No recent scans",
      icon: Activity,
      color: recentRiskLevel === "HIGH" || recentRiskLevel === "CRITICAL"
        ? "text-red-600 dark:text-red-400"
        : recentRiskLevel === "MODERATE"
        ? "text-orange-600 dark:text-orange-400"
        : recentRiskLevel === "LOW"
        ? "text-amber-600 dark:text-amber-400"
        : "text-emerald-600 dark:text-emerald-400",
      bg: recentRiskLevel === "HIGH" || recentRiskLevel === "CRITICAL"
        ? "bg-red-50 dark:bg-red-950/40"
        : recentRiskLevel === "MODERATE"
        ? "bg-orange-50 dark:bg-orange-950/40"
        : recentRiskLevel === "LOW"
        ? "bg-amber-50 dark:bg-amber-950/40"
        : "bg-emerald-50 dark:bg-emerald-950/40",
    },
  ];

  return (
    <ProtectedRoute>
      <div className="min-h-screen flex flex-col lg:flex-row bg-slate-50 dark:bg-[#0B0F19]">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <Header />
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto w-full space-y-6">
            
            {/* Top Welcome / Overview Section */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 font-mono font-bold text-[10px] rounded border border-emerald-300 dark:border-emerald-800">
                    SOC MONITOR
                  </span>
                  <span className="text-[11px] font-mono text-slate-500">Live Posture</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-mono font-black text-slate-900 dark:text-slate-100 tracking-tight">
                  CyberGuard Overview
                </h1>
                <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
                  Monitor URL security analysis, incidents and recent activity.
                </p>
              </div>

              <div className="flex items-center gap-2.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchDashboardData}
                  disabled={loading}
                  className="border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 h-9 px-3 rounded-lg text-xs font-mono flex items-center gap-1.5"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                  <span>Refresh</span>
                </Button>

                <Link href="/analyzer">
                  <Button
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white h-9 px-4 rounded-lg text-xs font-mono font-semibold flex items-center gap-1.5 shadow-xs"
                  >
                    <Search className="w-3.5 h-3.5" />
                    <span>Run URL Scan</span>
                  </Button>
                </Link>
              </div>
            </div>

            {/* Error Banner */}
            {error && (
              <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 flex items-center justify-between font-mono text-xs">
                <div className="flex items-center gap-2.5 text-red-700 dark:text-red-400">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                  <span>{error}</span>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={fetchDashboardData}
                  className="h-7 text-xs border-red-300 dark:border-red-800 text-red-700 dark:text-red-400"
                >
                  Retry
                </Button>
              </div>
            )}

            {/* Summary Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {loading
                ? Array.from({ length: 4 }).map((_, idx) => (
                    <StatsCard key={idx} loading={true} />
                  ))
                : statCards.map((stat, idx) => (
                    <StatsCard key={idx} stat={stat} />
                  ))}
            </div>

            {/* Main Center Area: Recent Scans + Quick Actions / Risk Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left 2 Cols: Recent Scans Table */}
              <div className="lg:col-span-2">
                <RecentScans
                  scans={recentScans}
                  loading={loading}
                  formatTimeAgo={formatTimeAgo}
                />
              </div>

              {/* Right Col: Quick Actions & Risk Distribution */}
              <div className="space-y-6">
                <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] shadow-sm">
                  <CardHeader className="py-3.5 px-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40">
                    <CardTitle className="text-xs font-bold font-mono uppercase tracking-wider text-slate-800 dark:text-slate-200">
                      Quick Operations
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 space-y-2">
                    <Link href="/analyzer" className="block">
                      <Button
                        variant="outline"
                        className="w-full justify-between border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-mono h-9 rounded-lg"
                      >
                        <span className="flex items-center gap-2">
                          <Zap className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Analyze Suspicious URL</span>
                        </span>
                        <ArrowRight className="w-3 h-3 text-slate-400" />
                      </Button>
                    </Link>

                    <Link href="/assistant" className="block">
                      <Button
                        variant="outline"
                        className="w-full justify-between border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-mono h-9 rounded-lg"
                      >
                        <span className="flex items-center gap-2">
                          <Bot className="w-3.5 h-3.5 text-blue-600" />
                          <span>AI Cybersecurity Assistant</span>
                        </span>
                        <ArrowRight className="w-3 h-3 text-slate-400" />
                      </Button>
                    </Link>

                    <Link href="/reports" className="block">
                      <Button
                        variant="outline"
                        className="w-full justify-between border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-mono h-9 rounded-lg"
                      >
                        <span className="flex items-center gap-2">
                          <FileText className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Incident Records</span>
                        </span>
                        <ArrowRight className="w-3 h-3 text-slate-400" />
                      </Button>
                    </Link>

                    <Link href="/recovery-guide" className="block">
                      <Button
                        variant="outline"
                        className="w-full justify-between border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-mono h-9 rounded-lg"
                      >
                        <span className="flex items-center gap-2">
                          <LifeBuoy className="w-3.5 h-3.5 text-amber-600" />
                          <span>Cyber Incident Recovery</span>
                        </span>
                        <ArrowRight className="w-3 h-3 text-slate-400" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>

                {/* Risk Distribution Card */}
                <RiskSummaryCard stats={stats} loading={loading} />
              </div>
            </div>

            {/* Bottom: Recent Incident Reports */}
            <RecentReports
              reports={recentReports}
              loading={loading}
              formatTimeAgo={formatTimeAgo}
            />
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
