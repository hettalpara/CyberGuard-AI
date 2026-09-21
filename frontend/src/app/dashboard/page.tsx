"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { 
  ShieldCheck, 
  ShieldAlert, 
  AlertTriangle, 
  Search, 
  FileText, 
  ArrowRight, 
  Activity, 
  Zap, 
  LifeBuoy,
  RefreshCw,
  AlertCircle,
  Clock,
  ExternalLink,
  Bot
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RiskMeter } from "@/components/common/risk-meter";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { analyzerService, type DashboardStats, type ScanResultData } from "@/services/analyzer.service";
import { reportService } from "@/services/report.service";
import type { IncidentReport } from "@/types";

function formatTimeAgo(dateString?: string): string {
  if (!dateString) return "Recently";
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

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

  const statCards = [
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
              {loading ? (
                Array.from({ length: 4 }).map((_, idx) => (
                  <Card key={idx} className="border-[#E5E7EB] bg-white shadow-sm animate-pulse">
                    <CardContent className="p-5 flex items-center justify-between">
                      <div className="space-y-2 flex-1">
                        <div className="h-3 w-20 bg-slate-200 rounded"></div>
                        <div className="h-7 w-14 bg-slate-200 rounded"></div>
                        <div className="h-2 w-28 bg-slate-100 rounded"></div>
                      </div>
                      <div className="w-12 h-12 rounded-2xl bg-slate-100"></div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                statCards.map((stat, idx) => (
                  <Card key={idx} className="border-[#E5E7EB] bg-white shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-5 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold text-slate-500">{stat.title}</p>
                        <h3 className="text-2xl font-black text-[#1F2937] mt-1">{stat.value}</h3>
                        <p className="text-[11px] text-slate-400 mt-1">{stat.label}</p>
                      </div>
                      <div className={`p-3 rounded-2xl ${stat.bg}`}>
                        <stat.icon className={`w-6 h-6 ${stat.color}`} />
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>

            {/* Middle Section: Recent Scans & Quick Actions / Risk Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
              {/* Recent Scan History */}
              <Card className="lg:col-span-2 border-[#E5E7EB] bg-white shadow-sm flex flex-col">
                <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-[#E5E7EB]">
                  <div>
                    <CardTitle className="text-sm font-bold text-[#1F2937]">Recent Scan History</CardTitle>
                    <CardDescription className="text-xs text-slate-500">Your latest URL risk investigations</CardDescription>
                  </div>
                  {recentScans.length > 0 && (
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
                  ) : recentScans.length === 0 ? (
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
                      {recentScans.map((scan) => {
                        const level = (scan.risk?.level || scan.riskLevel || "SAFE") as any;
                        const score = scan.riskScore ?? scan.risk?.score ?? 0;
                        const timeAgo = formatTimeAgo(scan.scannedAt || scan.createdAt);
                        return (
                          <div key={scan.id} className="p-4 flex items-center justify-between gap-4 hover:bg-slate-50 transition">
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
              </div>
            </div>

            {/* Bottom Section: Recent Incident Reports */}
            <Card className="border-[#E5E7EB] bg-white shadow-sm">
              <CardHeader className="pb-3 border-b border-[#E5E7EB] flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-bold text-[#1F2937] flex items-center gap-2">
                    <Activity className="w-4 h-4 text-[#10B981]" /> Recent Incident Reports
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500">Official security incident documentation</CardDescription>
                </div>
                {recentReports.length > 0 && (
                  <Link href="/reports" className="text-xs font-bold text-[#10B981] hover:underline flex items-center gap-1">
                    View All Reports <ArrowRight className="w-3 h-3" />
                  </Link>
                )}
              </CardHeader>
              <CardContent className="p-4">
                {loading ? (
                  <div className="space-y-3 p-2">
                    {Array.from({ length: 3 }).map((_, idx) => (
                      <div key={idx} className="flex items-center justify-between animate-pulse p-2 rounded-lg bg-slate-50">
                        <div className="h-3 w-40 bg-slate-200 rounded"></div>
                        <div className="h-3 w-20 bg-slate-100 rounded"></div>
                      </div>
                    ))}
                  </div>
                ) : recentReports.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <h4 className="text-sm font-semibold text-slate-700">No incident reports yet.</h4>
                    <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto mb-4">
                      Create formal incident reports from completed threat scans to document evidence and export official PDFs.
                    </p>
                    <Link href="/reports">
                      <Button size="sm" variant="outline" className="text-xs border-[#E5E7EB] text-slate-700 hover:bg-slate-50 rounded-xl">
                        Explore Reports
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {recentReports.map((report) => (
                      <Link 
                        key={report._id} 
                        href={`/reports/${report._id}`}
                        className="flex items-center justify-between text-xs p-3 rounded-xl bg-slate-50 hover:bg-slate-100/80 border border-[#E5E7EB] transition"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="font-mono font-bold text-[#10B981]">{report.reportId}</span>
                          <span className="font-semibold text-slate-800 truncate">{report.title}</span>
                          <span className="hidden sm:inline-block text-[11px] px-2 py-0.5 rounded-full bg-slate-200/60 text-slate-600 font-medium">
                            {report.incidentType}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 shrink-0 ml-4">
                          <span className="text-[11px] text-slate-400">{formatTimeAgo(report.createdAt)}</span>
                          <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md ${
                            report.status === "FINAL" ? "bg-emerald-100 text-emerald-700" :
                            report.status === "DRAFT" ? "bg-amber-100 text-amber-700" :
                            "bg-slate-100 text-slate-600"
                          }`}>
                            {report.status}
                          </span>
                          <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
