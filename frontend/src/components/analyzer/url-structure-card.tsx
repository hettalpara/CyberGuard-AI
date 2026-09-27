"use client";

import React from "react";
import { AlertTriangle, ShieldCheck } from "lucide-react";
import type { SecurityFindingData } from "@/services/analyzer.service";

interface UrlStructureCardProps {
  intelligence?: {
    available: boolean;
    score: number | null;
    riskLevel: string;
    status: string;
    indicators: any[];
    explanation: string;
    reasons: string[];
  };
  findings?: SecurityFindingData[];
}

export function UrlStructureCard({ findings = [] }: UrlStructureCardProps) {
  const structureFindings = findings.filter(
    (f) =>
      f.source === "LOCAL_HEURISTICS" ||
      f.finding.toLowerCase().includes("punycode") ||
      f.finding.toLowerCase().includes("ip") ||
      f.finding.toLowerCase().includes("length") ||
      f.finding.toLowerCase().includes("subdomain") ||
      f.finding.toLowerCase().includes("structure")
  );

  const defaultItems = [
    { title: "Domain structure", desc: "Domain structure conforms to standard syntax.", level: "LOW", color: "green", isAlert: false },
    { title: "URL length", desc: "URL length is within expected parameters.", level: "LOW", color: "green", isAlert: false },
    { title: "Subdomain analysis", desc: "No excessive subdomain nesting detected.", level: "LOW", color: "green", isAlert: false },
  ];

  const displayItems = structureFindings.length > 0
    ? structureFindings.map((f) => ({
        title: f.finding,
        desc: f.explanation,
        level: f.severity,
        color: f.severity === "CRITICAL" || f.severity === "HIGH" ? "red" : f.severity === "MEDIUM" || f.severity === "MODERATE" ? "amber" : "green",
        isAlert: f.severity === "CRITICAL" || f.severity === "HIGH" || f.severity === "MEDIUM" || f.severity === "MODERATE",
      }))
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
        {displayItems.map((item, idx) => (
          <div className="finding-cg" key={idx}>
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
