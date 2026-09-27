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
  Search,
  ExternalLink
} from "lucide-react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { reportService } from "@/services/report.service";
import type { IncidentReport } from "@/types";

export default function ReportsPage() {
  const [reports, setReports] = useState<IncidentReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

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
      setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Failed to load incident reports.");
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
      await reportService.downloadReportPdf(report._id, `CyberGuard-Report-${report.reportId || report._id}.pdf`);
    } catch (err) {
      console.error("Failed to download PDF:", err);
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <ProtectedRoute>
      <div className="app-cg">
        <Sidebar />
        <div className="main-cg">
          <Header />
          <main className="content-cg">
            
            {/* Page Title */}
            <div className="page-title-cg">
              <div>
                <h1>Incident Reports</h1>
                <p>Manage structured security reports generated from URL investigations.</p>
              </div>
              <Link href="/analyzer" className="btn-cg primary">
                New Analysis
              </Link>
            </div>

            {error && (
              <div className="notice-cg" style={{ marginBottom: 14 }}>
                <AlertCircle size={14} style={{ verticalAlign: "middle", marginRight: 7 }} />
                {error}
              </div>
            )}

            {/* Reports Card */}
            <div className="card-cg">
              <div className="card-head-cg">
                <div>
                  <h3>Reports</h3>
                  <p>Saved incident documentation</p>
                </div>
                
                {/* Search & Filter */}
                <div className="quick-cg" style={{ alignItems: "center" }}>
                  <div className="search-cg" style={{ height: 32, width: 220 }}>
                    <Search size={14} />
                    <input
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search reports..."
                    />
                  </div>

                  <div style={{ display: "flex", gap: 5 }}>
                    {["ALL", "FINAL", "DRAFT", "ARCHIVED"].map((st) => (
                      <button
                        key={st}
                        onClick={() => setStatusFilter(st)}
                        className={`btn-cg ${statusFilter === st ? "primary" : ""}`}
                        style={{ padding: "4px 8px", fontSize: 10 }}
                      >
                        {st === "ALL" ? "All" : st}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Table */}
              <div style={{ overflowX: "auto" }}>
                {loading ? (
                  <div style={{ padding: 36, textAlign: "center", fontSize: 11, color: "var(--muted)" }}>
                    <RefreshCw size={16} className="animate-spin" style={{ margin: "0 auto 8px" }} />
                    Loading incident reports...
                  </div>
                ) : reports.length === 0 ? (
                  <div style={{ padding: 40, textAlign: "center", color: "var(--muted)", fontSize: 11 }}>
                    No incident reports found. Analyze a URL to generate a report.
                  </div>
                ) : (
                  <table className="table-cg">
                    <thead>
                      <tr>
                        <th>Report ID</th>
                        <th>URL</th>
                        <th>Risk</th>
                        <th>Status</th>
                        <th>Created</th>
                        <th style={{ textAlign: "right" }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reports.map((r) => {
                        const level = (r.snapshot?.riskLevel || "LOW").toUpperCase();
                        const score = r.snapshot?.riskScore ?? "N/A";
                        const url = r.snapshot?.url || r.snapshot?.normalizedUrl || r.title || "Target URL";
                        const dateStr = new Date(r.createdAt || Date.now()).toLocaleDateString();
                        const levelBadge =
                          level === "CRITICAL" || level === "HIGH" ? "red" :
                          level === "MODERATE" ? "amber" : "blue";

                        return (
                          <tr key={r._id}>
                            <td style={{ fontWeight: 600, fontFamily: "monospace" }}>
                              {r.reportId || r._id.slice(-8).toUpperCase()}
                            </td>
                            <td style={{ maxWidth: 220, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={url}>
                              {url}
                            </td>
                            <td style={{ fontWeight: 700 }}>
                              {score}
                            </td>
                            <td>
                              <span className={`badge-cg ${levelBadge}`}>{level}</span>
                            </td>
                            <td>
                              <span className="badge-cg blue">{r.status || "FINAL"}</span>
                            </td>
                            <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                              <div style={{ display: "inline-flex", gap: 6 }}>
                                <Link href={`/reports/${r._id}`} className="btn-cg" style={{ padding: "4px 8px" }}>
                                  <Eye size={12} />
                                  <span>View</span>
                                </Link>
                                <button
                                  onClick={() => handleDownloadPdf(r)}
                                  disabled={downloadingId === r._id}
                                  className="btn-cg success"
                                  style={{ padding: "4px 8px" }}
                                  title="Download PDF Report"
                                >
                                  <Download size={12} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
