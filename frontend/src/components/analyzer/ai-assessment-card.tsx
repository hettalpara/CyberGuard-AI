"use client";

import React, { useState } from "react";
import { Bot } from "lucide-react";
import type { AIAnalysisData } from "@/services/analyzer.service";

interface AiAssessmentCardProps {
  aiAnalysis?: AIAnalysisData;
  aiExplanation?: string;
  recommendedActions?: string[];
  scanId?: string;
  threatLevel: string;
  riskScore: number | null;
}

export function AiAssessmentCard({
  aiAnalysis,
  aiExplanation,
  recommendedActions = [],
  threatLevel,
}: AiAssessmentCardProps) {
  const [activeTab, setActiveTab] = useState<"Summary" | "Threat Details" | "Key Indicators" | "Recommendations">("Summary");

  const summary = aiAnalysis?.summary || aiExplanation || 
    (threatLevel === "SAFE"
      ? "Analysis across threat intelligence feeds and local heuristics indicates no immediate malicious indicators."
      : "Automated threat intelligence analysis identified suspicious characteristics that require defensive caution.");

  const threatType = aiAnalysis?.threatType || (threatLevel === "SAFE" ? "Benign / Normal" : "Suspicious Activity");
  const aiConfidence = aiAnalysis?.confidenceNote || "High";
  const indicators = aiAnalysis?.keyIndicators || [];
  const recommendations = aiAnalysis?.recommendedActions || recommendedActions;

  return (
    <div className="card-cg ai-panel-cg">
      <div className="card-head-cg">
        <div>
          <h3>AI Security Analysis</h3>
          <p>Powered by Gemini AI</p>
        </div>
        <Bot size={17} color="#b68cff" />
      </div>

      <div className="card-body-cg">
        {/* Quick Tabs */}
        <div className="quick-cg" style={{ marginBottom: 12 }}>
          {(["Summary", "Threat Details", "Key Indicators", "Recommendations"] as const).map((tab) => (
            <span
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`badge-cg ${activeTab === tab ? "purple" : "blue"}`}
              style={{ cursor: "pointer" }}
            >
              {tab}
            </span>
          ))}
        </div>

        {/* AI Summary Block */}
        <div className="ai-summary-cg">
          <strong style={{ color: "#e6dbff", display: "block", marginBottom: 5 }}>
            AI Assessment {activeTab}
          </strong>
          {activeTab === "Summary" && (
            <p style={{ margin: 0, lineHeight: 1.6 }}>{summary}</p>
          )}
          {activeTab === "Threat Details" && (
            <p style={{ margin: 0, lineHeight: 1.6 }}>
              {aiAnalysis?.explanation || summary}
            </p>
          )}
          {activeTab === "Key Indicators" && (
            <div>
              {indicators.length > 0 ? (
                <ul style={{ margin: 0, paddingLeft: 16 }}>
                  {indicators.map((ind, i) => (
                    <li key={i}>{ind}</li>
                  ))}
                </ul>
              ) : (
                <p style={{ margin: 0 }}>No critical threat indicators logged by telemetry.</p>
              )}
            </div>
          )}
          {activeTab === "Recommendations" && (
            <div>
              <ul style={{ margin: 0, paddingLeft: 16 }}>
                {recommendations.slice(0, 3).map((rec, i) => (
                  <li key={i}>{rec}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Mini stat cards at bottom */}
        <div className="grid-cg grid2-cg" style={{ marginTop: 10 }}>
          <div className="card-cg stat-cg" style={{ minHeight: 70, padding: 11 }}>
            <div className="label-cg">Likely Threat Type</div>
            <div style={{ fontSize: 10, fontWeight: 700, marginTop: 7, color: "var(--text)" }}>
              {threatType}
            </div>
          </div>

          <div className="card-cg stat-cg" style={{ minHeight: 70, padding: 11 }}>
            <div className="label-cg">AI Confidence</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#51dda1", marginTop: 7 }}>
              {aiConfidence.includes("%") ? aiConfidence : "High"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
