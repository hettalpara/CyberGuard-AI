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
  Loader2, 
  Calendar
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RiskMeter } from "@/components/common/risk-meter";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { reportService } from "@/services/report.service";
import { IncidentReport } from "@/types/api";
import { ReportFilters, ReportStatusBadge, type StatusFilter } from "@/components/reports";

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
    }, 300);
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
      <div className="min-h-screen flex flex-col lg:flex-row bg-[#F8FAFC]">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <Header />
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto w-full">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
              <div>
                <h1 className="text-3xl font-extrabold text-[#1F2937] tracking-tight">Incident Reports</h1>
                <p className="text-slate-500 text-xs sm:text-sm mt-1">
                  Manage official cybersecurity incident records, view multi-engine forensics, and export court-ready PDF documents.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Link href="/analyzer">
                  <Button className="bg-[#10B981] hover:bg-[#059669] text-white px-5 h-10 rounded-xl font-semibold text-xs flex items-center gap-2 shadow-sm">
                    <Plus className="w-4 h-4" /> New Incident Report
                  </Button>
                </Link>
              </div>
            </div>

            {/* Error Alert */}
            {error && (
              <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
                <Button variant="outline" size="sm" onClick={fetchReports} className="text-xs h-7 border-red-300 hover:bg-red-100">
                  Retry
                </Button>
              </div>
            )}

            {/* Filters and Search Bar */}
            <ReportFilters
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              statusFilter={statusFilter}
              onStatusFilterChange={setStatusFilter}
            />

            {/* Table / Content */}
            <Card className="border-[#E5E7EB] bg-white shadow-sm overflow-hidden mb-6">
              <CardContent className="p-0">
                {loading ? (
                  <div className="py-20 flex flex-col items-center justify-center text-slate-400">
                    <Loader2 className="w-8 h-8 animate-spin text-[#10B981] mb-2" />
                    <p className="text-xs">Loading incident records...</p>
                  </div>
                ) : reports.length === 0 ? (
                  <div className="py-16 px-4 text-center max-w-md mx-auto">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#10B981] flex items-center justify-center mx-auto mb-3">
                      <FileText className="w-6 h-6" />
                    </div>
                    <h3 className="text-sm font-bold text-[#1F2937] mb-1">No Incident Reports Found</h3>
                    <p className="text-xs text-slate-500 mb-6">
                      {searchTerm || statusFilter !== "ALL"
                        ? "No reports matched your search filters. Try clearing your search."
                        : "You haven't generated any incident reports yet. Analyze a suspicious URL in the Analyzer and click 'Create Incident Report' to file an official report."}
                    </p>
                    <Link href="/analyzer">
                      <Button className="bg-[#10B981] hover:bg-[#059669] text-white text-xs rounded-xl px-5">
                        Analyze a URL to Get Started
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-700">
                      <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-[#E5E7EB]">
                        <tr>
                          <th className="px-5 py-3.5">Report ID</th>
                          <th className="px-5 py-3.5">Incident Details</th>
                          <th className="px-5 py-3.5">Threat Level</th>
                          <th className="px-5 py-3.5">Status</th>
                          <th className="px-5 py-3.5">Date</th>
                          <th className="px-5 py-3.5 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E5E7EB]">
                        {reports.map((report) => (
                          <tr key={report._id} className="hover:bg-slate-50 transition group">
                            {/* Report ID */}
                            <td className="px-5 py-4">
                              <Link 
                                href={`/reports/${report._id}`}
                                className="font-mono font-bold text-slate-900 hover:text-[#10B981] transition flex items-center gap-1.5"
                              >
                                {report.reportId}
                              </Link>
                              <span className="inline-block mt-1 text-[10px] uppercase font-bold tracking-wider text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                                {report.incidentType.replace("_", " ")}
                              </span>
                            </td>

                            {/* Details: Title & URL */}
                            <td className="px-5 py-4 max-w-xs">
                              <div className="font-semibold text-slate-900 truncate mb-1" title={report.title}>
                                {report.title}
                              </div>
                              <div className="font-mono text-[11px] text-slate-500 truncate flex items-center gap-1" title={report.snapshot.url}>
                                <span>{report.snapshot.url}</span>
                              </div>
                            </td>

                            {/* Threat Level */}
                            <td className="px-5 py-4">
                              <RiskMeter score={report.snapshot.riskScore} threatLevel={report.snapshot.riskLevel} size="sm" />
                            </td>

                            {/* Status */}
                            <td className="px-5 py-4">
                              <ReportStatusBadge status={report.status} />
                            </td>

                            {/* Date */}
                            <td className="px-5 py-4 text-slate-500 font-medium">
                              <div className="flex items-center gap-1 text-[11px]">
                                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                {new Date(report.incidentDate || report.createdAt).toLocaleDateString()}
                              </div>
                            </td>

                            {/* Actions */}
                            <td className="px-5 py-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <Link href={`/reports/${report._id}`}>
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-8 w-8 text-slate-600 hover:text-[#10B981] hover:bg-emerald-50 rounded-lg" 
                                    title="View Full Report"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                </Link>

                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-8 w-8 text-slate-600 hover:text-[#10B981] hover:bg-emerald-50 rounded-lg disabled:opacity-50" 
                                  title="Download Official PDF" 
                                  onClick={() => handleDownloadPdf(report)}
                                  disabled={downloadingId === report._id}
                                >
                                  {downloadingId === report._id ? (
                                    <Loader2 className="w-4 h-4 animate-spin text-[#10B981]" />
                                  ) : (
                                    <Download className="w-4 h-4" />
                                  )}
                                </Button>

                                {deleteConfirmId === report._id ? (
                                  <div className="flex items-center gap-1 ml-1 bg-red-50 p-1 rounded-lg border border-red-200">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 px-2 text-[10px] font-bold text-red-600 hover:bg-red-100 rounded"
                                      onClick={() => handleDelete(report._id)}
                                      disabled={deletingId === report._id}
                                    >
                                      {deletingId === report._id ? "..." : "Confirm"}
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 px-1.5 text-[10px] text-slate-500 hover:bg-slate-200 rounded"
                                      onClick={() => setDeleteConfirmId(null)}
                                    >
                                      Cancel
                                    </Button>
                                  </div>
                                ) : (
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-8 w-8 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg" 
                                    title="Delete Report" 
                                    onClick={() => setDeleteConfirmId(report._id)}
                                  >
                                    <Trash2 className="w-4 h-4" />
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
