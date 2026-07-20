"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, 
  Loader2, 
  ShieldAlert, 
  ShieldCheck, 
  Globe, 
  Clock, 
  Server, 
  Lock, 
  Terminal, 
  Brain, 
  ListChecks, 
  AlertTriangle,
  Info,
  CheckCircle,
  FileSearch,
  Activity
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader, Breadcrumb } from "@/components/common";
// Heuristic diagnostic logs to simulate scanning phases
const scanPhases = [
  "Resolving DNS host records...",
  "Querying WHOIS registry databases...",
  "Requesting VirusTotal engine logs...",
  "Evaluating Google Safe Browsing lists...",
  "Running heuristics signature matching...",
  "Synthesizing threat diagnostics..."
];

export default function AnalyzerPage() {
  const [urlInput, setUrlInput] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [scanStep, setScanStep] = useState(0);
  const [hasResult, setHasResult] = useState(false);
  const [recentScans, setRecentScans] = useState([
    { url: "https://secure-login-paypal.com/verify", risk: 78, type: "Phishing", date: "10 mins ago" },
    { url: "https://trusted-bank-verification.net", risk: 12, type: "Safe", date: "1 hour ago" },
    { url: "https://pay-invoice-system-updates.ru", risk: 92, type: "Malware", date: "4 hours ago" }
  ]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isScanning && scanStep < scanPhases.length) {
      timer = setTimeout(() => {
        setScanStep((prev) => prev + 1);
      }, 600);
    } else if (isScanning && scanStep === scanPhases.length) {
      setIsScanning(false);
      setHasResult(true);
      setRecentScans((prev) => [
        { url: urlInput, risk: 78, type: "Phishing", date: "Just now" },
        ...prev
      ]);
    }
    return () => clearTimeout(timer);
  }, [isScanning, scanStep, urlInput]);

  const handleScanStart = (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput) return;
    setIsScanning(true);
    setScanStep(0);
    setHasResult(false);
  };

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: "URL Analyzer" }]} />
      
      <PageHeader 
        title="URL Threat Analyzer" 
        description="Analyze suspicious domains using multi-engine lookup databases, domain metadata, and AI heuristic scoring."
      />

      {/* URL Input Form */}
      <Card className="border-border bg-card/65 cyber-glow-border">
        <CardContent className="pt-6">
          <form onSubmit={handleScanStart} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground/60" />
              <Input
                type="text"
                placeholder="https://suspect-site-verification.xyz/login"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                className="pl-10 h-10 bg-accent/20 border-border text-sm focus-visible:ring-primary"
                disabled={isScanning}
              />
            </div>
            <Button type="submit" size="lg" className="h-10 px-6 font-medium shadow-md" disabled={isScanning || !urlInput}>
              {isScanning ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing Threat...
                </>
              ) : (
                "Scan Domain"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Recent URL Scans list (visible when idle) */}
      {!hasResult && !isScanning && (
        <Card className="border-border bg-card/65 cyber-glow-border">
          <CardHeader>
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" /> Recent URL Threats Analyzed
            </CardTitle>
            <CardDescription className="text-xs">History logs of threat assessments ran by this console.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border pb-2 text-muted-foreground font-semibold">
                    <th className="py-2">Scanned Host URL</th>
                    <th className="py-2">Classification</th>
                    <th className="py-2">Heuristic Risk</th>
                    <th className="py-2">Triage Time</th>
                    <th className="py-2 text-right">Quick Scan</th>
                  </tr>
                </thead>
                <tbody>
                  {recentScans.map((scan, i) => (
                    <tr key={i} className="border-b border-border/40 hover:bg-accent/5 transition-colors">
                      <td className="py-3 font-mono font-medium max-w-[250px] truncate">{scan.url}</td>
                      <td className="py-3">
                        <span className={cn(
                          "px-2 py-0.5 rounded text-[10px] font-semibold uppercase",
                          scan.risk >= 70 ? "bg-destructive/10 text-destructive border border-destructive/20" :
                          scan.risk >= 40 ? "bg-amber-500/10 text-amber-500 border border-amber-500/20" :
                          "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                        )}>
                          {scan.risk >= 70 ? "Dangerous" : scan.risk >= 40 ? "Suspicious" : "Safe"}
                        </span>
                      </td>
                      <td className="py-3 font-semibold">{scan.risk}%</td>
                      <td className="py-3 text-muted-foreground">{scan.date}</td>
                      <td className="py-3 text-right">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-7 px-2 text-[10px] font-medium"
                          onClick={() => {
                            setUrlInput(scan.url);
                            setIsScanning(true);
                            setScanStep(0);
                            setHasResult(false);
                          }}
                        >
                          Recheck
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading Heuristics Logs */}
      <AnimatePresence>
        {isScanning && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
          >
            <Card className="border-border bg-card/65 p-6 cyber-glow-border">
              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold text-primary">Scanning threat vectors...</span>
                  <span className="text-xs text-muted-foreground">{Math.min(Math.round((scanStep / scanPhases.length) * 100), 100)}%</span>
                </div>
                <div className="w-full bg-accent/30 h-2 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary rounded-full transition-all duration-300" 
                    style={{ width: `${Math.min((scanStep / scanPhases.length) * 100, 100)}%` }}
                  />
                </div>
                <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
                  <Terminal className="h-4.5 w-4.5 text-primary shrink-0" />
                  <span className="animate-pulse">{scanPhases[scanStep] || "Completing analysis..."}</span>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SCAN RESULTS WORKSPACE */}
      <AnimatePresence>
        {hasResult && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Summary Top Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Risk Meter Card */}
              <Card className="lg:col-span-1 border-border bg-card/65 flex flex-col justify-between cyber-glow-border">
                <CardHeader>
                  <CardTitle className="text-base font-semibold">Triage Risk Level</CardTitle>
                  <CardDescription className="text-xs">Consolidated heuristics classification</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center pb-6">
                  <div className="relative flex items-center justify-center h-40 w-40">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="40" stroke="var(--border)" strokeWidth="6" fill="transparent" />
                      <circle 
                        cx="50" 
                        cy="50" 
                        r="40" 
                        stroke="oklch(0.58 0.22 28)" /* Threat Red */
                        strokeWidth="6" 
                        fill="transparent" 
                        strokeDasharray="251.2" 
                        strokeDashoffset="62.8" /* 75% Risk */
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute flex flex-col items-center justify-center">
                      <span className="text-3xl font-extrabold tracking-tight text-destructive">78</span>
                      <span className="text-[10px] font-semibold text-destructive uppercase tracking-widest mt-1">High Risk</span>
                    </div>
                  </div>
                  <div className="text-center text-xs text-muted-foreground px-4 mt-2">
                    Domain matches multiple signatures associated with active credentials harvesting operations.
                  </div>
                </CardContent>
              </Card>

              {/* Database Flags Card */}
              <Card className="lg:col-span-2 border-border bg-card/65 flex flex-col justify-between cyber-glow-border">
                <CardHeader>
                  <CardTitle className="text-base font-semibold">Engine Threat Databases</CardTitle>
                  <CardDescription className="text-xs">Database audit reports from third-party lookup APIs</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 pb-6">
                  {/* Google Safe Browsing */}
                  <div className="flex items-center justify-between p-3 rounded-md bg-destructive/10 border border-destructive/20">
                    <div className="flex items-center gap-3">
                      <Globe className="h-5 w-5 text-destructive" />
                      <div>
                        <div className="text-xs font-bold">Google Safe Browsing</div>
                        <div className="text-[10px] text-muted-foreground">URL classification status</div>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded bg-destructive/20 text-destructive text-[10px] font-semibold uppercase">Flagged: Deceptive</span>
                  </div>

                  {/* VirusTotal */}
                  <div className="flex items-center justify-between p-3 rounded-md bg-destructive/10 border border-destructive/20">
                    <div className="flex items-center gap-3">
                      <FileSearch className="h-5 w-5 text-destructive" />
                      <div>
                        <div className="text-xs font-bold">VirusTotal Logs</div>
                        <div className="text-[10px] text-muted-foreground">Detection ratio matching signatures</div>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded bg-destructive/20 text-destructive text-[10px] font-semibold uppercase">24 / 82 Flagged</span>
                  </div>

                  {/* Safe SSL */}
                  <div className="flex items-center justify-between p-3 rounded-md bg-emerald-500/10 border border-emerald-500/20">
                    <div className="flex items-center gap-3">
                      <Lock className="h-5 w-5 text-emerald-500" />
                      <div>
                        <div className="text-xs font-bold">SSL Certificate</div>
                        <div className="text-[10px] text-muted-foreground">TLS protocol verification</div>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-500 text-[10px] font-semibold uppercase">Valid: Let&apos;s Encrypt</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* WHOIS & Host Details Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* WHOIS Information */}
              <Card className="border-border bg-card/65 cyber-glow-border">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <Clock className="h-4.5 w-4.5 text-primary" /> Registry WHOIS Records
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2.5 text-xs">
                  <div className="flex justify-between border-b border-border/40 pb-2">
                    <span className="text-muted-foreground">Domain Age</span>
                    <span className="font-semibold text-destructive">14 Days old (High Risk)</span>
                  </div>
                  <div className="flex justify-between border-b border-border/40 pb-2">
                    <span className="text-muted-foreground">Registrar</span>
                    <span className="font-semibold">NameCheap Inc.</span>
                  </div>
                  <div className="flex justify-between border-b border-border/40 pb-2">
                    <span className="text-muted-foreground">Creation Date</span>
                    <span className="font-semibold">2026-07-06 14:20:00 UTC</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Expiry Date</span>
                    <span className="font-semibold">2027-07-06 14:20:00 UTC</span>
                  </div>
                </CardContent>
              </Card>

              {/* Host Domain Details */}
              <Card className="border-border bg-card/65 cyber-glow-border">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <Server className="h-4.5 w-4.5 text-primary" /> Server DNS details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2.5 text-xs">
                  <div className="flex justify-between border-b border-border/40 pb-2">
                    <span className="text-muted-foreground">Resolved Host IP</span>
                    <span className="font-semibold">194.58.112.4</span>
                  </div>
                  <div className="flex justify-between border-b border-border/40 pb-2">
                    <span className="text-muted-foreground">Server Location</span>
                    <span className="font-semibold">Russia (RU)</span>
                  </div>
                  <div className="flex justify-between border-b border-border/40 pb-2">
                    <span className="text-muted-foreground">Hosting Provider</span>
                    <span className="font-semibold">Reg.ru VPS Networks</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">HTTP Response Code</span>
                    <span className="font-semibold">200 OK</span>
                  </div>
                </CardContent>
              </Card>

              {/* Threat Vector Timeline */}
              <Card className="border-border bg-card/65 cyber-glow-border">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <Activity className="h-4.5 w-4.5 text-primary" /> Threat Vector Timeline
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3.5 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-[1px] before:bg-border pl-7 text-[11px]">
                  {[
                    { date: "Jul 06, 2026", desc: "Domain registered on NameCheap TLD registry.", active: true },
                    { date: "Jul 12, 2026", desc: "Phishing signature query reported on VirusTotal.", active: true },
                    { date: "Jul 18, 2026", desc: "Blacklisted by Google Safe Browsing heuristics.", active: true },
                    { date: "Jul 20, 2026", desc: "Heuristics score evaluated by CyberGuard AI console.", active: false }
                  ].map((evt, idx) => (
                    <div key={idx} className="relative space-y-0.5">
                      <div className={cn(
                        "absolute -left-[20px] top-1.5 h-1.5 w-1.5 rounded-full border border-card",
                        evt.active ? "bg-destructive animate-pulse" : "bg-primary"
                      )} />
                      <div className="font-semibold text-muted-foreground">{evt.date}</div>
                      <p className="text-[10px] text-foreground leading-snug">{evt.desc}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* AI Explanation & Recommendations */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* AI Explanation */}
              <Card className="lg:col-span-2 border-border bg-card/65 cyber-glow-border">
                <CardHeader>
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <Brain className="h-4.5 w-4.5 text-primary" /> AI Diagnostic Synthesis
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-xs leading-relaxed">
                  <p>
                    The domain name <strong>{urlInput}</strong> mimics standard login structures but displays multiple critical warning flags associated with phishing operations:
                  </p>
                  <p className="text-muted-foreground bg-accent/15 p-3 rounded border border-border/40">
                    &ldquo;Heuristic scans indicate this domain was registered only 14 days ago. The host server is located in Russia (Reg.ru) and the TLD (.xyz) is heavily utilized by threat actors. Additionally, Google Safe Browsing and 24 security engines on VirusTotal have actively flagged the domain due to social engineering behaviors.&rdquo;
                  </p>
                  <p>
                    <strong>Diagnostic Conclusion:</strong> High risk of active credentials harvesting. Do not type any login parameters or security pins.
                  </p>
                </CardContent>
              </Card>

              {/* Security Recommendations */}
              <Card className="lg:col-span-1 border-border bg-card/65 cyber-glow-border">
                <CardHeader>
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <ListChecks className="h-4.5 w-4.5 text-primary" /> Action blueprints
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3.5 text-xs">
                  {[
                    { label: "Do not input credentials", type: "error" },
                    { label: "Block host IP at gateway firewalls", type: "warn" },
                    { label: "Report domain to NameCheap abuse desk", type: "info" },
                    { label: "Flush local DNS cache databases", type: "success" }
                  ].map((rec, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <CheckCircle className={cn(
                        "h-4 w-4 shrink-0 mt-0.5",
                        rec.type === "error" && "text-destructive",
                        rec.type === "warn" && "text-amber-500",
                        rec.type === "info" && "text-primary",
                        rec.type === "success" && "text-emerald-500"
                      )} />
                      <span className="text-muted-foreground">{rec.label}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
