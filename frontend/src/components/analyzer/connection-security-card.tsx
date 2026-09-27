"use client";

import React from "react";
import { Lock, Unlock, ShieldCheck, AlertTriangle, CheckCircle2, XCircle, Info, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface ConnectionSecurityProps {
  ssl: {
    valid: boolean;
    issuer: string;
    validDaysRemaining: number;
    status?: string;
  };
  sslAnalysis?: {
    available: boolean;
    protocol: string;
    certificateStatus: string;
    score: number | null;
    riskLevel: string;
    status: string;
    issuer?: string;
    validDaysRemaining?: number;
    hostnameMatch?: boolean;
    authorized?: boolean;
    explanation: string;
    reasons: string[];
    error?: string;
  };
}

export function ConnectionSecurityCard({ ssl, sslAnalysis }: ConnectionSecurityProps) {
  const isHttps = sslAnalysis?.protocol === "HTTPS" || ssl.valid || (sslAnalysis?.certificateStatus && sslAnalysis.certificateStatus !== "HTTP_NO_CERT");
  const isHttp = sslAnalysis?.protocol === "HTTP" || (!ssl.valid && !sslAnalysis?.certificateStatus?.includes("VALID"));
  const isAvailable = sslAnalysis ? sslAnalysis.available && sslAnalysis.status !== "UNAVAILABLE" && sslAnalysis.status !== "ERROR" : true;

  const isCertValid = sslAnalysis?.certificateStatus === "VALID" || (ssl.valid && sslAnalysis?.certificateStatus !== "INVALID");

  return (
    <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] shadow-sm overflow-hidden">
      <CardHeader className="py-3.5 px-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {isCertValid ? (
              <Lock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <Unlock className="w-4 h-4 text-amber-500" />
            )}
            <CardTitle className="text-xs font-bold font-mono uppercase tracking-wider text-slate-800 dark:text-slate-200">
              Connection Security (SSL/TLS)
            </CardTitle>
          </div>
          {sslAnalysis?.score !== null && sslAnalysis?.score !== undefined && (
            <span className="text-[11px] font-mono text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
              SSL Risk Score: {sslAnalysis.score}/100 ({sslAnalysis.riskLevel || (isCertValid ? "SAFE" : "MODERATE")})
            </span>
          )}
        </div>
        <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
          Cryptographic protocol validation, certificate chain verification, and expiry tracking.
        </CardDescription>
      </CardHeader>

      <CardContent className="p-5">
        {!isAvailable ? (
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 text-xs text-slate-500 font-mono flex items-center gap-2">
            <Info className="w-4 h-4 text-slate-400" />
            <span>SSL/TLS certificate inspection is unavailable or host was unreachable.</span>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Primary Status Banner */}
            <div className={cn(
              "p-3.5 rounded-xl border flex items-center justify-between gap-3",
              isCertValid
                ? "bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/60"
                : isHttp
                ? "bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/60"
                : "bg-red-50/50 dark:bg-red-950/20 border-red-200 dark:border-red-900"
            )}>
              <div className="flex items-center gap-2.5">
                {isCertValid ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
                )}
                <div>
                  <span className="text-xs font-mono font-bold text-slate-900 dark:text-slate-100 block">
                    {isCertValid ? "✓ Secure HTTPS Connection" : "⚠ Insecure or Unencrypted HTTP Connection"}
                  </span>
                  <span className="text-[11px] text-slate-600 dark:text-slate-400 font-mono">
                    {sslAnalysis?.explanation || (isCertValid ? "Certificate verified by a recognized Certificate Authority." : "Connection lacks valid TLS encryption.")}
                  </span>
                </div>
              </div>

              <span className={cn(
                "px-2.5 py-1 text-[10px] font-mono font-bold rounded border uppercase tracking-wider shrink-0",
                isCertValid
                  ? "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-400"
                  : "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-400"
              )}>
                {sslAnalysis?.certificateStatus || (isCertValid ? "VALID" : "UNENCRYPTED")}
              </span>
            </div>

            {/* Grid of SSL Metadata Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs font-mono">
              {/* Protocol */}
              <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] uppercase text-slate-500 font-semibold block mb-1">Protocol</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">
                  {sslAnalysis?.protocol || (isHttps ? "HTTPS / TLS" : "HTTP (Plaintext)")}
                </span>
              </div>

              {/* Certificate Authority Issuer */}
              <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] uppercase text-slate-500 font-semibold block mb-1">Issuer CA</span>
                <span className="font-bold text-slate-900 dark:text-slate-100 truncate block" title={sslAnalysis?.issuer || ssl.issuer}>
                  {sslAnalysis?.issuer || ssl.issuer || "None / Self-Signed"}
                </span>
              </div>

              {/* Expiry / Days Remaining */}
              <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] uppercase text-slate-500 font-semibold block mb-1">Validity Left</span>
                <span className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  {sslAnalysis?.validDaysRemaining !== undefined
                    ? `${sslAnalysis.validDaysRemaining} days`
                    : ssl.validDaysRemaining > 0
                    ? `${ssl.validDaysRemaining} days`
                    : "N/A"}
                </span>
              </div>

              {/* Hostname Match */}
              <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] uppercase text-slate-500 font-semibold block mb-1">Hostname Validation</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">
                  {sslAnalysis?.hostnameMatch !== undefined
                    ? sslAnalysis.hostnameMatch ? "✓ Matched Hostname" : "✗ Hostname Mismatch"
                    : isCertValid ? "✓ Verified" : "Not Verified"}
                </span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
