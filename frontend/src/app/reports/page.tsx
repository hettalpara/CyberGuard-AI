"use client";

import React, { useState } from "react";
import Link from "next/link";
import { FileText, Download, Trash2, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { RiskMeter } from "@/components/common/risk-meter";
import { SearchBar } from "@/components/common/search-bar";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { generatePdfReport } from "@/utils/pdf-report-generator";

interface ReportItem {
  reportId: string;
  url: string;
  normalizedUrl: string;
  riskScore: number;
  threatLevel: "SAFE" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  status: "Completed" | "Flagged" | "Archived";
  date: string;
}

export default function ReportsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [reports, setReports] = useState<ReportItem[]>([
    { reportId: "RPT-202608-001", url: "https://sbi-verify-account.xyz/login", normalizedUrl: "https://sbi-verify-account.xyz/login", riskScore: 88, threatLevel: "HIGH", status: "Flagged", date: "2026-08-06" },
    { reportId: "RPT-202608-002", url: "https://github.com", normalizedUrl: "https://github.com", riskScore: 0, threatLevel: "SAFE", status: "Completed", date: "2026-08-06" },
    { reportId: "RPT-202608-003", url: "http://update-paypal-security.com", normalizedUrl: "http://update-paypal-security.com", riskScore: 92, threatLevel: "CRITICAL", status: "Flagged", date: "2026-08-05" },
    { reportId: "RPT-202608-004", url: "https://google.com", normalizedUrl: "https://google.com", riskScore: 5, threatLevel: "SAFE", status: "Completed", date: "2026-08-05" },
    { reportId: "RPT-202608-005", url: "http://free-giftcard-claim.net", normalizedUrl: "http://free-giftcard-claim.net", riskScore: 65, threatLevel: "MEDIUM", status: "Flagged", date: "2026-08-04" },
  ]);

  const handleDelete = (id: string) => {
    setReports(reports.filter((r) => r.reportId !== id));
  };

  const handleDownloadPdf = (report: ReportItem) => {
    generatePdfReport({
      reportId: report.reportId,
      url: report.url,
      normalizedUrl: report.normalizedUrl,
      riskScore: report.riskScore,
      threatLevel: report.threatLevel,
      ssl: { valid: report.riskScore < 50, issuer: report.riskScore < 50 ? "DigiCert Global Root CA" : "Untrusted Issuer", validDaysRemaining: 365 },
      whois: { registrar: report.riskScore < 50 ? "MarkMonitor Inc." : "NameCheap / Privately Protected", createdDate: "2026-01-01", domainAgeDays: report.riskScore < 50 ? 5000 : 5 },
      safeBrowsing: { match: report.riskScore >= 50, threatType: report.riskScore >= 50 ? "SOCIAL_ENGINEERING (Phishing)" : undefined },
      virusTotal: { detectionRatio: report.riskScore >= 50 ? "14 / 70" : "0 / 70", enginesFlagged: report.riskScore >= 50 ? 14 : 0, totalEngines: 70 },
      aiExplanation: report.riskScore >= 50 
        ? "Warning: High-risk phishing URL detected. Domain matches credentials harvesting patterns with recent WHOIS registration and flagged security engines." 
        : "Safe URL: Domain exhibits clean SSL certificates, long domain age, and zero malware database flags.",
      recommendedActions: report.riskScore >= 50 ? ["Do NOT open URL.", "Report link to helpline 1930.", "Rotate credentials."] : ["Domain verified clean."],
      timestamp: report.date
    });
  };

  const filteredReports = reports.filter(
    (r) => r.url.toLowerCase().includes(searchTerm.toLowerCase()) || r.reportId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <ProtectedRoute>
      <div className="min-h-screen flex flex-col lg:flex-row bg-[#F8FAFC]">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto w-full">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-extrabold text-[#1F2937] tracking-tight">Security Scan Reports</h1>
              <p className="text-slate-500 text-xs sm:text-sm mt-1">Search, view, download PDF, or manage AI-generated analysis reports.</p>
            </div>
            <Link href="/analyzer">
              <Button className="bg-[#10B981] hover:bg-[#059669] text-white px-5 h-10 rounded-xl font-semibold text-xs flex items-center gap-2">
                <FileText className="w-4 h-4" /> New URL Analysis
              </Button>
            </Link>
          </div>

          <Card className="border-[#E5E7EB] bg-white shadow-sm overflow-hidden">
            <CardHeader className="pb-4 border-b border-[#E5E7EB]">
              <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                <SearchBar value={searchTerm} onChange={setSearchTerm} placeholder="Search by Report ID or URL..." />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-[#E5E7EB]">
                    <tr>
                      <th className="px-4 py-3">Report ID</th>
                      <th className="px-4 py-3">URL</th>
                      <th className="px-4 py-3">Risk Assessment</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E7EB]">
                    {filteredReports.map((report) => (
                      <tr key={report.reportId} className="hover:bg-slate-50 transition">
                        <td className="px-4 py-3.5 font-mono font-bold text-[#1F2937]">{report.reportId}</td>
                        <td className="px-4 py-3.5 font-mono max-w-xs truncate text-slate-800 font-medium">{report.url}</td>
                        <td className="px-4 py-3.5">
                          <RiskMeter score={report.riskScore} threatLevel={report.threatLevel} size="sm" />
                        </td>
                        <td className="px-4 py-3.5">
                          <span className={`px-2 py-0.5 rounded-md text-[11px] font-semibold border ${
                            report.status === "Flagged" ? "bg-red-50 text-red-600 border-red-200" : "bg-emerald-50 text-emerald-600 border-emerald-200"
                          }`}>
                            {report.status}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-slate-500">{report.date}</td>
                        <td className="px-4 py-3.5 text-right space-x-1">
                          <Link href={`/analyzer?url=${encodeURIComponent(report.url)}`}>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-[#10B981]" title="View Analysis">
                              <Eye className="w-4 h-4" />
                            </Button>
                          </Link>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-[#10B981]" title="Download PDF Report" onClick={() => handleDownloadPdf(report)}>
                            <Download className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-red-600" title="Delete Report" onClick={() => handleDelete(report.reportId)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                    {filteredReports.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-slate-400 text-xs">
                          No analysis reports found matching your search.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
    </ProtectedRoute>
  );
}
