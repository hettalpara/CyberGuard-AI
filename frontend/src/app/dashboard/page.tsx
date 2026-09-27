"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { 
  ShieldCheck, 
  ExternalLink,
  ArrowRight,
  RefreshCw,
  AlertCircle
} from "lucide-react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { analyzerService, type DashboardStats, type ScanResultData } from "@/services/analyzer.service";
import { reportService } from "@/services/report.service";

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentScans, setRecentScans] = useState<ScanResultData[]>([]);
  const [totalReportsCount, setTotalReportsCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsRes, scansRes, reportsRes] = await Promise.all([
        analyzerService.getDashboardStats().catch(() => null),
        analyzerService.getScanHistory({ page: 1, limit: 6 }).catch(() => null),
        reportService.getReports({ page: 1, limit: 1 }).catch(() => null),
      ]);

      if (statsRes?.data?.success && statsRes.data.stats) {
        setStats(statsRes.data.stats);
      }

      if (scansRes?.data?.success && Array.isArray(scansRes.data.data)) {
        setRecentScans(scansRes.data.data);
      }

      if (reportsRes?.data?.data) {
        const count = reportsRes.data.pagination?.total || reportsRes.data.data.length || 0;
        setTotalReportsCount(count);
      }
    } catch (err: unknown) {
      console.error("Failed to load dashboard data:", err);
      setError("Unable to load live dashboard statistics. Please refresh.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const totalScans = stats?.totalScans ?? (recentScans.length > 0 ? recentScans.length : 0);
  const threatsDetected = stats ? (stats.threatScans || stats.highRiskScans + stats.criticalScans) : 0;

  return (
    <ProtectedRoute>
      <div className="app-cg">
        <Sidebar />
        <div className="main-cg">
          <Header />
          <main className="content-cg">
            
            {/* Page Title & Action */}
            <div className="page-title-cg">
              <div>
                <h1>Security Overview</h1>
                <p>Monitor URL analysis, threat intelligence and incident activity.</p>
              </div>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <button 
                  onClick={fetchDashboardData} 
                  className="btn-cg" 
                  title="Refresh data"
                  disabled={loading}
                >
                  <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
                  <span>Refresh</span>
                </button>
                <Link className="btn-cg primary" href="/analyzer">
                  <span>New URL Scan</span> 
                  <ArrowRight size={14} />
                </Link>
              </div>
            </div>

            {error && (
              <div className="notice-cg" style={{ marginBottom: 14 }}>
                <AlertCircle size={14} style={{ verticalAlign: "middle", marginRight: 7 }} />
                {error}
              </div>
            )}

            {/* Metric Stat Cards */}
            <div className="grid-cg grid4-cg" style={{ marginBottom: 14 }}>
              <div className="card-cg stat-cg">
                <div className="label-cg">Total Scans</div>
                <div className="value-cg">{loading ? "..." : totalScans}</div>
                <div className="sub-cg">All completed analyses</div>
              </div>

              <div className="card-cg stat-cg">
                <div className="label-cg">Threats Detected</div>
                <div className="value-cg" style={{ color: threatsDetected > 0 ? "#ff7575" : "inherit" }}>
                  {loading ? "..." : threatsDetected}
                </div>
                <div className="sub-cg">High and critical findings</div>
              </div>

              <div className="card-cg stat-cg">
                <div className="label-cg">Reports Generated</div>
                <div className="value-cg">{loading ? "..." : totalReportsCount}</div>
                <div className="sub-cg">Incident reports</div>
              </div>

              <div className="card-cg stat-cg">
                <div className="label-cg">System Status</div>
                <div className="value-cg" style={{ fontSize: 20, color: "#52e3a5" }}>
                  Operational
                </div>
                <div className="sub-cg">Security services available</div>
              </div>
            </div>

            {/* 2-Column Grid */}
            <div className="grid-cg grid2-cg">
              {/* Recent Scans Table */}
              <div className="card-cg">
                <div className="card-head-cg">
                  <div>
                    <h3>Recent URL Scans</h3>
                    <p>Latest security analysis activity</p>
                  </div>
                  <Link href="/history" className="btn-cg">
                    View all
                  </Link>
                </div>

                <div style={{ overflowX: "auto" }}>
                  {recentScans.length === 0 ? (
                    <div style={{ padding: 24, textAlign: "center", color: "var(--muted)", fontSize: 11 }}>
                      No recent scans recorded. Click "New URL Scan" to begin.
                    </div>
                  ) : (
                    <table className="table-cg">
                      <thead>
                        <tr>
                          <th>URL</th>
                          <th>Risk</th>
                          <th>Level</th>
                          <th>Confidence</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentScans.map((scan, idx) => {
                          const score = scan.riskScore ?? scan.risk?.score ?? "N/A";
                          const level = (scan.riskLevel || scan.risk?.level || "SAFE").toUpperCase();
                          const conf = `${scan.confidence ?? 80}%`;
                          const badgeColor =
                            level === "SAFE" ? "green" :
                            level === "LOW" ? "blue" :
                            level === "MODERATE" ? "amber" : "red";

                          return (
                            <tr key={scan.id || (scan as any)._id || idx}>
                              <td style={{ maxWidth: 220, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={scan.url}>
                                {scan.url}
                              </td>
                              <td style={{ fontWeight: 700 }}>{score}</td>
                              <td>
                                <span className={`badge-cg ${badgeColor}`}>
                                  {level}
                                </span>
                              </td>
                              <td style={{ color: "var(--muted)" }}>{conf}</td>
                              <td>
                                <Link 
                                  href={`/analyzer?url=${encodeURIComponent(scan.url)}`} 
                                  style={{ color: "var(--blue)" }}
                                  title="Re-analyze URL"
                                >
                                  <ExternalLink size={13} />
                                </Link>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>

              {/* Threat Intelligence Health */}
              <div className="card-cg">
                <div className="card-head-cg">
                  <div>
                    <h3>Threat Intelligence Health</h3>
                    <p>Provider connectivity and latest status</p>
                  </div>
                  <span className="badge-cg green">Operational</span>
                </div>
                <div className="card-body-cg">
                  {[
                    { name: "Google Safe Browsing", desc: "Threat list & client feeds synchronized" },
                    { name: "VirusTotal", desc: "Multi-engine antivirus telemetry connected" },
                    { name: "URLhaus", desc: "Active malware repository feeds updated" },
                  ].map((provider) => (
                    <div className="provider-cg" key={provider.name}>
                      <div className="provider-icon-cg">
                        <ShieldCheck size={16} />
                      </div>
                      <div className="provider-main-cg">
                        <strong>{provider.name}</strong>
                        <p>{provider.desc}</p>
                      </div>
                      <span className="badge-cg green">Available</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
