"use client";

import React from "react";
import { AlertTriangle } from "lucide-react";
import { normalizeRiskLevel } from "@/components/common/risk-badge";
import { RiskGauge } from "@/components/common/risk-gauge";
import type { RiskFactorData } from "@/services/analyzer.service";

interface RiskSummarySectionProps {
  riskScore: number | null;
  riskLevel: string;
  confidence: number;
  calculationMethod?: string;
  overrideTriggered?: boolean;
  overrideReason?: string | null;
  overrideType?: string | null;
  analysisStatus?: string;
  riskFactors?: RiskFactorData[];
}

export function RiskSummarySection({
  riskScore,
  riskLevel,
  confidence,
  overrideTriggered,
  overrideReason,
}: RiskSummarySectionProps) {
  const normLevel = normalizeRiskLevel(riskLevel);
  const isScoreAvailable = riskScore !== null && !isNaN(riskScore);
  const scoreVal = isScoreAvailable ? riskScore : 0;

  const levelColor =
    normLevel === "CRITICAL" ? "#ef4444" :
    normLevel === "HIGH" ? "#ff7777" :
    normLevel === "MODERATE" ? "#ffab2e" :
    normLevel === "LOW" ? "#74a9ff" : "#50e3a4";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Short-Circuit Override Alert Banner */}
      {overrideTriggered && (
        <div className="notice-cg" style={{ borderColor: "rgba(239,68,68,.3)", color: "var(--red)", background: "rgba(239,68,68,.07)" }}>
          <AlertTriangle size={14} style={{ verticalAlign: "middle", marginRight: 7 }} />
          <strong>Critical Override Triggered:</strong> {overrideReason || "Immediate high-severity threat detection bypassed weighted formula."}
        </div>
      )}

      {/* Main Risk Assessment Card matching cyberguard-ai-ui */}
      <div className="card-cg" style={{ borderColor: normLevel === "MODERATE" ? "rgba(245,165,36,.35)" : normLevel === "HIGH" || normLevel === "CRITICAL" ? "rgba(239,68,68,.35)" : undefined }}>
        <div className="card-head-cg">
          <div>
            <h3>Risk Assessment</h3>
            <p>Overall security risk based on multi-source analysis</p>
          </div>
          <span className="badge-cg green">● Analysis Complete</span>
        </div>

        <div className="card-body-cg">
          <div className="grid-cg grid3-cg">
            {/* Risk Score */}
            <div className="card-cg stat-cg">
              <div className="label-cg">Risk Score</div>
              <div className="risk-number-cg" style={{ color: levelColor }}>
                {isScoreAvailable ? scoreVal : "—"}
              </div>
              <div className="sub-cg">out of 100</div>
            </div>

            {/* Risk Level */}
            <div className="card-cg stat-cg">
              <div className="label-cg">Risk Level</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: levelColor, marginTop: 18 }}>
                {normLevel === "SAFE" ? "✓ SAFE" : `⚠ ${normLevel}`}
              </div>
              <div className="sub-cg">
                {normLevel === "SAFE" ? "No critical indicators" : "Suspicious indicators found"}
              </div>
            </div>

            {/* Confidence */}
            <div className="card-cg stat-cg">
              <div className="label-cg">Confidence</div>
              <div className="risk-number-cg" style={{ color: "#52e3a5", fontSize: 38 }}>
                {confidence}<span style={{ fontSize: 18 }}>%</span>
              </div>
              <div className="sub-cg">Evidence consistency</div>
            </div>
          </div>

          {/* Horizontal Risk Bar with dot indicator */}
          <RiskGauge score={riskScore} level={normLevel} />
        </div>
      </div>
    </div>
  );
}
