"use client";

import React from "react";
import { Lock, AlertTriangle, ShieldCheck } from "lucide-react";

interface ConnectionSecurityCardProps {
  ssl?: {
    valid: boolean;
    issuer: string | unknown;
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
    issuer?: string | unknown;
    validDaysRemaining?: number;
    hostnameMatch?: boolean;
    authorized?: boolean;
    explanation: string;
    reasons: string[];
    error?: string;
  };
}

export function formatIssuerDisplay(raw: unknown): string {
  if (!raw) return "Unknown CA";
  if (typeof raw === "string") return raw.trim() || "Unknown CA";
  if (typeof raw === "object") {
    const obj = raw as Record<string, unknown>;
    const org = obj.O || obj.organization;
    const cn = obj.CN || obj.commonName;
    const c = obj.C || obj.country;
    if (org && cn) return `${String(org)} (${String(cn)})`;
    if (org) return String(org);
    if (cn) return String(cn);
    if (c) return `Certificate Authority (${String(c)})`;
    try {
      const parts = Object.entries(obj)
        .filter(([, v]) => typeof v === "string" && v.length > 0)
        .map(([k, v]) => `${k}=${v}`);
      if (parts.length > 0) return parts.slice(0, 2).join(", ");
    } catch {
      // fallback
    }
  }
  return String(raw);
}

export function ConnectionSecurityCard({ ssl, sslAnalysis }: ConnectionSecurityCardProps) {
  const safeSsl = ssl || {
    valid: false,
    issuer: "Unknown CA",
    validDaysRemaining: 0,
    status: "UNKNOWN"
  };

  const protocolStr = (sslAnalysis?.protocol || (safeSsl.valid ? "HTTPS" : "HTTP")).toUpperCase();
  const isHttps = protocolStr.includes("HTTPS") || safeSsl.valid;
  const isHttp = protocolStr === "HTTP" && !safeSsl.valid;

  const issuerDisplay = formatIssuerDisplay(safeSsl.issuer || sslAnalysis?.issuer);

  const rows = [
    {
      label: "Protocol",
      value: protocolStr || (isHttps ? "HTTPS" : "HTTP"),
      status: isHttp ? "UNENCRYPTED" : "ENCRYPTED"
    },
    {
      label: "TLS Encryption",
      value: isHttp ? "Not available" : (sslAnalysis?.available ? "Active (TLS 1.2/1.3)" : isHttps ? "Active (TLS)" : "Not available"),
      status: isHttp ? "—" : "ACTIVE"
    },
    {
      label: "Certificate",
      value: isHttp ? "Not available" : (issuerDisplay || (safeSsl.valid ? "Verified Authority" : "Invalid")),
      status: safeSsl.valid ? "VALID" : isHttp ? "—" : "UNVERIFIED"
    },
    {
      label: "Hostname Match",
      value: isHttp ? "Not available" : (sslAnalysis?.hostnameMatch !== undefined ? (sslAnalysis.hostnameMatch ? "Matched" : "Mismatch") : (safeSsl.valid ? "Matched" : "—")),
      status: sslAnalysis?.hostnameMatch ? "VALID" : "—"
    },
  ];

  return (
    <div className="card-cg">
      <div className="card-head-cg">
        <div>
          <h3>Connection Security</h3>
          <p>SSL/TLS analysis</p>
        </div>
        <Lock size={17} color={isHttps ? "#50e3a4" : "#ff7777"} />
      </div>

      <div className="card-body-cg">
        {rows.map((row) => (
          <div className="finding-cg" key={row.label} style={{ padding: "9px 0" }}>
            <div className="finding-icon-cg" style={{ width: 22, height: 22 }}>
              <Lock size={12} />
            </div>
            <div style={{ flex: 1, display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 10 }}>
              <span style={{ color: "var(--muted)" }}>{row.label}</span>
              <strong style={{ color: row.status === "UNENCRYPTED" ? "#ff7777" : "var(--text)" }}>
                {typeof row.value === "string" ? row.value : String(row.value || "")}
              </strong>
            </div>
          </div>
        ))}

        {isHttp && (
          <div className="notice-cg" style={{ marginTop: 12 }}>
            <AlertTriangle size={13} style={{ verticalAlign: "middle", marginRight: 7 }} />
            Connection uses cleartext HTTP without TLS encryption.
          </div>
        )}

        {isHttps && (
          <div className="notice-cg" style={{ marginTop: 12, borderColor: "rgba(22,199,132,.3)", color: "var(--green)", background: "rgba(22,199,132,.07)" }}>
            <ShieldCheck size={13} style={{ verticalAlign: "middle", marginRight: 7 }} />
            Connection is encrypted with standard TLS certificate.
          </div>
        )}
      </div>
    </div>
  );
}
