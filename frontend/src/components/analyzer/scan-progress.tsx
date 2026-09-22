
import React from "react";
import { CheckCircle2, Circle, RefreshCw, XCircle, Shield, AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export type ScanState = "IDLE" | "VALIDATING" | "SCANNING" | "COMPLETED" | "FAILED";

export interface ScanProgressProps {
  state: ScanState;
  targetUrl?: string;
  errorMessage?: string | null;
  onRetry?: () => void;
}

interface StageDefinition {
  id: string;
  title: string;
  description: string;
}

const STAGES: StageDefinition[] = [
  {
    id: "validation",
    title: "1. URL Format & Protocol Validation",
    description: "Verifies structure, scheme (HTTP/HTTPS), hostname, and Punycode normalization.",
  },
  {
    id: "threat_intel",
    title: "2. Concurrent Threat Intelligence Pipeline",
    description: "Queries Google Safe Browsing, VirusTotal (70+ engines), URLhaus, SSL/TLS analysis, and heuristic analyzers in parallel.",
  },
  {
    id: "risk_scoring",
    title: "3. Evidence-Based Risk Evaluation",
    description: "Synthesizes multi-engine security findings, severity factors, and confidence metrics.",
  },
  {
    id: "report_generation",
    title: "4. Incident Report & Persistence",
    description: "Generates formal incident triage record with an immutable security snapshot.",
  },
];

export function ScanProgress({ state, targetUrl, errorMessage, onRetry }: ScanProgressProps) {
  if (state === "IDLE") {
    return null;
  }

  // Derive status for each stage based on truthful lifecycle state
  const getStageStatus = (stageId: string): "completed" | "active" | "pending" | "failed" => {
    if (state === "FAILED") {
      if (stageId === "validation") {
        return errorMessage && errorMessage.toLowerCase().includes("url") ? "failed" : "completed";
      }
      if (stageId === "threat_intel") {
        return errorMessage && errorMessage.toLowerCase().includes("url") ? "pending" : "failed";
      }
      return "pending";
    }

    if (state === "COMPLETED") {
      return "completed";
    }

    if (state === "VALIDATING") {
      if (stageId === "validation") return "active";
      return "pending";
    }

    if (state === "SCANNING") {
      if (stageId === "validation") return "completed";
      if (stageId === "threat_intel") return "active";
      return "pending";
    }

    return "pending";
  };

  const isFailed = state === "FAILED";

  return (
    <Card className="border-[#E5E7EB] bg-white shadow-sm mb-8 overflow-hidden">
      {/* Header Banner */}
      <div
        className={`px-6 py-4 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
          isFailed
            ? "bg-rose-50/70 border-rose-200 text-rose-900"
            : "bg-emerald-50/50 border-[#E5E7EB] text-slate-800"
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`p-2 rounded-xl flex items-center justify-center shrink-0 ${
              isFailed
                ? "bg-rose-100 text-rose-600"
                : "bg-emerald-100 text-emerald-700 animate-pulse"
            }`}
          >
            {isFailed ? (
              <AlertTriangle className="w-5 h-5" />
            ) : (
              <RefreshCw className="w-5 h-5 animate-spin" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                {isFailed ? "Scan Interrupted" : "Scan in Progress"}
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  isFailed
                    ? "bg-rose-200 text-rose-800"
                    : "bg-emerald-100 text-emerald-800"
                }`}
              >
                {state}
              </span>
            </div>
            <h3 className="font-bold text-sm text-[#1F2937] mt-0.5 truncate max-w-lg">
              {isFailed
                ? "Security Scan Encountered an Issue"
                : targetUrl
                ? `Analyzing: ${targetUrl}`
                : "Executing Multi-Engine Threat Assessment"}
            </h3>
          </div>
        </div>

        {isFailed && onRetry && (
          <Button
            size="sm"
            onClick={onRetry}
            className="bg-rose-600 hover:bg-rose-700 text-white text-xs px-3.5 py-1.5 h-8 rounded-lg shrink-0 font-semibold"
          >
            Retry Analysis
          </Button>
        )}
      </div>

      <CardContent className="p-5 sm:p-6 space-y-4">
        {/* Error message card if failed */}
        {isFailed && errorMessage && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-start gap-2.5">
            <XCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-bold block">Analysis Error:</span>
              <span className="text-rose-600 mt-0.5 block">{errorMessage}</span>
            </div>
          </div>
        )}

        {/* Truthful Multi-Stage Checklist */}
        <div className="space-y-2.5">
          {STAGES.map((stage) => {
            const status = getStageStatus(stage.id);

            return (
              <div
                key={stage.id}
                className={`p-3 sm:p-3.5 rounded-xl border transition-colors flex items-start gap-3 ${
                  status === "active"
                    ? "bg-blue-50/50 border-blue-200 text-slate-900"
                    : status === "completed"
                    ? "bg-emerald-50/40 border-emerald-100 text-slate-800"
                    : status === "failed"
                    ? "bg-rose-50/40 border-rose-200 text-rose-900"
                    : "bg-slate-50/50 border-slate-200/80 text-slate-400"
                }`}
              >
                <div className="mt-0.5 shrink-0">
                  {status === "completed" && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  )}
                  {status === "active" && (
                    <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />
                  )}
                  {status === "failed" && (
                    <XCircle className="w-4 h-4 text-rose-500" />
                  )}
                  {status === "pending" && (
                    <Circle className="w-4 h-4 text-slate-300" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`text-xs font-bold truncate ${
                        status === "active"
                          ? "text-blue-900 font-extrabold"
                          : status === "completed"
                          ? "text-slate-900"
                          : status === "failed"
                          ? "text-rose-700"
                          : "text-slate-500"
                      }`}
                    >
                      {stage.title}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider shrink-0 ${
                        status === "completed"
                          ? "bg-emerald-100 text-emerald-700"
                          : status === "active"
                          ? "bg-blue-100 text-blue-700 animate-pulse"
                          : status === "failed"
                          ? "bg-rose-100 text-rose-700"
                          : "bg-slate-100 text-slate-400"
                      }`}
                    >
                      {status === "active"
                        ? "In Progress"
                        : status === "completed"
                        ? "Completed"
                        : status === "failed"
                        ? "Failed"
                        : "Pending"}
                    </span>
                  </div>
                  <p
                    className={`text-[11px] mt-0.5 leading-relaxed ${
                      status === "active"
                        ? "text-blue-700/90 font-medium"
                        : status === "completed"
                        ? "text-slate-500"
                        : status === "failed"
                        ? "text-rose-600/80"
                        : "text-slate-400"
                    }`}
                  >
                    {stage.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Truthful transparency notice */}
        <div className="pt-2 flex items-center gap-2 text-[11px] text-slate-500">
          <Shield className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span>
            Engines run concurrently in parallel. Progress accurately reflects live request execution.
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
