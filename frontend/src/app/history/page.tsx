"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { 
  Search, 
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  AlertCircle
} from "lucide-react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { analyzerService, type ScanResultData } from "@/services/analyzer.service";

export default function HistoryPage() {
  const [scans, setScans] = useState<ScanResultData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [riskFilter, setRiskFilter] = useState<string>("ALL");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await analyzerService.getScanHistory({ page, limit: 15 });
      if (res?.data && res.data.success) {
        setScans(res.data.data || []);
        if (res.data.pagination) {
          setTotalPages(res.data.pagination.pages || 1);
        }
      } else {
        setScans([]);
      }
    } catch (err: unknown) {
      console.error("Failed to load scan history:", err);
      setError("Unable to retrieve scan history from server. Please try again.");
      setScans([]);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const filteredScans = scans
    .filter((s) => {
      const matchesSearch =
        !searchTerm.trim() ||
        s.url.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.domain?.toLowerCase().includes(searchTerm.toLowerCase());

      const normLevel = (s.riskLevel || s.risk?.level || "SAFE").toUpperCase();
      const matchesRisk = riskFilter === "ALL" || normLevel === riskFilter;

      return matchesSearch && matchesRisk;
    })
    .sort((a, b) => {
      const dateA = new Date(a.scannedAt || a.createdAt || 0).getTime();
      const dateB = new Date(b.scannedAt || b.createdAt || 0).getTime();
      return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
    });

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
                <h1>Scan History</h1>
                <p>Review previous URL security analyses.</p>
              </div>
              <Link href="/analyzer" className="btn-cg primary">
                New Scan
              </Link>
            </div>

            {error && (
              <div className="notice-cg" style={{ marginBottom: 14 }}>
                <AlertCircle size={14} style={{ verticalAlign: "middle", marginRight: 7 }} />
                {error}
              </div>
            )}

            {/* Analysis History Card */}
            <div className="card-cg">
              <div className="card-head-cg">
                <div>
                  <h3>Analysis History</h3>
                  <p>Most recent investigations</p>
                </div>
                
                {/* Quick Filters */}
                <div className="quick-cg" style={{ alignItems: "center" }}>
                  <div style={{ display: "flex", gap: 6 }}>
                    {["ALL", "SAFE", "LOW", "MODERATE", "HIGH", "CRITICAL"].map((lvl) => (
                      <button
                        key={lvl}
                        onClick={() => setRiskFilter(lvl)}
                        className={`btn-cg ${riskFilter === lvl ? "primary" : ""}`}
                        style={{ padding: "5px 9px", fontSize: 10 }}
                      >
                        {lvl === "ALL" ? "All levels" : lvl}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => setSortOrder(sortOrder === "desc" ? "asc" : "desc")}
                    className="btn-cg"
                    style={{ padding: "5px 9px", fontSize: 10 }}
                  >
                    Sort: {sortOrder === "desc" ? "Recent" : "Oldest"}
                  </button>
                </div>
              </div>

              {/* Search Sub-bar */}
              <div style={{ padding: "10px 17px", borderBottom: "1px solid var(--line)" }}>
                <div className="search-cg" style={{ height: 32, maxWidth: 360 }}>
                  <Search size={14} />
                  <input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Filter by URL or hostname..."
                  />
                </div>
              </div>

              {/* Table */}
              <div style={{ overflowX: "auto" }}>
                {loading ? (
                  <div style={{ padding: 36, textAlign: "center", fontSize: 11, color: "var(--muted)" }}>
                    <RefreshCw size={16} className="animate-spin" style={{ margin: "0 auto 8px" }} />
                    Loading scan history...
                  </div>
                ) : filteredScans.length === 0 ? (
                  <div style={{ padding: 40, textAlign: "center", color: "var(--muted)", fontSize: 11 }}>
                    No scan records found matching query.
                  </div>
                ) : (
                  <table className="table-cg">
                    <thead>
                      <tr>
                        <th>URL</th>
                        <th>Score</th>
                        <th>Level</th>
                        <th>Confidence</th>
                        <th>Date</th>
                        <th style={{ textAlign: "right" }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredScans.map((r, i) => {
                        const score = r.riskScore ?? r.risk?.score ?? "N/A";
                        const level = (r.riskLevel || r.risk?.level || "SAFE").toUpperCase();
                        const conf = `${r.confidence ?? 80}%`;
                        const dateStr = new Date(r.scannedAt || r.createdAt || Date.now()).toLocaleDateString();
                        const badgeColor =
                          level === "SAFE" ? "green" :
                          level === "LOW" ? "blue" :
                          level === "MODERATE" ? "amber" : "red";

                        return (
                          <tr key={r.id || (r as any)._id || i}>
                            <td style={{ maxWidth: 280, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={r.url}>
                              {r.url}
                            </td>
                            <td style={{ fontWeight: 700 }}>{score}</td>
                            <td>
                              <span className={`badge-cg ${badgeColor}`}>{level}</span>
                            </td>
                            <td style={{ color: "var(--muted)" }}>{conf}</td>
                            <td style={{ color: "var(--muted)", whiteSpace: "nowrap" }}>{dateStr}</td>
                            <td style={{ textAlign: "right" }}>
                              <Link href={`/analyzer?url=${encodeURIComponent(r.url)}`} className="btn-cg" style={{ padding: "4px 9px", fontSize: 10 }}>
                                View
                              </Link>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 17px", borderTop: "1px solid var(--line)" }}>
                  <span style={{ fontSize: 10, color: "var(--muted)" }}>
                    Page {page} of {totalPages}
                  </span>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="btn-cg"
                      style={{ padding: "4px 8px" }}
                    >
                      <ChevronLeft size={12} />
                    </button>
                    <button
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="btn-cg"
                      style={{ padding: "4px 8px" }}
                    >
                      <ChevronRight size={12} />
                    </button>
                  </div>
                </div>
              )}
            </div>

          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
