"use client";

import React from "react";
import { Lock, AlertTriangle, ShieldCheck } from "lucide-react";

interface ConnectionSecurityCardProps {
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

export function ConnectionSecurityCard({ ssl, sslAnalysis }: ConnectionSecurityCardProps) {
  const isHttps = sslAnalysis?.protocol?.toUpperCase().includes("HTTPS") || ssl.valid;
  const protocol = sslAnalysis?.protocol || (ssl.valid ? "HTTPS" : "HTTP");
  const isHttp = protocol.toUpperCase() === "HTTP";

  const rows = [
    {
      label: "Protocol",
      value: protocol,
      status: isHttp ? "UNENCRYPTED" : "ENCRYPTED"
    },
    {
      label: "TLS Encryption",
      value: isHttp ? "Not available" : (sslAnalysis?.available ? "Active (TLS 1.2/1.3)" : "Not available"),
      status: isHttp ? "—" : "ACTIVE"
    },
    {
      label: "Certificate",
      value: isHttp ? "Not available" : (ssl.issuer || (ssl.valid ? "Verified Authority" : "Invalid")),
      status: ssl.valid ? "VALID" : "—"
    },
    {
      label: "Hostname Match",
      value: isHttp ? "Not available" : (sslAnalysis?.hostnameMatch !== undefined ? (sslAnalysis.hostnameMatch ? "Matched" : "Mismatch") : (ssl.valid ? "Matched" : "—")),
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
                {row.value}
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
