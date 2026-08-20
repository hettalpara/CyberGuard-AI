"use client";

import React from "react";
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
  LifeBuoy 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RiskMeter } from "@/components/common/risk-meter";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { ProtectedRoute } from "@/components/auth/protected-route";

export default function DashboardPage() {
  const stats = [
    { title: "Total Scans", value: "128", label: "All time URL analyses", icon: Search, color: "text-slate-700", bg: "bg-slate-100" },
    { title: "Safe URLs", value: "94", label: "73.4% verified clean", icon: ShieldCheck, color: "text-emerald-600", bg: "bg-emerald-50" },
    { title: "Suspicious URLs", value: "22", label: "Low to Medium risk", icon: AlertTriangle, color: "text-amber-600", bg: "bg-amber-50" },
    { title: "Dangerous URLs", value: "12", label: "Phishing & Malware", icon: ShieldAlert, color: "text-red-600", bg: "bg-red-50" },
  ];

  const recentScans = [
    { id: "1", url: "https://sbi-verify-account.xyz/login", riskScore: 88, threatLevel: "HIGH" as const, date: "10 mins ago", status: "Flagged" },
    { id: "2", url: "https://github.com", riskScore: 0, threatLevel: "SAFE" as const, date: "1 hour ago", status: "Clean" },
    { id: "3", url: "http://update-paypal-security.com", riskScore: 92, threatLevel: "CRITICAL" as const, date: "3 hours ago", status: "Flagged" },
    { id: "4", url: "https://google.com", riskScore: 5, threatLevel: "SAFE" as const, date: "5 hours ago", status: "Clean" },
    { id: "5", url: "http://free-giftcard-claim.net", riskScore: 65, threatLevel: "MEDIUM" as const, date: "1 day ago", status: "Warning" },
  ];

  const recentActivities = [
    { text: "Scanned sbi-verify-account.xyz - Flagged as High Risk Phishing", time: "10 mins ago" },
    { text: "Downloaded PDF Security Report RPT-202608-001", time: "25 mins ago" },
    { text: "Scanned github.com - Verified Clean SSL & WHOIS", time: "1 hour ago" },
    { text: "Asked AI Assistant about UPI QR code fraud recovery steps", time: "2 hours ago" },
  ];

  return (
    <ProtectedRoute>
      <div className="min-h-screen flex flex-col lg:flex-row bg-[#F8FAFC]">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <Header />
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto w-full">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
              <div>
                <h1 className="text-3xl font-extrabold text-[#1F2937] tracking-tight">Security Dashboard</h1>
                <p className="text-slate-500 text-xs sm:text-sm mt-1">Overview of URL scans, threat metrics, and recent activity.</p>
              </div>
              <Link href="/analyzer">
                <Button className="bg-[#10B981] hover:bg-[#059669] text-white px-5 h-10 rounded-xl font-semibold text-xs flex items-center gap-2">
                  <Search className="w-4 h-4" /> Run New URL Scan
                </Button>
              </Link>
            </div>

            {/* Top Stat Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {stats.map((stat, idx) => (
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
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
              <Card className="lg:col-span-2 border-[#E5E7EB] bg-white shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-[#E5E7EB]">
                  <div>
                    <CardTitle className="text-sm font-bold text-[#1F2937]">Recent Scan History</CardTitle>
                    <CardDescription className="text-xs text-slate-500">Latest URL risk checks</CardDescription>
                  </div>
                  <Link href="/history" className="text-xs font-bold text-[#10B981] hover:underline flex items-center gap-1">
                    View All <ArrowRight className="w-3 h-3" />
                  </Link>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-[#E5E7EB]">
                    {recentScans.map((scan) => (
                      <div key={scan.id} className="p-4 flex items-center justify-between gap-4 hover:bg-slate-50 transition">
                        <div className="min-w-0 flex-1">
                          <div className="font-mono text-xs font-bold text-[#1F2937] truncate">{scan.url}</div>
                          <div className="text-[11px] text-slate-400 mt-0.5">{scan.date}</div>
                        </div>
                        <div className="shrink-0 flex items-center gap-3">
                          <RiskMeter score={scan.riskScore} threatLevel={scan.threatLevel} size="sm" />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

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
                    <Link href="/reports" className="block">
                      <Button variant="outline" className="w-full justify-start gap-2.5 border-[#E5E7EB] text-slate-700 hover:bg-slate-50 text-xs py-2.5 rounded-xl font-medium">
                        <FileText className="w-4 h-4 text-emerald-600" /> Export PDF Incident Report
                      </Button>
                    </Link>
                    <Link href="/recovery-guide" className="block">
                      <Button variant="outline" className="w-full justify-start gap-2.5 border-[#E5E7EB] text-slate-700 hover:bg-slate-50 text-xs py-2.5 rounded-xl font-medium">
                        <LifeBuoy className="w-4 h-4 text-amber-600" /> Phishing Recovery Steps
                      </Button>
                    </Link>
                  </CardContent>
                </Card>

                <Card className="border-[#E5E7EB] bg-white shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-bold text-[#1F2937]">Risk Summary</CardTitle>
                    <CardDescription className="text-xs text-slate-500">Platform threat detection ratio</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3 text-xs text-slate-600">
                    <div className="flex items-center justify-between">
                      <span>Verified Clean Domains</span>
                      <span className="font-bold text-emerald-600">73.4%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-[#10B981] h-full" style={{ width: "73.4%" }} />
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-[#E5E7EB]">
                      <span>Phishing & Malicious</span>
                      <span className="font-bold text-red-600">26.6%</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            <Card className="border-[#E5E7EB] bg-white shadow-sm">
              <CardHeader className="pb-3 border-b border-[#E5E7EB]">
                <CardTitle className="text-sm font-bold text-[#1F2937] flex items-center gap-2">
                  <Activity className="w-4 h-4 text-[#10B981]" /> Recent Security Activity
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-3">
                  {recentActivities.map((act, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-50 border border-[#E5E7EB]">
                      <span className="font-medium text-slate-700">{act.text}</span>
                      <span className="text-[11px] text-slate-400 shrink-0 ml-4">{act.time}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
