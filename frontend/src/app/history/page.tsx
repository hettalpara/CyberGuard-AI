"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { 
  Search, 
  Eye, 
  Trash2, 
  ShieldAlert, 
  ShieldCheck, 
  RefreshCw, 
  AlertCircle,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Shield,
  FileQuestion
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { RiskBadge, normalizeRiskLevel } from "@/components/common/risk-badge";
import { RiskMeter } from "@/components/common/risk-meter";
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
  const [totalCount, setTotalCount] = useState(0);
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
          setTotalCount(res.data.pagination.total || (res.data.data || []).length);
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

  // Client-side filtering of current page records
  const filteredScans = scans
    .filter((scan) => {
      const matchesSearch =
        !searchTerm.trim() ||
        scan.url.toLowerCase().includes(searchTerm.toLowerCase()) ||
        scan.domain?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        scan.id?.toLowerCase().includes(searchTerm.toLowerCase());

      const normLevel = normalizeRiskLevel(scan.risk?.level || scan.riskLevel || "SAFE");
      const matchesRisk =
        riskFilter === "ALL" ||
        (riskFilter === "THREATS" && (normLevel === "HIGH" || normLevel === "CRITICAL")) ||
        (riskFilter === "SAFE" && normLevel === "SAFE") ||
        (riskFilter === "MODERATE" && (normLevel === "MODERATE" || normLevel === "LOW"));

      return matchesSearch && matchesRisk;
    })
    .sort((a, b) => {
      const dateA = new Date(a.scannedAt || a.createdAt || 0).getTime();
      const dateB = new Date(b.scannedAt || b.createdAt || 0).getTime();
      return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
    });

  return (
    <ProtectedRoute>
      <div className="min-h-screen flex flex-col lg:flex-row bg-slate-50 dark:bg-[#0B0F19]">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <Header />
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
            
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 font-mono font-bold text-[10px] rounded border border-emerald-300 dark:border-emerald-800">
                    HISTORICAL LOG
                  </span>
                  <span className="text-[11px] font-mono text-slate-500">
                    {totalCount} Total Investigations
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-mono font-black text-slate-900 dark:text-slate-100 tracking-tight">
                  Scan History
                </h1>
                <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
                  Authoritative record of URL analyses, threat scores, confidence metrics, and intelligence provider findings.
                </p>
              </div>

              <div className="flex items-center gap-2.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchHistory}
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
                    <Search className="w-3.5 h-3.5" />
                    <span>Run New Scan</span>
                  </Button>
                </Link>
              </div>
            </div>

            {/* Error banner */}
            {error && (
              <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 flex items-center justify-between font-mono text-xs text-red-700 dark:text-red-400">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                  <span>{error}</span>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={fetchHistory}
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
                    placeholder="Search by URL, domain, or ID..."
                    className="pl-9 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 h-9 text-xs font-mono rounded-lg"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end font-mono text-xs">
                  {/* Risk filter buttons */}
                  <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 p-0.5 rounded-lg border border-slate-200 dark:border-slate-800">
                    <button
                      onClick={() => setRiskFilter("ALL")}
                      className={`px-2.5 py-1 rounded-md text-xs font-semibold transition ${
                        riskFilter === "ALL"
                          ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-xs"
                          : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                      }`}
                    >
                      All
                    </button>
                    <button
                      onClick={() => setRiskFilter("THREATS")}
                      className={`px-2.5 py-1 rounded-md text-xs font-semibold transition ${
                        riskFilter === "THREATS"
                          ? "bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-400 shadow-xs"
                          : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                      }`}
                    >
                      Threats
                    </button>
                    <button
                      onClick={() => setRiskFilter("MODERATE")}
                      className={`px-2.5 py-1 rounded-md text-xs font-semibold transition ${
                        riskFilter === "MODERATE"
                          ? "bg-orange-50 text-orange-700 dark:bg-orange-950/60 dark:text-orange-400 shadow-xs"
                          : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                      }`}
                    >
                      Moderate
                    </button>
                    <button
                      onClick={() => setRiskFilter("SAFE")}
                      className={`px-2.5 py-1 rounded-md text-xs font-semibold transition ${
                        riskFilter === "SAFE"
                          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 shadow-xs"
                          : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                      }`}
                    >
                      Clean
                    </button>
                  </div>

                  {/* Sort order toggle */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSortOrder(sortOrder === "desc" ? "asc" : "desc")}
                    className="h-8 text-xs font-mono border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300"
                  >
                    Sort: {sortOrder === "desc" ? "Newest First" : "Oldest First"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Scan History Table */}
            <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] shadow-sm overflow-hidden">
              <CardContent className="p-0">
                {loading ? (
                  <div className="p-12 flex flex-col items-center justify-center text-slate-400 font-mono text-xs">
                    <RefreshCw className="w-6 h-6 animate-spin text-emerald-600 mb-2" />
                    <span>Loading scan records...</span>
                  </div>
                ) : scans.length === 0 ? (
                  <div className="py-16 px-4 text-center max-w-md mx-auto">
                    <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-3">
                      <FileQuestion className="w-6 h-6" />
                    </div>
                    <h3 className="text-sm font-mono font-bold text-slate-900 dark:text-slate-100 mb-1">
                      No scans recorded yet
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
                      Analyze your first URL to begin logging threat evaluations and forensic records.
                    </p>
                    <Link href="/analyzer">
                      <Button className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-mono rounded-lg px-4">
                        Analyze URL
                      </Button>
                    </Link>
                  </div>
                ) : filteredScans.length === 0 ? (
                  <div className="py-12 px-4 text-center max-w-sm mx-auto font-mono text-xs text-slate-500">
                    <p>No scan records matched your filter criteria.</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSearchTerm("");
                        setRiskFilter("ALL");
                      }}
                      className="mt-3 text-xs border-slate-200 dark:border-slate-800"
                    >
                      Clear Filters
                    </Button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs font-mono">
                      <thead className="bg-slate-50/80 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 text-[11px]">
                        <tr>
                          <th className="px-4 py-3">Scan ID</th>
                          <th className="px-4 py-3">URL</th>
                          <th className="px-4 py-3">Risk Score</th>
                          <th className="px-4 py-3">Risk Level</th>
                          <th className="px-4 py-3">Confidence</th>
                          <th className="px-4 py-3">Date</th>
                          <th className="px-4 py-3">Status</th>
                          <th className="px-4 py-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                        {filteredScans.map((scan) => {
                          const level = (scan.risk?.level || scan.riskLevel || "SAFE") as string;
                          const score = scan.riskScore ?? scan.risk?.score ?? 0;
                          const confidence = scan.confidence ?? scan.risk?.confidence ?? 0;
                          const isThreat = normalizeRiskLevel(level) === "HIGH" || normalizeRiskLevel(level) === "CRITICAL";
                          const scanId = scan.id || (scan as any)._id || "";
                          const shortId = scanId ? `SCN-${scanId.slice(-6).toUpperCase()}` : "SCN-N/A";
                          const rawDate = scan.scannedAt || scan.createdAt;
                          const dateStr = rawDate ? new Date(rawDate).toLocaleString() : "N/A";

                          return (
                            <tr
                              key={scanId}
                              className="hover:bg-slate-50/80 dark:hover:bg-slate-900/60 transition-colors"
                            >
                              {/* Scan ID */}
                              <td className="px-4 py-3.5 font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                                {shortId}
                              </td>

                              {/* URL */}
                              <td className="px-4 py-3.5 max-w-[240px]">
                                <div className="font-bold text-slate-900 dark:text-slate-100 truncate" title={scan.url}>
                                  {scan.url}
                                </div>
                                <div className="text-[10px] text-slate-400 truncate">
                                  {scan.domain || "Web URL"}
                                </div>
                              </td>

                              {/* Risk Score */}
                              <td className="px-4 py-3.5">
                                <RiskMeter score={score} threatLevel={level} size="sm" showBadge={false} />
                              </td>

                              {/* Risk Level */}
                              <td className="px-4 py-3.5">
                                <RiskBadge level={level} size="sm" />
                              </td>

                              {/* Confidence */}
                              <td className="px-4 py-3.5">
                                <span className="font-semibold text-slate-700 dark:text-slate-300">
                                  {confidence}%
                                </span>
                              </td>

                              {/* Date */}
                              <td className="px-4 py-3.5 text-slate-500 text-[11px] whitespace-nowrap">
                                <span className="flex items-center gap-1.5">
                                  <Calendar className="w-3 h-3 text-slate-400" />
                                  {dateStr}
                                </span>
                              </td>

                              {/* Status */}
                              <td className="px-4 py-3.5">
                                <span
                                  className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded border uppercase ${
                                    isThreat
                                      ? "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900"
                                      : "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900"
                                  }`}
                                >
                                  {isThreat ? (
                                    <>
                                      <ShieldAlert className="w-3 h-3 text-red-600" /> THREAT
                                    </>
                                  ) : (
                                    <>
                                      <ShieldCheck className="w-3 h-3 text-emerald-600" /> CLEAN
                                    </>
                                  )}
                                </span>
                              </td>

                              {/* Actions */}
                              <td className="px-4 py-3.5 text-right whitespace-nowrap">
                                <Link href={`/analyzer?url=${encodeURIComponent(scan.url)}`}>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-7 text-xs font-mono border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg px-2.5 inline-flex items-center gap-1"
                                    title="View full security analysis"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                    <span>View</span>
                                  </Button>
                                </Link>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between font-mono text-xs">
                    <span className="text-slate-500">
                      Page {page} of {totalPages}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={page <= 1 || loading}
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        className="h-8 px-2.5 text-xs border-slate-200 dark:border-slate-800"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" /> Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={page >= totalPages || loading}
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        className="h-8 px-2.5 text-xs border-slate-200 dark:border-slate-800"
                      >
                        Next <ChevronRight className="w-3.5 h-3.5" />
                      </Button>
                    </div>
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
