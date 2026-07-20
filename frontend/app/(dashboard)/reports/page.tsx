"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FileText, 
  Search, 
  Filter, 
  Download, 
  Eye, 
  ShieldAlert, 
  CheckCircle, 
  Clock, 
  Archive,
  ChevronRight,
  Info,
  Calendar,
  Layers,
  Printer,
  ChevronDown
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { PageHeader, Breadcrumb } from "@/components/common";

// Mock Reports data
const initialReports = [
  {
    id: "CG-2026-981",
    title: "Phishing Harvester Incident Log",
    category: "Phishing",
    status: "generated",
    date: "Jul 20, 2026",
    size: "2.4 MB",
    agency: "FBI Cyber Division",
    analyst: "Security Analyst AD",
    desc: "An active credential harvesting portal targeting employee mail credentials. Payload hosted on suspect-site-verification.xyz was analyzed and threat signatures logged.",
    evidence: ["Resolved Host IP: 194.58.112.4", "WHOIS Age: 14 Days", "Deceptive Flagged: Google Safe Browsing"]
  },
  {
    id: "CG-2026-979",
    title: "DDoS Deflection Traffic Audit",
    category: "DDoS Attack",
    status: "submitted",
    date: "Jul 18, 2026",
    size: "4.1 MB",
    agency: "CISA Triage Cell",
    analyst: "Senior Analyst Jane Doe",
    desc: "Volumetric packet flooding detected originating from a coordinated botnet swarm. Latency peaked at 410ms before automatic mitigation routing deflection resolved the threat.",
    evidence: ["Attack Magnitude: 12.4 Gbps", "Botnet Swarm Target IP: 198.51.100.12", "Deflected Swarms: 1,420 IPs"]
  },
  {
    id: "CG-2026-974",
    title: "Unauthorized Credential Probe Log",
    category: "Credential Abuse",
    status: "archived",
    date: "Jul 15, 2026",
    size: "1.8 MB",
    agency: "Internal Security Audit",
    analyst: "Admin Ops",
    desc: "Brute-force login signatures identified on the public SSH gate. Attackers attempted multiple default credentials probes before permanent IP locking triggered.",
    evidence: ["Failed SSH Attempts: 340 times", "Locking Rule: Permanent IP block", "Source Country: Flagged anonymous VPN"]
  },
  {
    id: "CG-2026-963",
    title: "Ransomware Encryptor Payload Scan",
    category: "Ransomware",
    status: "draft",
    date: "Jul 10, 2026",
    size: "3.2 MB",
    agency: "State Cyber Incident Cell",
    analyst: "Forensic Analyst B",
    desc: "Suspicious binary file uploaded to storage share. Heuristics identified patterns matching locking algorithms. The payload was isolated immediately before encryption execution.",
    evidence: ["Detected Payload: locker-encrypter.exe", "Threat Metric: 98% Cryptor match", "System Action: Isolated snapshot"]
  }
];

