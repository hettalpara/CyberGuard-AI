import React from "react";
import Link from "next/link";
import { Activity, ArrowRight, FileText, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { IncidentReport } from "@/types";

interface RecentReportsProps {
  reports: IncidentReport[];
  loading?: boolean;
  formatTimeAgo: (dateString?: string) => string;
}

export function RecentReports({ reports, loading, formatTimeAgo }: RecentReportsProps) {
  return (
    <Card className="border-[#E5E7EB] bg-white shadow-sm">
      <CardHeader className="pb-3 border-b border-[#E5E7EB] flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-sm font-bold text-[#1F2937] flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#10B981]" /> Recent Incident Reports
          </CardTitle>
          <CardDescription className="text-xs text-slate-500">Official security incident documentation</CardDescription>
        </div>
        {reports.length > 0 && (
          <Link href="/reports" className="text-xs font-bold text-[#10B981] hover:underline flex items-center gap-1">
            View All Reports <ArrowRight className="w-3 h-3" />
          </Link>
        )}
      </CardHeader>
      <CardContent className="p-4">
        {loading ? (
          <div className="space-y-3 p-2">
            {Array.from({ length: 3 }).map((_, idx) => (
              <div key={idx} className="flex items-center justify-between animate-pulse p-2 rounded-lg bg-slate-50">
                <div className="h-3 w-40 bg-slate-200 rounded"></div>
                <div className="h-3 w-20 bg-slate-100 rounded"></div>
              </div>
            ))}
          </div>
        ) : reports.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <h4 className="text-sm font-semibold text-slate-700">No incident reports yet.</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto mb-4">
              Create formal incident reports from completed threat scans to document evidence and export official PDFs.
            </p>
            <Link href="/reports">
              <Button size="sm" variant="outline" className="text-xs border-[#E5E7EB] text-slate-700 hover:bg-slate-50 rounded-xl">
                Explore Reports
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-2.5">
            {reports.map((report) => (
              <Link 
                key={report._id} 
                href={`/reports/${report._id}`}
                className="flex items-center justify-between text-xs p-3 rounded-xl bg-slate-50 hover:bg-slate-100/80 border border-[#E5E7EB] transition"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="font-mono font-bold text-[#10B981]">{report.reportId}</span>
                  <span className="font-semibold text-slate-800 truncate">{report.title}</span>
                  <span className="hidden sm:inline-block text-[11px] px-2 py-0.5 rounded-full bg-slate-200/60 text-slate-600 font-medium">
                    {report.incidentType}
                  </span>
                </div>
                <div className="flex items-center gap-3 shrink-0 ml-4">
                  <span className="text-[11px] text-slate-400">{formatTimeAgo(report.createdAt)}</span>
                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md ${
                    report.status === "FINAL" ? "bg-emerald-100 text-emerald-700" :
                    report.status === "DRAFT" ? "bg-amber-100 text-amber-700" :
                    "bg-slate-100 text-slate-600"
                  }`}>
                    {report.status}
                  </span>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
