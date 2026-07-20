"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { 
  ShieldAlert, 
  Search, 
  MessageSquare, 
  FileText, 
  Activity, 
  ShieldCheck, 
  ChevronRight, 
  ArrowUpRight, 
  Globe, 
  Plus, 
  AlertTriangle,
  FileDown
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from "recharts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

// Mock Data for Charts
const weeklyData = [
  { name: "Mon", Phishing: 24, Malware: 12, Insider: 2 },
  { name: "Tue", Phishing: 30, Malware: 15, Insider: 1 },
  { name: "Wed", Phishing: 18, Malware: 8, Insider: 4 },
  { name: "Thu", Phishing: 45, Malware: 22, Insider: 3 },
  { name: "Fri", Phishing: 35, Malware: 19, Insider: 2 },
  { name: "Sat", Phishing: 12, Malware: 6, Insider: 0 },
  { name: "Sun", Phishing: 8, Malware: 4, Insider: 1 },
];

const monthlyData = [
  { name: "Jan", Incidents: 120, Resolved: 110 },
  { name: "Feb", Incidents: 150, Resolved: 142 },
  { name: "Mar", Incidents: 180, Resolved: 175 },
  { name: "Apr", Incidents: 140, Resolved: 138 },
  { name: "May", Incidents: 210, Resolved: 198 },
  { name: "Jun", Incidents: 190, Resolved: 188 },
];

const distributionData = [
  { name: "Phishing", value: 450, color: "var(--chart-1)" },
  { name: "Malware Scans", value: 300, color: "var(--chart-2)" },
  { name: "Credential Abuse", value: 150, color: "var(--chart-3)" },
  { name: "DDoS Deflections", value: 100, color: "var(--chart-4)" },
];

const recentActivities = [
  { id: 1, type: "scan", title: "Phishing Attempt Blocked", desc: "Detected malicious token harvester at payload-verify.xyz", time: "12 mins ago", severity: "high" },
  { id: 2, type: "assistant", title: "AI Recovery Guidance", desc: "Generated response blueprint for Ransomware scenario", time: "42 mins ago", severity: "info" },
  { id: 3, type: "report", title: "PDF Report Dossier generated", desc: "Report #CG-2026-981 ready for law enforcement download", time: "1 hour ago", severity: "success" },
  { id: 4, type: "scan", title: "Safe URL Registered", desc: "Scan of trusted-banking.com resolved clean with SSL verified", time: "2 hours ago", severity: "safe" },
];

