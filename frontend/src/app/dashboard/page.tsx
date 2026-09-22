"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { 
  ShieldCheck, 
  ShieldAlert, 
  AlertTriangle, 
  Search, 
  FileText, 
  Zap, 
  LifeBuoy,
  RefreshCw,
  AlertCircle,
  Bot
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} mins ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
  return date.toLocaleDateString();
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentScans, setRecentScans] = useState<ScanResultData[]>([]);
  const [recentReports, setRecentReports] = useState<IncidentReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsRes, scansRes, reportsRes] = await Promise.all([
        analyzerService.getDashboardStats().catch(() => null),
        analyzerService.getScanHistory({ page: 1, limit: 5 }).catch(() => null),
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

      if (reportsRes?.data?.data && Array.isArray(reportsRes.data.data)) {
        setRecentReports(reportsRes.data.data);
      } else {
        setRecentReports([]);
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

  const statCards: StatItem[] = [
    {
      title: "Total Scans",
      value: stats ? stats.totalScans.toString() : "0",
      label: "All-time URL analyses",
      icon: Search,
      color: "text-slate-700",
      bg: "bg-slate-100",
    },
    {
      title: "Safe URLs",
      value: stats ? stats.safeScans.toString() : "0",
      label: stats && stats.totalScans > 0 ? `${stats.cleanRatio}% verified clean` : "No scans yet",
      icon: ShieldCheck,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      title: "Suspicious URLs",
      value: stats ? stats.suspiciousScans.toString() : "0",
      label: "Low to Moderate risk",
      icon: AlertTriangle,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
    {
      title: "Dangerous URLs",
      value: stats ? stats.dangerousScans.toString() : "0",
      label: "High & Critical threats",
      icon: ShieldAlert,
      color: "text-red-600",
      bg: "bg-red-50",
    },
  ];

  return (
    <ProtectedRoute>
      <div className="min-h-screen flex flex-col lg:flex-row bg-[#F8FAFC]">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <Header />
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto w-full">
            {/* Header / Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
              <div>
                <h1 className="text-3xl font-extrabold text-[#1F2937] tracking-tight">Security Dashboard</h1>
                <p className="text-slate-500 text-xs sm:text-sm mt-1">Real-time overview of your scans, threat metrics, and incidents.</p>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  onClick={fetchDashboardData}
                  disabled={loading}
                  className="border-[#E5E7EB] text-slate-700 hover:bg-slate-50 px-3.5 h-10 rounded-xl font-medium text-xs flex items-center gap-2"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
                </Button>
                <Link href="/analyzer">
                  <Button className="bg-[#10B981] hover:bg-[#059669] text-white px-5 h-10 rounded-xl font-semibold text-xs flex items-center gap-2">
                    <Search className="w-4 h-4" /> Run New URL Scan
                  </Button>
                </Link>
              </div>
            </div>

            {/* Error Banner */}
            {error && (
              <div className="mb-8 p-4 rounded-xl bg-red-50 border border-red-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
                  <p className="text-xs text-red-800 font-medium">{error}</p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={fetchDashboardData}
                  className="text-xs border-red-200 text-red-700 hover:bg-red-100"
                >
                  Retry
                </Button>
              </div>
            )}

            {/* Top Stat Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {loading
                ? Array.from({ length: 4 }).map((_, idx) => (
                    <StatsCard key={idx} loading={true} />
                  ))
                : statCards.map((stat, idx) => (
                    <StatsCard key={idx} stat={stat} />
                  ))}
            </div>

            {/* Middle Section: Recent Scans & Quick Actions / Risk Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
              {/* Recent Scan History */}
              <RecentScans
                scans={recentScans}
                loading={loading}
                formatTimeAgo={formatTimeAgo}
              />

              {/* Sidebar Quick Actions & Risk Summary */}
              <div className="space-y-6">
                <Card className="border-[#E5E7EB] bg-white shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-bold text-[#1F2937]">Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2.5">
                    <Link href="/analyzer" className="block">
                      <Button variant="outline" className="w-full justify-start gap-2.5 border-[#E5E7EB] text-slate-700 hover:bg-slate-50 text-xs py-2.5 rounded-xl font-medium">
                        <Zap className="w-4 h-4 text-[#10B981]" /> Analyze Suspicious Link
                      </Button>
                    </Link>
                    <Link href="/assistant" className="block">
                      <Button variant="outline" className="w-full justify-start gap-2.5 border-[#E5E7EB] text-slate-700 hover:bg-slate-50 text-xs py-2.5 rounded-xl font-medium">
                        <Bot className="w-4 h-4 text-emerald-600" /> AI Cyber Security Assistant
                      </Button>
                    </Link>
                    <Link href="/reports" className="block">
                      <Button variant="outline" className="w-full justify-start gap-2.5 border-[#E5E7EB] text-slate-700 hover:bg-slate-50 text-xs py-2.5 rounded-xl font-medium">
                        <FileText className="w-4 h-4 text-indigo-600" /> View Incident Reports
                      </Button>
                    </Link>
                    <Link href="/recovery-guide" className="block">
                      <Button variant="outline" className="w-full justify-start gap-2.5 border-[#E5E7EB] text-slate-700 hover:bg-slate-50 text-xs py-2.5 rounded-xl font-medium">
                        <LifeBuoy className="w-4 h-4 text-amber-600" /> Incident Recovery Guide
                      </Button>
                    </Link>
                  </CardContent>
                </Card>

                <RiskSummaryCard stats={stats} loading={loading} />
              </div>
            </div>

            {/* Bottom Section: Recent Incident Reports */}
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
