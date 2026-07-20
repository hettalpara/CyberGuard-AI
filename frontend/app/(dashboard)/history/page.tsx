"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, 
  Trash2, 
  Eye, 
  ChevronLeft, 
  ChevronRight, 
  ShieldAlert, 
  ShieldCheck, 
  Globe, 
  Calendar, 
  Activity,
  ArrowUpDown,
  Filter,
  CheckCircle,
  AlertTriangle
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
import { toast } from "sonner";
import { PageHeader, Breadcrumb } from "@/components/common";

// Mock history entries
const initialHistory = [
  { id: "h1", url: "https://secure-login-verify.ru/bank", ip: "194.58.112.4", threatLevel: "critical", score: 89, date: "2026-07-20 14:30:10" },
  { id: "h2", url: "https://pay-invoice-cleared.xyz", ip: "185.220.101.5", threatLevel: "high", score: 72, date: "2026-07-20 12:15:42" },
  { id: "h3", url: "https://trusted-banking-gateway.com", ip: "104.26.12.31", threatLevel: "safe", score: 12, date: "2026-07-19 18:40:00" },
  { id: "h4", url: "https://file-share-audit-doc.net", ip: "91.198.174.192", threatLevel: "medium", score: 48, date: "2026-07-18 10:22:15" },
  { id: "h5", url: "https://payload-locker-encrypter.ru", ip: "194.58.112.18", threatLevel: "critical", score: 95, date: "2026-07-17 09:05:30" },
  { id: "h6", url: "https://corporate-sign-on.auth-verify.com", ip: "104.26.13.31", threatLevel: "low", score: 26, date: "2026-07-16 16:34:00" },
  { id: "h7", url: "https://utility-payment-cleared.org", ip: "172.67.162.24", threatLevel: "safe", score: 8, date: "2026-07-15 11:20:10" }
];

export default function HistoryPage() {
  const [history, setHistory] = useState(initialHistory);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedThreat, setSelectedThreat] = useState("all");
  const [sortBy, setSortBy] = useState<"date" | "score">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const handleDelete = (id: string, url: string) => {
    setHistory((prev) => prev.filter((item) => item.id !== id));
    toast.success(`Scan record for ${url} purged from historical log vault.`);
  };

  const handleToggleSort = (field: "date" | "score") => {
    if (sortBy === field) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
  };

  // Filter, sort & pagination logic
  const filteredHistory = history
    .filter((item) => {
      const matchesSearch = item.url.toLowerCase().includes(searchQuery.toLowerCase()) || item.ip.includes(searchQuery);
      const matchesThreat = selectedThreat === "all" || item.threatLevel === selectedThreat;
      return matchesSearch && matchesThreat;
    })
    .sort((a, b) => {
      let comparison = 0;
      if (sortBy === "date") {
        comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
      } else if (sortBy === "score") {
        comparison = a.score - b.score;
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });

  // Pagination calculation
  const totalPages = Math.ceil(filteredHistory.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedHistory = filteredHistory.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: "History" }]} />
      
      <PageHeader 
        title="Scan Activity Timeline" 
        description="Audit previous threat lookup logs, security records, and dynamic analysis scores."
      />

      {/* Filters Panel */}
      <Card className="border-border bg-card/65 cyber-glow-border">
        <CardContent className="pt-6 flex flex-col md:flex-row gap-4 items-center justify-between">
          {/* Search bar */}
          <div className="relative w-full md:max-w-xs">
            <Search className="absolute left-3 top-2.5 h-4.5 w-4.5 text-muted-foreground/60" />
            <Input
              type="text"
              placeholder="Search domain or IP address..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-9 h-9 bg-accent/20 border-border text-xs focus-visible:ring-primary"
            />
          </div>

          {/* Filter Options */}
          <div className="flex flex-wrap gap-2 w-full md:w-auto">
            {[
              { id: "all", label: "All Logs" },
              { id: "critical", label: "Critical" },
              { id: "high", label: "High" },
              { id: "medium", label: "Medium" },
              { id: "safe", label: "Safe" }
            ].map((btn) => (
              <button
                key={btn.id}
                onClick={() => {
                  setSelectedThreat(btn.id);
                  setCurrentPage(1);
                }}
                className={cn(
                  "text-[10px] font-semibold px-3 py-1.5 rounded border transition-all cursor-pointer",
                  selectedThreat === btn.id
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

      {/* History Table Card */}
      <Card className="border-border bg-card/65 overflow-hidden cyber-glow-border">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-border/40 hover:bg-transparent">
              <TableHead>Scanned Target Domain</TableHead>
              <TableHead className="w-[120px]">Resolved IP</TableHead>
              <TableHead className="w-[120px] cursor-pointer" onClick={() => handleToggleSort("score")}>
                <div className="flex items-center gap-1">
                  Threat Score <ArrowUpDown className="h-3.5 w-3.5 text-primary" />
                </div>
              </TableHead>
              <TableHead className="w-[120px]">Threat Level</TableHead>
              <TableHead className="w-[180px] cursor-pointer" onClick={() => handleToggleSort("date")}>
                <div className="flex items-center gap-1">
                  Scan Date <ArrowUpDown className="h-3.5 w-3.5 text-primary" />
                </div>
              </TableHead>
              <TableHead className="w-[80px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <AnimatePresence mode="wait">
              {paginatedHistory.length > 0 ? (
                paginatedHistory.map((item) => (
                  <TableRow key={item.id} className="border-b border-border/40 hover:bg-accent/5 transition-colors">
                    <TableCell className="font-semibold text-xs max-w-[250px] truncate flex items-center gap-2 py-3">
                      <Globe className="h-4 w-4 text-primary shrink-0" />
                      <span className="truncate">{item.url}</span>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground font-mono">{item.ip}</TableCell>
                    <TableCell className="font-bold text-xs">
                      <span className={cn(
                        item.score >= 70 && "text-destructive",
                        item.score >= 40 && item.score < 70 && "text-amber-500",
                        item.score < 40 && "text-emerald-500"
                      )}>
                        {item.score} / 100
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[9px] font-semibold tracking-wider uppercase px-2 py-0.5",
                          item.threatLevel === "critical" && "bg-destructive/10 text-destructive border-destructive/25",
                          item.threatLevel === "high" && "bg-destructive/10 text-destructive border-destructive/25",
                          item.threatLevel === "medium" && "bg-amber-500/10 text-amber-500 border-amber-500/25",
                          item.threatLevel === "low" && "bg-blue-500/10 text-blue-500 border-blue-500/25",
                          item.threatLevel === "safe" && "bg-emerald-500/10 text-emerald-500 border-emerald-500/25"
                        )}
                      >
                        {item.threatLevel}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>{item.date}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          onClick={() => toast.info(`Viewing details for scan log: ${item.id}`)}
                          aria-label="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => handleDelete(item.id, item.url)}
                          aria-label="Delete Log"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-xs text-muted-foreground">
                    No historical logs matching query constraints identified.
                  </TableCell>
                </TableRow>
              )}
            </AnimatePresence>
          </TableBody>
        </Table>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="flex justify-between items-center px-6 py-4 border-t border-border/40 bg-accent/5">
            <span className="text-xs text-muted-foreground">
              Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredHistory.length)} of {filteredHistory.length} records
            </span>
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-2.5"
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4 mr-1" /> Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-2.5"
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                Next <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
