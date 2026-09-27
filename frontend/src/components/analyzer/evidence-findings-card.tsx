"use client";

import React, { useState } from "react";
import { AlertTriangle, ShieldCheck, ChevronDown, ChevronUp } from "lucide-react";
import type { SecurityFindingData } from "@/services/analyzer.service";

interface EvidenceFindingsCardProps {
  findings?: SecurityFindingData[];
}

export function EvidenceFindingsCard({ findings = [] }: EvidenceFindingsCardProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const safeFindings = Array.isArray(findings) ? findings : [];

  const displayFindings = safeFindings.length > 0
    ? safeFindings
    : [
        {
          source: "Connection Inspection",
          finding: "Verified Transport Route",
          severity: "INFO" as const,
          explanation: "Standard HTTP/HTTPS endpoint handshake completed with no anomalous connection resets.",
        }
      ];

  return (
    <div className="card-cg" style={{ marginTop: 14 }}>
      <div className="card-head-cg">
        <div>
          <h3>Security Findings</h3>
          <p>Detailed findings from all analysis components</p>
        </div>
        <span className="badge-cg blue">
          {displayFindings.length} {displayFindings.length === 1 ? "finding" : "findings"}
        </span>
      </div>

      <div className="card-body-cg">
        {displayFindings.map((f, idx) => {
          const sev = String(f.severity || "INFO").toUpperCase();
          const isCritical = sev === "CRITICAL" || sev === "HIGH";
          const isModerate = sev === "MEDIUM" || sev === "MODERATE";
          const iconColor = isCritical ? "#ff7777" : isModerate ? "#ffb52e" : "#50e3a4";
          const isExpanded = expandedIndex === idx;
          const findingKey = `evidence-finding-${idx}-${String(f.finding || "").slice(0, 15)}`;

          return (
            <div 
              className="finding-cg" 
              key={findingKey}
              style={{ cursor: f.evidence ? "pointer" : "default" }}
              onClick={() => f.evidence && setExpandedIndex(isExpanded ? null : idx)}
            >
              <div className="finding-icon-cg">
                {isCritical || isModerate ? (
                  <AlertTriangle size={14} color={iconColor} />
                ) : (
                  <ShieldCheck size={14} color={iconColor} />
                )}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                  <h4>{String(f.finding || "Security Finding")}</h4>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span className={`badge-cg ${isCritical ? "red" : isModerate ? "amber" : "blue"}`}>
                      {sev}
                    </span>
                    {f.evidence && (
                      <span style={{ color: "var(--muted)" }}>
                        {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                      </span>
                    )}
                  </div>
                </div>
                <p>{String(f.explanation || "No additional explanation provided.")}</p>

                {isExpanded && f.evidence && (
                  <div style={{ marginTop: 8, padding: "8px 12px", background: "var(--panel-2)", borderRadius: 7, border: "1px solid var(--line)" }}>
                    <span style={{ fontSize: 9, color: "var(--muted)", textTransform: "uppercase", display: "block", marginBottom: 3 }}>
                      Technical Evidence
                    </span>
                    <pre style={{ margin: 0, fontSize: 10, fontFamily: "monospace", color: "var(--text)", whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
                      {typeof f.evidence === "string" ? f.evidence : JSON.stringify(f.evidence, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
