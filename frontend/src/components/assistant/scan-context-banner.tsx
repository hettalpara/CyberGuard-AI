"use client";

import React from "react";
import { ShieldAlert, X } from "lucide-react";
import { RiskBadge, normalizeRiskLevel } from "@/components/common/risk-badge";

export interface ScanContextState {
  scanId: string;
  url?: string;
  riskScore?: number | null;
  riskLevel?: string;
  threatType?: string;
}

interface ScanContextBannerProps {
  activeScan: ScanContextState;
  onExit: () => void;
}

export function ScanContextBanner({ activeScan, onExit }: ScanContextBannerProps) {
  const normLevel = normalizeRiskLevel(activeScan.riskLevel || "SAFE");

  return (
    <div className="mb-3 p-3 bg-slate-900 dark:bg-slate-950 text-white rounded-xl border border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        <div className="p-1.5 bg-emerald-500/15 rounded-md text-emerald-400 shrink-0">
          <ShieldAlert className="w-4 h-4" />
        </div>
        <div className="min-w-0 space-y-0.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] uppercase font-bold text-slate-400">Current Scan:</span>
            <span className="font-bold text-slate-100 truncate max-w-xs sm:max-w-md">
              {activeScan.url || `#${activeScan.scanId.slice(-8)}`}
            </span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <RiskBadge level={normLevel} size="sm" />
            {activeScan.riskScore !== null && activeScan.riskScore !== undefined && (
              <span className="text-slate-400 text-[11px]">
                Score: <strong className="text-slate-200">{activeScan.riskScore}/100</strong>
              </span>
            )}
            {activeScan.threatType && (
              <span className="text-slate-400 text-[11px] truncate">
                • {activeScan.threatType}
              </span>
            )}
          </div>
        </div>
      </div>

      <button
        onClick={onExit}
        className="text-slate-400 hover:text-white text-[11px] flex items-center gap-1 shrink-0 cursor-pointer self-start sm:self-center px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 transition"
      >
        <X className="w-3 h-3" />
        <span>Exit Context</span>
      </button>
    </div>
  );
}
