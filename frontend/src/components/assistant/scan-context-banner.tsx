import React from "react";
import { ShieldAlert } from "lucide-react";

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
  return (
    <div className="mb-3 p-3 bg-slate-900 text-white rounded-xl shadow-sm flex items-center justify-between gap-3 text-xs">
      <div className="flex items-center gap-2 min-w-0">
        <ShieldAlert className="w-4 h-4 text-[#10B981] shrink-0" />
        <div className="truncate">
          <span className="text-slate-400 font-medium">Analyzing scan: </span>
          <span className="font-bold text-white font-mono text-[11px]">
            {activeScan.url || `#${activeScan.scanId.slice(-8)}`}
          </span>
          {activeScan.riskLevel && (
            <span className="ml-2 font-semibold text-emerald-400">
              Risk: {activeScan.riskLevel}{" "}
              {activeScan.riskScore !== null && activeScan.riskScore !== undefined
                ? `(${activeScan.riskScore}/100)`
                : ""}
            </span>
          )}
        </div>
      </div>
      <button
        onClick={onExit}
        className="text-slate-400 hover:text-white text-[11px] underline shrink-0 cursor-pointer"
      >
        Exit Scan Mode
      </button>
    </div>
  );
}
