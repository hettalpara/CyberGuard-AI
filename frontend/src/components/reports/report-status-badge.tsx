import React from "react";
import { FileCheck, AlertCircle } from "lucide-react";
import type { ReportStatus } from "@/types";

export function ReportStatusBadge({ status }: { status: ReportStatus }) {
  switch (status) {
    case "FINAL":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
          <FileCheck className="w-3 h-3" /> Final
        </span>
      );
    case "DRAFT":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
          <AlertCircle className="w-3 h-3" /> Draft
        </span>
      );
    case "ARCHIVED":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
          Archived
        </span>
      );
  }
}
