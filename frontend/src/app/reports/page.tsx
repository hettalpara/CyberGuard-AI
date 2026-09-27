"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { 
  FileText, 
  Download, 
  Trash2, 
  Eye, 
  Plus, 
  AlertCircle, 
  RefreshCw, 
  Calendar,
  Search,
  ExternalLink,
  Shield,
  FileQuestion
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { RiskBadge } from "@/components/common/risk-badge";
import { RiskMeter } from "@/components/common/risk-meter";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { reportService } from "@/services/report.service";
import type { IncidentReport } from "@/types";
import { ReportStatusBadge, type StatusFilter } from "@/components/reports";

export default function ReportsPage() {
  const [reports, setReports] = useState<IncidentReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const filter = statusFilter === "ALL" ? undefined : statusFilter;
      const res = await reportService.getReports({
        status: filter,
        search: searchTerm || undefined,
      });
      setReports(res.data.data || []);
    } catch (err: unknown) {
      console.error("Failed to load reports:", err);
      setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Failed to load incident reports. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, searchTerm]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchReports();
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchReports]);

  const handleDownloadPdf = async (report: IncidentReport) => {
    try {
      setDownloadingId(report._id);
      await reportService.downloadReportPdf(report._id, `${report.reportId}.pdf`);
    } catch (err: unknown) {
      console.error("Failed to download PDF:", err);
      alert("Failed to download PDF report. Please try again.");
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setDeletingId(id);
      await reportService.deleteReport(id);
      setReports((prev) => prev.filter((r) => r._id !== id));
      setDeleteConfirmId(null);
    } catch (err: unknown) {
      console.error("Failed to delete report:", err);
      alert("Failed to delete report. Please try again.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen flex flex-col lg:flex-row bg-slate-50 dark:bg-[#0B0F19]">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <Header />
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
            
            {/* Top Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 font-mono font-bold text-[10px] rounded border border-emerald-300 dark:border-emerald-800">
                    FORENSIC EVIDENCE
                  </span>
                  <span className="text-[11px] font-mono text-slate-500">
                    Documented Incidents & Formal PDF Files
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-mono font-black text-slate-900 dark:text-slate-100 tracking-tight">
                  Incident Reports
                </h1>
                <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
                  Formal cybersecurity incident records, forensic evidence logs, and downloadable court-ready PDF documents.
                </p>
              </div>

              <div className="flex items-center gap-2.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchReports}
                  disabled={loading}
                  className="border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 h-9 px-3 rounded-lg text-xs font-mono flex items-center gap-1.5"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                  <span>Refresh</span>
                </Button>

                <Link href="/analyzer">
                  <Button
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white h-9 px-4 rounded-lg text-xs font-mono font-semibold flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>File Incident Report</span>
                  </Button>
                </Link>
              </div>
            </div>

            {/* Error Banner */}
            {error && (
              <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 flex items-center justify-between font-mono text-xs text-red-700 dark:text-red-400">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                  <span>{error}</span>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={fetchReports}
                  className="h-7 text-xs border-red-300 dark:border-red-800 text-red-700 dark:text-red-400"
                >
                  Retry
                </Button>
              </div>
            )}

            {/* Filter and Search Bar */}
            <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] shadow-sm">
              <CardContent className="p-4 flex flex-col md:flex-row items-center justify-between gap-3">
                <div className="relative w-full md:w-80">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <Input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by Report ID, title, or URL..."
                    className="pl-9 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 h-9 text-xs font-mono rounded-lg"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end font-mono text-xs">
                  <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 p-0.5 rounded-lg border border-slate-200 dark:border-slate-800">
                    <button
                      onClick={() => setStatusFilter("ALL")}
                      className={`px-2.5 py-1 rounded-md text-xs font-semibold transition ${
                        statusFilter === "ALL"
                          ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-xs"
                          : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                      }`}
                    >
                      All Statuses
                    </button>
                    <button
                      onClick={() => setStatusFilter("FINAL")}
                      className={`px-2.5 py-1 rounded-md text-xs font-semibold transition ${
                        statusFilter === "FINAL"
                          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 shadow-xs"
                          : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                      }`}
                    >
                      Final
                    </button>
                    <button
                      onClick={() => setStatusFilter("DRAFT")}
                      className={`px-2.5 py-1 rounded-md text-xs font-semibold transition ${
                        statusFilter === "DRAFT"
                          ? "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 shadow-xs"
                          : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                      }`}
                    >
                      Draft
                    </button>
                    <button
                      onClick={() => setStatusFilter("ARCHIVED")}
                      className={`px-2.5 py-1 rounded-md text-xs font-semibold transition ${
                        statusFilter === "ARCHIVED"
                          ? "bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 shadow-xs"
                          : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                      }`}
                    >
                      Archived
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Reports Table Card */}
            <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] shadow-sm overflow-hidden">
              <CardContent className="p-0">
                {loading ? (
                  <div className="p-12 flex flex-col items-center justify-center text-slate-400 font-mono text-xs">
                    <RefreshCw className="w-6 h-6 animate-spin text-emerald-600 mb-2" />
                    <span>Loading incident records...</span>
                  </div>
                ) : reports.length === 0 ? (
                  <div className="py-16 px-4 text-center max-w-md mx-auto">
                    <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-3">
                      <FileQuestion className="w-6 h-6" />
                    </div>
                    <h3 className="text-sm font-mono font-bold text-slate-900 dark:text-slate-100 mb-1">
                      No reports found
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
                      {searchTerm || statusFilter !== "ALL"
                        ? "No incident reports matched your current filter criteria."
                        : "Generated incident reports will appear here. Analyze a URL to document security findings."}
                    </p>
                    <Link href="/analyzer">
                      <Button className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-mono rounded-lg px-4">
                        Analyze URL to Get Started
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs font-mono">
                      <thead className="bg-slate-50/80 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 text-[11px]">
                        <tr>
                          <th className="px-4 py-3">Report ID</th>
                          <th className="px-4 py-3">Incident URL & Title</th>
                          <th className="px-4 py-3">Risk Score</th>
                          <th className="px-4 py-3">Risk Level</th>
                          <th className="px-4 py-3">Status</th>
                          <th className="px-4 py-3">Created</th>
                          <th className="px-4 py-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                        {reports.map((report) => (
                          <tr
                            key={report._id}
                            className="hover:bg-slate-50/80 dark:hover:bg-slate-900/60 transition-colors"
                          >
                            {/* Report ID */}
                            <td className="px-4 py-3.5 whitespace-nowrap">
                              <Link
                                href={`/reports/${report._id}`}
                                className="font-bold text-slate-900 dark:text-slate-100 hover:text-emerald-600 dark:hover:text-emerald-400 transition"
                              >
                                {report.reportId}
                              </Link>
                              <div className="text-[10px] text-slate-400 uppercase tracking-wider mt-0.5">
                                {report.incidentType.replace(/_/g, " ")}
                              </div>
                            </td>

                            {/* Details: Title & URL */}
                            <td className="px-4 py-3.5 max-w-[260px]">
                              <div className="font-bold text-slate-800 dark:text-slate-200 truncate" title={report.title}>
                                {report.title}
                              </div>
                              <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate flex items-center gap-1 font-mono" title={report.snapshot?.url}>
                                <span>{report.snapshot?.url || "N/A"}</span>
                              </div>
                            </td>

                            {/* Risk Score */}
                            <td className="px-4 py-3.5">
                              <RiskMeter
                                score={report.snapshot?.riskScore ?? null}
                                threatLevel={report.snapshot?.riskLevel || "SAFE"}
                                size="sm"
                                showBadge={false}
                              />
                            </td>

                            {/* Risk Level */}
                            <td className="px-4 py-3.5">
                              <RiskBadge
                                level={report.snapshot?.riskLevel || "SAFE"}
                                size="sm"
                              />
                            </td>

                            {/* Status */}
                            <td className="px-4 py-3.5 whitespace-nowrap">
                              <ReportStatusBadge status={report.status} />
                            </td>

                            {/* Created */}
                            <td className="px-4 py-3.5 text-slate-500 whitespace-nowrap text-[11px]">
                              <span className="flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                {new Date(report.incidentDate || report.createdAt).toLocaleDateString()}
                              </span>
                            </td>

                            {/* Actions: View, Download PDF, Delete with Confirm Dialog */}
                            <td className="px-4 py-3.5 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-1">
                                <Link href={`/reports/${report._id}`}>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                                    title="View Full Report"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                  </Button>
                                </Link>

                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDownloadPdf(report)}
                                  disabled={downloadingId === report._id}
                                  className="h-8 w-8 text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg"
                                  title="Download Official PDF"
                                >
                                  {downloadingId === report._id ? (
                                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                                  ) : (
                                    <Download className="w-3.5 h-3.5" />
                                  )}
                                </Button>

                                {deleteConfirmId === report._id ? (
                                  <div className="flex items-center gap-1 bg-red-50 dark:bg-red-950/60 p-0.5 rounded-lg border border-red-300 dark:border-red-800">
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => handleDelete(report._id)}
                                      disabled={deletingId === report._id}
                                      className="h-6 px-1.5 text-[10px] font-bold text-red-700 dark:text-red-300 hover:bg-red-100 rounded"
                                    >
                                      {deletingId === report._id ? "..." : "Delete"}
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => setDeleteConfirmId(null)}
                                      className="h-6 px-1 text-[10px] text-slate-500 hover:bg-slate-200 rounded"
                                    >
                                      Cancel
                                    </Button>
                                  </div>
                                ) : (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setDeleteConfirmId(report._id)}
                                    className="h-8 w-8 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg"
                                    title="Delete Report"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </Button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
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
