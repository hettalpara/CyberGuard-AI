import React from "react";
import { Search } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/card";

export type StatusFilter = "ALL" | "FINAL" | "DRAFT" | "ARCHIVED";

interface ReportFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statusFilter: StatusFilter;
  onStatusFilterChange: (status: StatusFilter) => void;
}

export function ReportFilters({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
}: ReportFiltersProps) {
  const tabs: StatusFilter[] = ["ALL", "FINAL", "DRAFT", "ARCHIVED"];

  return (
    <Card className="border-[#E5E7EB] bg-white shadow-sm overflow-hidden mb-6">
      <CardHeader className="p-4 border-b border-[#E5E7EB]">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          {/* Search Input */}
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search by Report ID, Title, or URL..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-[#E5E7EB] rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#10B981]/20 focus:border-[#10B981] transition"
            />
          </div>

          {/* Status Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl w-full md:w-auto overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => onStatusFilterChange(tab)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  statusFilter === tab
                    ? "bg-white text-[#1F2937] shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {tab === "ALL" ? "All Reports" : tab.charAt(0) + tab.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>
    </Card>
  );
}
