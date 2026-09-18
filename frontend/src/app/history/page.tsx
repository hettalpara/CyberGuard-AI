"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Search, Eye, Trash2, ShieldAlert, Cpu, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { RiskMeter } from "@/components/common/risk-meter";
import { SearchBar } from "@/components/common/search-bar";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { analyzerService } from "@/services/analyzer.service";

interface HistoryItem {
  id: string;
  url: string;
  riskScore: number;
  threatLevel: "SAFE" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  safeBrowsingStatus: string;
  urlhausStatus: string;
  virusTotalRatio: string;
  timestamp: string;
}

export default function HistoryPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterLevel, setFilterLevel] = useState<string>("ALL");
  const [items, setItems] = useState<HistoryItem[]>([
    {
      id: "HIS-001",
      url: "https://sbi-verify-account.xyz/login",
      riskScore: 88,
      threatLevel: "HIGH",
      safeBrowsingStatus: "THREAT_DETECTED",
      urlhausStatus: "MALWARE_DETECTED",
      virusTotalRatio: "14/70",
      timestamp: "2026-08-06 12:45",
    },
    {
      id: "HIS-002",
      url: "https://github.com",
      riskScore: 0,
      threatLevel: "SAFE",
      safeBrowsingStatus: "CHECKED_NO_THREAT",
      urlhausStatus: "CHECKED_NO_MATCH",
      virusTotalRatio: "0/70",
      timestamp: "2026-08-06 11:20",
    },
    {
      id: "HIS-003",
      url: "http://update-paypal-security.com",
      riskScore: 92,
      threatLevel: "CRITICAL",
      safeBrowsingStatus: "THREAT_DETECTED",
      urlhausStatus: "CHECKED_NO_MATCH",
      virusTotalRatio: "18/70",
      timestamp: "2026-08-05 18:10",
    },
    {
      id: "HIS-004",
      url: "https://google.com",
      riskScore: 0,
      threatLevel: "SAFE",
      safeBrowsingStatus: "CHECKED_NO_THREAT",
      urlhausStatus: "CHECKED_NO_MATCH",
      virusTotalRatio: "0/70",
      timestamp: "2026-08-05 14:05",
    },
    {
      id: "HIS-005",
      url: "http://free-giftcard-claim.net",
      riskScore: 65,
      threatLevel: "MEDIUM",
      safeBrowsingStatus: "UNAVAILABLE",
      urlhausStatus: "CHECKED_NO_MATCH",
      virusTotalRatio: "3/70",
      timestamp: "2026-08-04 09:30",
    },
  ]);

  useEffect(() => {
    let mounted = true;
    analyzerService
      .getScanHistory({ page: 1, limit: 20 })
      .then((res) => {
        if (mounted && res?.data?.data && Array.isArray(res.data.data) && res.data.data.length > 0) {
          const apiItems: HistoryItem[] = res.data.data.map((s, idx) => {
            const level = (s.risk?.level || s.riskLevel || "SAFE") as any;
            const vt = s.virusTotal;
            const vtRatio =
              vt?.detectionRatio ||
              `${(vt?.maliciousCount || 0) + (vt?.suspiciousCount || 0)}/${vt?.totalEngines || 70}`;

            const sbStatus =
              s.safeBrowsing?.status ||
              (s.safeBrowsing?.threatDetected ? "THREAT_DETECTED" : "CHECKED_NO_THREAT");

            const uhStatus = s.urlhaus?.status || "CHECKED_NO_MATCH";

            return {
              id: s.id ? `SCN-${s.id.slice(-5).toUpperCase()}` : `HIS-00${idx + 1}`,
              url: s.url,
              riskScore: s.riskScore ?? s.risk?.score ?? 0,
              threatLevel: level === "MODERATE" ? "MEDIUM" : level,
              safeBrowsingStatus: sbStatus,
              urlhausStatus: uhStatus,
              virusTotalRatio: vtRatio,
              timestamp: new Date(s.scannedAt || s.createdAt || Date.now()).toLocaleDateString(),
            };
          });
          setItems(apiItems);
        }
      })
      .catch(() => {
        // use default mock items gracefully
      });
    return () => {
      mounted = false;
    };
  }, []);

  const handleDelete = (id: string) => {
    setItems(items.filter((item) => item.id !== id));
  };

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.url.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter =
      filterLevel === "ALL" ||
      (filterLevel === "THREAT" && item.riskScore >= 50) ||
      (filterLevel === "SAFE" && item.riskScore < 50);
    return matchesSearch && matchesFilter;
  });

  return (
    <ProtectedRoute>
      <div className="min-h-screen flex flex-col lg:flex-row bg-[#F8FAFC]">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <Header />
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
              <div>
                <h1 className="text-3xl font-extrabold text-[#1F2937] tracking-tight">Scan History</h1>
                <p className="text-slate-500 text-xs sm:text-sm mt-1">
                  Timeline of past scans with Google Safe Browsing, URLhaus, and VirusTotal threat statuses.
                </p>
              </div>
              <Link href="/analyzer">
                <Button className="bg-[#10B981] hover:bg-[#059669] text-white px-5 h-10 rounded-xl font-semibold text-xs flex items-center gap-2">
                  <Search className="w-4 h-4" /> Run New Scan
                </Button>
              </Link>
            </div>

            <Card className="border-[#E5E7EB] bg-white shadow-sm overflow-hidden">
              <CardHeader className="pb-4 border-b border-[#E5E7EB]">
                <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                  <SearchBar value={searchTerm} onChange={setSearchTerm} placeholder="Filter by URL or Scan ID..." />
                  <div className="flex items-center gap-2">
                    <Button
                      variant={filterLevel === "ALL" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setFilterLevel("ALL")}
                      className={
                        filterLevel === "ALL"
                          ? "bg-[#10B981] text-white text-xs h-8 font-semibold"
                          : "border-[#E5E7EB] text-slate-600 text-xs h-8 font-semibold"
                      }
                    >
                      All Scans
                    </Button>
                    <Button
                      variant={filterLevel === "THREAT" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setFilterLevel("THREAT")}
                      className={
                        filterLevel === "THREAT"
                          ? "bg-red-600 text-white text-xs h-8 font-semibold"
                          : "border-[#E5E7EB] text-slate-600 text-xs h-8 font-semibold"
                      }
                    >
                      Threats Only
                    </Button>
                    <Button
                      variant={filterLevel === "SAFE" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setFilterLevel("SAFE")}
                      className={
                        filterLevel === "SAFE"
                          ? "bg-emerald-600 text-white text-xs h-8 font-semibold"
                          : "border-[#E5E7EB] text-slate-600 text-xs h-8 font-semibold"
                      }
                    >
                      Clean Only
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-700">
                    <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-[#E5E7EB]">
                      <tr>
                        <th className="px-4 py-3">Scan ID</th>
                        <th className="px-4 py-3">URL</th>
                        <th className="px-4 py-3">Risk Assessment</th>
                        <th className="px-4 py-3">Google Safe Browsing</th>
                        <th className="px-4 py-3">URLhaus</th>
                        <th className="px-4 py-3">VirusTotal</th>
                        <th className="px-4 py-3">Timestamp</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E5E7EB]">
                      {filteredItems.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50 transition">
                          <td className="px-4 py-3.5 font-mono font-bold text-[#1F2937]">{item.id}</td>
                          <td className="px-4 py-3.5 font-mono max-w-xs truncate text-slate-800 font-medium">
                            {item.url}
                          </td>
                          <td className="px-4 py-3.5">
                            <RiskMeter score={item.riskScore} threatLevel={item.threatLevel} size="sm" />
                          </td>
                          <td className="px-4 py-3.5">
                            {item.safeBrowsingStatus === "THREAT_DETECTED" ? (
                              <span className="px-2 py-0.5 bg-red-100 text-red-700 text-[10px] font-bold rounded border border-red-200 inline-flex items-center gap-1">
                                <ShieldAlert className="w-3 h-3" /> THREAT
                              </span>
                            ) : item.safeBrowsingStatus === "UNAVAILABLE" ? (
                              <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-semibold rounded">
                                UNAVAILABLE
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded border border-emerald-200">
                                CLEAN
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3.5">
                            {item.urlhausStatus === "MALWARE_DETECTED" ? (
                              <span className="px-2 py-0.5 bg-red-100 text-red-700 text-[10px] font-bold rounded border border-red-200 inline-flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" /> MALWARE
                              </span>
                            ) : item.urlhausStatus === "UNAVAILABLE" ? (
                              <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-semibold rounded">
                                UNAVAILABLE
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded border border-emerald-200">
                                NO MATCH
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3.5">
                            <span className="font-mono text-slate-600 inline-flex items-center gap-1">
                              <Cpu className="w-3 h-3 text-slate-400" />
                              {item.virusTotalRatio}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-slate-500">{item.timestamp}</td>
                          <td className="px-4 py-3.5 text-right space-x-1">
                            <Link href={`/analyzer?url=${encodeURIComponent(item.url)}`}>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-slate-500 hover:text-[#10B981]"
                                title="View Scan Details"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                            </Link>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-slate-500 hover:text-red-600"
                              title="Delete Entry"
                              onClick={() => handleDelete(item.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                      {filteredItems.length === 0 && (
                        <tr>
                          <td colSpan={8} className="px-4 py-8 text-center text-slate-400 text-xs">
                            No scan history entries found matching criteria.
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