export default function ReportsPage() {
  const [reports, setReports] = useState(initialReports);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [activeReport, setActiveReport] = useState<typeof initialReports[0] | null>(null);

  const handleDownload = (id: string) => {
    toast.success(`Dossier File ${id} downloaded successfully.`);
  };

  const handlePrint = (id: string) => {
    toast.success(`Report ${id} sent to secure print queue.`);
  };

  // Filter logic
  const filteredReports = reports.filter((rep) => {
    const matchesSearch = rep.title.toLowerCase().includes(searchQuery.toLowerCase()) || rep.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = selectedStatus === "all" || rep.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: "Reports" }]} />
      
      <PageHeader 
        title="Compliance Reports Vault" 
        description="Access, verify, and generate court-ready compliance dossiers for legal or agency incident reporting."
      />

      {/* Action Filters Panel */}
      <Card className="border-border bg-card/65 cyber-glow-border">
        <CardContent className="pt-6 flex flex-col md:flex-row gap-4 items-center justify-between">
          {/* Search bar */}
          <div className="relative w-full md:max-w-xs">
            <Search className="absolute left-3 top-2.5 h-4.5 w-4.5 text-muted-foreground/60" />
            <Input
              type="text"
              placeholder="Search by ID or Title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 bg-accent/20 border-border text-xs focus-visible:ring-primary"
            />
          </div>

          {/* Status Pills */}
          <div className="flex flex-wrap gap-2 w-full md:w-auto justify-start md:justify-end">
            {[
              { id: "all", label: "All Dossiers" },
              { id: "generated", label: "Generated" },
              { id: "submitted", label: "Submitted" },
              { id: "archived", label: "Archived" },
              { id: "draft", label: "Drafts" }
            ].map((btn) => (
              <button
                key={btn.id}
                onClick={() => setSelectedStatus(btn.id)}
                className={cn(
                  "text-[10px] font-semibold px-3 py-1.5 rounded transition-all border cursor-pointer",
                  selectedStatus === btn.id
                    ? "bg-primary text-primary-foreground border-primary/20"
                    : "bg-accent/20 text-muted-foreground border-border hover:text-foreground"
                )}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Reports Data Table */}
      <Card className="border-border bg-card/65 overflow-hidden cyber-glow-border">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-border/40 hover:bg-transparent">
              <TableHead className="w-[120px]">Report ID</TableHead>
              <TableHead>Dossier Name</TableHead>
              <TableHead>Attack Vector</TableHead>
              <TableHead>Filing Status</TableHead>
              <TableHead>Filing Date</TableHead>
              <TableHead>Size</TableHead>
              <TableHead className="text-right">Operations</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredReports.length > 0 ? (
              filteredReports.map((report) => (
                <TableRow key={report.id} className="border-b border-border/40 hover:bg-accent/5 transition-colors">
                  <TableCell className="font-semibold text-xs">{report.id}</TableCell>
                  <TableCell className="font-semibold text-xs max-w-[200px] truncate">{report.title}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{report.category}</TableCell>
                  <TableCell>
                    <Badge 
                      variant="outline"
                      className={cn(
                        "text-[9px] font-semibold tracking-wider uppercase px-2 py-0.5",
                        report.status === "generated" && "bg-emerald-500/10 text-emerald-500 border-emerald-500/25",
                        report.status === "submitted" && "bg-blue-500/10 text-blue-500 border-blue-500/25",
                        report.status === "archived" && "bg-muted text-muted-foreground border-border",
                        report.status === "draft" && "bg-amber-500/10 text-amber-500 border-amber-500/25"
                      )}
                    >
                      {report.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{report.date}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{report.size}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1.5">
                      {/* Dialog Trigger for Preview */}
                      <Dialog>
                        <DialogTrigger 
                          className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground h-8 w-8 text-muted-foreground hover:text-foreground cursor-pointer"
                          onClick={() => setActiveReport(report)}
                          aria-label="Preview Dossier"
                        >
                          <Eye className="h-4 w-4" />
                        </DialogTrigger>
                        
                        {activeReport && (
                          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
                            <DialogHeader>
                              <div className="flex items-center justify-between pr-6 border-b border-border pb-3">
                                <div className="flex items-center gap-2">
                                  <FileText className="h-5 w-5 text-primary" />
                                  <DialogTitle className="text-sm font-bold">{activeReport.id}: Compliance Document</DialogTitle>
                                </div>
                                <Badge 
                                  variant="outline"
                                  className={cn(
                                    "text-[9px] uppercase tracking-wider px-2.5 py-0.5",
                                    activeReport.status === "generated" && "bg-emerald-500/10 text-emerald-500 border-emerald-500/25",
                                    activeReport.status === "submitted" && "bg-blue-500/10 text-blue-500 border-blue-500/25",
                                    activeReport.status === "archived" && "bg-muted text-muted-foreground border-border",
                                    activeReport.status === "draft" && "bg-amber-500/10 text-amber-500 border-amber-500/25"
                                  )}
                                >
                                  {activeReport.status}
                                </Badge>
                              </div>
                            </DialogHeader>

                            {/* Dossier Visual Content */}
                            <div className="py-4 space-y-4 text-xs leading-relaxed font-sans">
                              {/* Metadata Grid */}
                              <div className="grid grid-cols-2 gap-4 bg-accent/15 p-4 rounded border border-border/40">
                                <div className="space-y-1.5">
                                  <div className="text-[10px] text-muted-foreground font-semibold">TARGET AGENCY</div>
                                  <div className="font-bold">{activeReport.agency}</div>
                                </div>
                                <div className="space-y-1.5">
                                  <div className="text-[10px] text-muted-foreground font-semibold">INVESTIGATOR ASSIGNED</div>
                                  <div className="font-bold">{activeReport.analyst}</div>
                                </div>
                                <div className="space-y-1.5 mt-2">
                                  <div className="text-[10px] text-muted-foreground font-semibold">CREATION DATE</div>
                                  <div className="font-bold">{activeReport.date}</div>
                                </div>
                                <div className="space-y-1.5 mt-2">
                                  <div className="text-[10px] text-muted-foreground font-semibold">THREAT CATEGORY</div>
                                  <div className="font-bold text-destructive">{activeReport.category}</div>
                                </div>
                              </div>

                              {/* Description Section */}
                              <div className="space-y-2">
                                <h4 className="font-bold text-sm border-b border-border/40 pb-1.5">I. Incident Executive Summary</h4>
                                <p className="text-muted-foreground">{activeReport.desc}</p>
                              </div>

                              {/* Evidence Section */}
                              <div className="space-y-2">
                                <h4 className="font-bold text-sm border-b border-border/40 pb-1.5">II. Forensic Evidence Registry Logs</h4>
                                <div className="space-y-2">
                                  {activeReport.evidence.map((ev, idx) => (
                                    <div key={idx} className="flex items-center gap-2 bg-card p-2.5 rounded border border-border/40 font-mono text-[10px]">
                                      <Info className="h-4 w-4 text-primary shrink-0" />
                                      <span>{ev}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>

                            {/* Dossier Footer Actions */}
                            <DialogFooter className="border-t border-border pt-3 gap-2 flex-col sm:flex-row">
                              <Button variant="outline" size="sm" onClick={() => handlePrint(activeReport.id)}>
                                <Printer className="h-4 w-4 mr-1.5" /> Secure Print
                              </Button>
                              <Button size="sm" onClick={() => handleDownload(activeReport.id)}>
                                <Download className="h-4 w-4 mr-1.5" /> Download Dossier
                              </Button>
                              <DialogClose className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground h-9 px-3 text-muted-foreground hover:text-foreground cursor-pointer">
                                Close
                              </DialogClose>
                            </DialogFooter>
                          </DialogContent>
                        )}
                      </Dialog>

                      {/* Download Direct */}
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        onClick={() => handleDownload(report.id)}
                        aria-label="Download Dossier"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center text-xs text-muted-foreground">
                  No matching compliance dossiers identified in database vault.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
