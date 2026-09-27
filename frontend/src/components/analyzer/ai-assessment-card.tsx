"use client";

import React, { useState } from "react";
import { Bot, AlertCircle } from "lucide-react";
import type { AIAnalysisData } from "@/services/analyzer.service";

interface AiAssessmentCardProps {
  aiAnalysis?: AIAnalysisData | null;
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
  threatLevel = "SAFE",
}: AiAssessmentCardProps) {
  const [activeTab, setActiveTab] = useState<"Summary" | "Threat Details" | "Key Indicators" | "Recommendations">("Summary");

  const safeThreatLevel = typeof threatLevel === "string" ? threatLevel.toUpperCase() : "SAFE";

  const isAiUnavailable = aiAnalysis && aiAnalysis.available === false;

  const summary = 
    aiAnalysis?.summary || 
    aiExplanation || 
    (safeThreatLevel === "SAFE"
      ? "Analysis across threat intelligence feeds and local heuristics indicates no immediate malicious indicators."
      : "Automated threat intelligence analysis identified suspicious characteristics that require defensive caution.");

  const threatType = 
    aiAnalysis?.threatType || 
    (safeThreatLevel === "SAFE" ? "Benign / Normal" : "Suspicious Activity");

  const rawConfidence = aiAnalysis?.confidenceNote;
  const confidenceString = typeof rawConfidence === "string" ? rawConfidence.trim() : "";
  const displayConfidence = confidenceString.includes("%") 
    ? confidenceString 
    : confidenceString.length > 0 && confidenceString.length <= 20 
    ? confidenceString 
    : "High";

  const indicators = Array.isArray(aiAnalysis?.keyIndicators) ? aiAnalysis.keyIndicators : [];
  const rawRecs = Array.isArray(aiAnalysis?.recommendedActions) && aiAnalysis.recommendedActions.length > 0 
    ? aiAnalysis.recommendedActions 
    : Array.isArray(recommendedActions) 
    ? recommendedActions 
    : [];
  const recommendations = rawRecs.filter((r) => typeof r === "string" && r.trim().length > 0);

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
        {/* If AI is explicitly unavailable */}
        {isAiUnavailable && (
          <div className="notice-cg" style={{ marginBottom: 12, fontSize: 10 }}>
            <AlertCircle size={13} style={{ verticalAlign: "middle", marginRight: 6 }} />
            AI analysis temporarily unavailable. Multi-source deterministic security analysis remains fully operational.
          </div>
        )}

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
                    <li key={`indicator-${i}-${String(ind).slice(0, 15)}`}>{String(ind)}</li>
                  ))}
                </ul>
              ) : (
                <p style={{ margin: 0 }}>No critical threat indicators logged by telemetry.</p>
              )}
            </div>
          )}
          {activeTab === "Recommendations" && (
            <div>
              {recommendations.length > 0 ? (
                <ul style={{ margin: 0, paddingLeft: 16 }}>
                  {recommendations.slice(0, 3).map((rec, i) => (
                    <li key={`recommendation-${i}-${String(rec).slice(0, 15)}`}>{String(rec)}</li>
                  ))}
                </ul>
              ) : (
                <p style={{ margin: 0 }}>Follow standard cybersecurity protocols when accessing this resource.</p>
              )}
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
              {displayConfidence}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