const recentReports = [
  { id: "CG-2026-981", title: "Phishing Harvester Incident", status: "generated", date: "Jul 20, 2026", size: "2.4 MB" },
  { id: "CG-2026-979", title: "DDoS Network Vector Log", status: "submitted", date: "Jul 18, 2026", size: "4.1 MB" },
  { id: "CG-2026-974", title: "Unauthorized Credential Probe", status: "archived", date: "Jul 15, 2026", size: "1.8 MB" },
];

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false);
  const [quickScanUrl, setQuickScanUrl] = useState("");

  // Recharts SSR hydration safety hook
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleQuickScanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickScanUrl) return;
    console.log("Quick scanning:", quickScanUrl);
    setQuickScanUrl("");
  };

  return (
    <div className="space-y-6">
      {/* Header Summary */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gradient-cyber">Security Diagnostics Hub</h1>
          <p className="text-sm text-muted-foreground">
            Real-time status overview of active threat counters and AI forensic pipelines.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/analyzer">
            <Button size="sm" className="shadow-md cyber-glow-border">
              <Plus className="h-4 w-4 mr-1.5" /> New Analysis
            </Button>
          </Link>
          <Link href="/assistant">
            <Button variant="outline" size="sm">
              <MessageSquare className="h-4 w-4 mr-1.5" /> Consult Assistant
            </Button>
          </Link>
        </div>
      </div>

      {/* Threat Summary Widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { title: "Total URL Scans", value: "1,420", desc: "+12 in past hour", icon: Globe, color: "text-primary" },
          { title: "Safe URLs", value: "1,310", desc: "No threat flags triggered", icon: ShieldCheck, color: "text-emerald-500" },
          { title: "Suspicious URLs", value: "86", desc: "Require manual triage", icon: AlertTriangle, color: "text-amber-500" },
          { title: "Dangerous URLs", value: "24", desc: "Blocked by web shields", icon: ShieldAlert, color: "text-destructive" },
        ].map((stat, index) => (
          <Card key={index} className="cyber-glow-border bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <span className="text-xs font-semibold text-muted-foreground">{stat.title}</span>
              <stat.icon className={cn("h-4 w-4", stat.color)} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-[10px] sm:text-xs text-muted-foreground">{stat.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Middle Grid - Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Risk Score Widget */}
        <Card className="lg:col-span-1 border-border bg-card/65 flex flex-col justify-between cyber-glow-border">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Triage Risk Score</CardTitle>
            <CardDescription className="text-xs">Overall system vulnerability level</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center pb-6">
            {mounted ? (
              <div className="relative flex items-center justify-center h-48 w-48">
                {/* SVG Radial Progress Arc */}
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="40" stroke="var(--border)" strokeWidth="6" fill="transparent" />
                  <circle 
                    cx="50" 
                    cy="50" 
                    r="40" 
                    stroke="var(--primary)" 
                    strokeWidth="6" 
                    fill="transparent" 
                    strokeDasharray="251.2" 
                    strokeDashoffset="210" /* Calculates to 16% risk */
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out"
                  />
                </svg>
                <div className="absolute flex flex-col items-center justify-center">
                  <span className="text-4xl font-extrabold tracking-tight">16</span>
                  <span className="text-[10px] sm:text-xs font-semibold text-emerald-500 uppercase tracking-widest mt-1">Low Threat</span>
                </div>
              </div>
            ) : (
              <div className="h-48 flex items-center justify-center text-xs text-muted-foreground">Initializing metrics...</div>
            )}
            <div className="text-center text-xs text-muted-foreground px-4 mt-2">
              System is operating within cleared safety standards. 2 threats deflected today.
            </div>
          </CardContent>
        </Card>

        {/* Weekly Analysis Chart */}
        <Card className="lg:col-span-2 border-border bg-card/65 cyber-glow-border">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Weekly threat logs</CardTitle>
            <CardDescription className="text-xs">Identified threat vectors across phishing, malware scans, and internal indicators</CardDescription>
          </CardHeader>
          <CardContent className="h-64">
            {mounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.3} />
                  <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} />
                  <YAxis stroke="var(--muted-foreground)" fontSize={11} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: "var(--card)", borderColor: "var(--border)", borderRadius: "6px" }}
                    labelStyle={{ color: "var(--foreground)", fontWeight: "bold" }}
                  />
                  <Legend verticalAlign="top" height={36} iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "11px" }} />
                  <Bar dataKey="Phishing" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Malware" fill="var(--chart-2)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Insider" fill="var(--chart-3)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-muted-foreground">Simulating vector grid...</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Threat Distribution Chart */}
        <Card className="border-border bg-card/65 cyber-glow-border">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Threat Vectors Distribution</CardTitle>
            <CardDescription className="text-xs">Consolidated analysis of target incidents</CardDescription>
          </CardHeader>
          <CardContent className="h-56 pb-2">
            {mounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={distributionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {distributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: "var(--card)", borderColor: "var(--border)", borderRadius: "6px", fontSize: "12px" }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" iconSize={6} wrapperStyle={{ fontSize: "10px" }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-muted-foreground">Rendering sector map...</div>
            )}
          </CardContent>
        </Card>

        {/* Monthly Statistics Chart */}
        <Card className="border-border bg-card/65 cyber-glow-border">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Monthly Incident Trends</CardTitle>
            <CardDescription className="text-xs">Timeline comparison: reported vs. resolved</CardDescription>
          </CardHeader>
          <CardContent className="h-56">
            {mounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorIncidents" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorResolved" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--chart-2)" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="var(--chart-2)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.3} />
                  <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={10} tickLine={false} />
                  <YAxis stroke="var(--muted-foreground)" fontSize={10} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: "var(--card)", borderColor: "var(--border)", borderRadius: "6px", fontSize: "12px" }}
                  />
                  <Area type="monotone" dataKey="Incidents" stroke="var(--chart-1)" fillOpacity={1} fill="url(#colorIncidents)" />
                  <Area type="monotone" dataKey="Resolved" stroke="var(--chart-2)" fillOpacity={1} fill="url(#colorResolved)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-muted-foreground">Rendering timeline trends...</div>
            )}
          </CardContent>
        </Card>

        {/* Quick Scan & Quick Actions Widgets */}
        <div className="flex flex-col gap-6">
          {/* Quick Scan */}
          <Card className="border-border bg-card/65 cyber-glow-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Search className="h-4 w-4 text-primary" /> Heuristic URL Lookup
              </CardTitle>
              <CardDescription className="text-xs">Instantly scan files or domain signatures</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleQuickScanSubmit} className="flex gap-2">
                <Input
                  type="text"
                  placeholder="https://suspect-site.ru/login"
                  value={quickScanUrl}
                  onChange={(e) => setQuickScanUrl(e.target.value)}
                  className="text-xs h-9 bg-accent/20 border-border"
                />
                <Button type="submit" size="sm" className="h-9 px-3">Scan</Button>
              </form>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="border-border bg-card/65 flex-1 flex flex-col justify-between cyber-glow-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Clearance Operations</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3 pb-6">
              <Link href="/analyzer" className="flex flex-col items-center justify-center p-3 rounded-lg border border-border bg-card hover:bg-accent/10 transition-colors text-center group">
                <Globe className="h-5 w-5 text-primary mb-1 group-hover:scale-110 transition-transform" />
                <span className="text-[10px] sm:text-xs font-semibold">URL Analyzer</span>
              </Link>
              <Link href="/assistant" className="flex flex-col items-center justify-center p-3 rounded-lg border border-border bg-card hover:bg-accent/10 transition-colors text-center group">
                <MessageSquare className="h-5 w-5 text-primary mb-1 group-hover:scale-110 transition-transform" />
                <span className="text-[10px] sm:text-xs font-semibold">AI Assistant</span>
              </Link>
              <Link href="/reports" className="flex flex-col items-center justify-center p-3 rounded-lg border border-border bg-card hover:bg-accent/10 transition-colors text-center group">
                <FileText className="h-5 w-5 text-primary mb-1 group-hover:scale-110 transition-transform" />
                <span className="text-[10px] sm:text-xs font-semibold">Report Builder</span>
              </Link>
              <Link href="/history" className="flex flex-col items-center justify-center p-3 rounded-lg border border-border bg-card hover:bg-accent/10 transition-colors text-center group">
                <Activity className="h-5 w-5 text-primary mb-1 group-hover:scale-110 transition-transform" />
                <span className="text-[10px] sm:text-xs font-semibold">Threat Logs</span>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Grid Bottom row - Activities & Reports */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card className="border-border bg-card/65 cyber-glow-border">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold">Recent Security Activity</CardTitle>
              <CardDescription className="text-xs">Real-time alert timeline and assistant logs</CardDescription>
            </div>
            <Link href="/history" className="text-xs font-semibold text-primary flex items-center gap-0.5 hover:underline">
              View all <ChevronRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentActivities.map((act) => (
              <div key={act.id} className="flex items-start gap-3 p-3 rounded-md bg-accent/10 border border-border/40">
                <div className={cn(
                  "p-1.5 rounded-full shrink-0 mt-0.5",
                  act.severity === "high" && "bg-destructive/10 text-destructive",
                  act.severity === "info" && "bg-blue-500/10 text-blue-500",
                  act.severity === "success" && "bg-emerald-500/10 text-emerald-500",
                  act.severity === "safe" && "bg-emerald-500/10 text-emerald-500"
                )}>
                  {act.type === "scan" && <Search className="h-3.5 w-3.5" />}
                  {act.type === "assistant" && <MessageSquare className="h-3.5 w-3.5" />}
                  {act.type === "report" && <FileText className="h-3.5 w-3.5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-semibold truncate pr-2">{act.title}</span>
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">{act.time}</span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{act.desc}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recent Reports */}
        <Card className="border-border bg-card/65 cyber-glow-border">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold">Compliance Documents</CardTitle>
              <CardDescription className="text-xs"> court and agency submission reports dossier</CardDescription>
            </div>
            <Link href="/reports" className="text-xs font-semibold text-primary flex items-center gap-0.5 hover:underline">
              All Reports <ChevronRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border pb-2 text-muted-foreground font-semibold">
                    <th className="py-2">Report ID</th>
                    <th className="py-2">Report Name</th>
                    <th className="py-2">Filing Date</th>
                    <th className="py-2 text-right">Download</th>
                  </tr>
                </thead>
                <tbody>
                  {recentReports.map((report) => (
                    <tr key={report.id} className="border-b border-border/40 hover:bg-accent/5 transition-colors">
                      <td className="py-3 font-semibold">{report.id}</td>
                      <td className="py-3 max-w-[150px] truncate">{report.title}</td>
                      <td className="py-3 text-muted-foreground">{report.date}</td>
                      <td className="py-3 text-right">
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground">
                          <FileDown className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
