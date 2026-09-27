"use client";

import React from "react";
import { AlertTriangle, ShieldCheck } from "lucide-react";
import type { SecurityFindingData } from "@/services/analyzer.service";

interface UrlStructureCardProps {
  intelligence?: {
    available?: boolean;
    score?: number | null;
    riskLevel?: string;
    status?: string;
    indicators?: any[];
    explanation?: string;
    reasons?: string[];
  };
  findings?: SecurityFindingData[];
}

export function UrlStructureCard({ findings = [] }: UrlStructureCardProps) {
  const safeFindings = Array.isArray(findings) ? findings : [];

  const structureFindings = safeFindings.filter((f) => {
    if (!f) return false;
    if (f.source === "LOCAL_HEURISTICS") return true;
    const text = typeof f.finding === "string" ? f.finding.toLowerCase() : "";
    return (
      text.includes("punycode") ||
      text.includes("ip") ||
      text.includes("length") ||
      text.includes("subdomain") ||
      text.includes("structure")
    );
  });

  const defaultItems = [
    { id: "struct-1", title: "Domain structure", desc: "Domain structure conforms to standard syntax.", level: "LOW", color: "green", isAlert: false },
    { id: "struct-2", title: "URL length", desc: "URL length is within expected parameters.", level: "LOW", color: "green", isAlert: false },
    { id: "struct-3", title: "Subdomain analysis", desc: "No excessive subdomain nesting detected.", level: "LOW", color: "green", isAlert: false },
  ];

  const displayItems = structureFindings.length > 0
    ? structureFindings.map((f, idx) => {
        const severityStr = String(f.severity || "LOW").toUpperCase();
        const isCritical = severityStr === "CRITICAL" || severityStr === "HIGH";
        const isModerate = severityStr === "MEDIUM" || severityStr === "MODERATE";
        return {
          id: `struct-finding-${idx}-${String(f.finding || "").slice(0, 15)}`,
          title: String(f.finding || "URL Structure Finding"),
          desc: String(f.explanation || "Finding detected during URL structural analysis."),
          level: severityStr,
          color: isCritical ? "red" : isModerate ? "amber" : "green",
          isAlert: isCritical || isModerate,
        };
      })
    : defaultItems;

  return (
    <div className="card-cg">
      <div className="card-head-cg">
        <div>
          <h3>URL Structure Analysis</h3>
          <p>Analysis of URL structure and characteristics</p>
        </div>
      </div>

      <div className="card-body-cg">
        {displayItems.map((item) => (
          <div className="finding-cg" key={item.id}>
            <div className="finding-icon-cg">
              {item.isAlert ? (
                <AlertTriangle size={14} color="#ffb52e" />
              ) : (
                <ShieldCheck size={14} color="#50e3a4" />
              )}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center" }}>
                <h4>{item.title}</h4>
                <span className={`badge-cg ${item.color}`}>{item.level}</span>
              </div>
              <p>{item.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
