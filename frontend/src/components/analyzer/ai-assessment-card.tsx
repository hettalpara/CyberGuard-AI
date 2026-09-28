"use client";

import React from "react";
import { 
  Sparkles, 
  Bot, 
  AlertCircle, 
  RefreshCw, 
  CheckCircle2, 
  ShieldAlert, 
  ArrowRight, 
  ShieldCheck, 
  HelpCircle,
  Info
} from "lucide-react";
import type { AIAnalysisData } from "@/services/analyzer.service";

interface AiAssessmentCardProps {
  aiAnalysis?: AIAnalysisData | null;
  aiExplanation?: string;
  recommendedActions?: string[];
  scanId?: string;
  threatLevel: string;
  riskScore: number | null;
  confidence?: number;
  url?: string;
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
  onAskAi?: () => void;
}

export function AiAssessmentCard({
  aiAnalysis,
  aiExplanation,
  recommendedActions = [],
  threatLevel = "SAFE",
  riskScore = 0,
  confidence = 80,
  isLoading = false,
  isError = false,
  onRetry,
  onAskAi,
}: AiAssessmentCardProps) {
  const safeThreatLevel = typeof threatLevel === "string" ? threatLevel.toUpperCase() : "SAFE";
  const isAiUnavailable = isError || (aiAnalysis && aiAnalysis.available === false);

  // Derive human-readable content with safe fallbacks
  const summary =
    aiAnalysis?.summary ||
    aiExplanation ||
    (safeThreatLevel === "SAFE"
      ? "No immediate security threats were identified for this URL across active security providers."
      : `This URL carries a ${safeThreatLevel.toLowerCase()} security risk based on automated indicators.`);

  const whatItMeans =
    aiAnalysis?.whatItMeans ||
    aiAnalysis?.explanation ||
    (safeThreatLevel === "SAFE"
      ? "The security providers did not identify this URL as malicious, and standard security checks passed."
      : "Automated analysis identified risk signals such as domain heuristics, unencrypted connection, or provider flags.");

  const whyItMatters = aiAnalysis?.whyItMatters;

  const rawIndicators = Array.isArray(aiAnalysis?.keyIndicators) ? aiAnalysis.keyIndicators : [];
  const keyIndicators = rawIndicators.filter((k) => typeof k === "string" && k.trim().length > 0);

  const rawRecs =
    Array.isArray(aiAnalysis?.recommendedActions) && aiAnalysis.recommendedActions.length > 0
      ? aiAnalysis.recommendedActions
      : Array.isArray(recommendedActions) && recommendedActions.length > 0
      ? recommendedActions
      : [
          "Avoid entering passwords or personal information unless verified.",
          "Verify the domain in the browser bar before opening the website.",
          "Prefer official websites and HTTPS versions."
        ];
  const recommendations = rawRecs.filter((r) => typeof r === "string" && r.trim().length > 0);

  const userSafetyMessage =
    aiAnalysis?.userSafetyMessage ||
    "A clean result does not guarantee that a URL is completely safe. Always verify domain legitimacy before entering sensitive credentials.";

  return (
    <div className="card-cg ai-panel-cg" style={{ width: "100%", overflow: "hidden" }}>
      {/* ─── Card Header with Gemini Branding ─── */}
      <div 
        className="card-head-cg" 
        style={{ 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center", 
          flexWrap: "wrap", 
          gap: 12,
          padding: "16px 20px",
          borderBottom: "1px solid var(--line)"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div 
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: "linear-gradient(135deg, rgba(168,85,247,0.2), rgba(59,130,246,0.2))",
              border: "1px solid rgba(168,85,247,0.35)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#c084fc",
              flexShrink: 0
            }}
          >
            <Sparkles size={18} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "var(--foreground)", display: "flex", alignItems: "center", gap: 6 }}>
              ✨ Gemini AI Analysis
            </h3>
            <p style={{ margin: "2px 0 0", fontSize: 11, color: "var(--muted)" }}>
              AI-powered explanation of your security analysis
            </p>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span className="badge-cg purple" style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 600 }}>
            <Sparkles size={12} />
            <span>Gemini AI</span>
          </span>
          {riskScore !== null && (
            <span 
              className="badge-cg" 
              style={{ 
                fontSize: 10.5, 
                fontWeight: 600, 
                background: "rgba(255,255,255,0.04)", 
                border: "1px solid var(--line)",
                color: "var(--muted)"
              }}
            >
              Authoritative Risk: <strong style={{ color: "var(--foreground)" }}>{riskScore}/100 ({safeThreatLevel})</strong>
            </span>
          )}
        </div>
      </div>

      <div className="card-body-cg" style={{ padding: "20px" }}>
        {/* ─── 1. LOADING STATE ─── */}
        {isLoading && (
          <div style={{ padding: "24px 16px", textAlign: "center" }}>
            <div 
              style={{ 
                display: "inline-flex", 
                alignItems: "center", 
                justifyContent: "center", 
                width: 44, 
                height: 44, 
                borderRadius: "50%", 
                background: "rgba(168,85,247,0.12)", 
                border: "1px solid rgba(168,85,247,0.25)", 
                marginBottom: 14 
              }}
            >
              <RefreshCw size={20} className="animate-spin" style={{ color: "#c084fc" }} />
            </div>
            <h4 style={{ margin: "0 0 6px", fontSize: 14, fontWeight: 600, color: "var(--foreground)" }}>
              Analyzing security findings...
            </h4>
            <p style={{ margin: "0 auto", maxWidth: 460, fontSize: 12, color: "var(--muted)", lineHeight: 1.5 }}>
              Gemini AI is reviewing threat intelligence provider records, SSL certificates, and URL indicators to produce an easy-to-understand explanation.
            </p>
            {/* Elegant shimmer pulse */}
            <div style={{ maxWidth: 440, margin: "20px auto 0", display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ height: 9, width: "100%", background: "var(--line)", borderRadius: 6, opacity: 0.6, animation: "pulse 1.8s infinite" }} />
              <div style={{ height: 9, width: "75%", background: "var(--line)", borderRadius: 6, opacity: 0.4, animation: "pulse 1.8s infinite 0.3s" }} />
              <div style={{ height: 9, width: "88%", background: "var(--line)", borderRadius: 6, opacity: 0.3, animation: "pulse 1.8s infinite 0.6s" }} />
            </div>
          </div>
        )}

        {/* ─── 2. ERROR / UNAVAILABLE STATE (WITHOUT BREAKING DETERMINISTIC RESULTS) ─── */}
        {!isLoading && isAiUnavailable && (
          <div style={{ padding: "4px 0" }}>
            <div 
              className="notice-cg" 
              style={{ 
                borderColor: "rgba(239,68,68,0.3)", 
                background: "rgba(239,68,68,0.06)", 
                color: "var(--foreground)", 
                marginBottom: 16,
                padding: "12px 16px"
              }}
            >
              <AlertCircle size={16} style={{ color: "var(--red)", verticalAlign: "middle", marginRight: 10, flexShrink: 0 }} />
              <div>
                <div style={{ fontWeight: 700, fontSize: 12.5, color: "var(--red)" }}>
                  AI explanation is temporarily unavailable.
                </div>
                <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 2 }}>
                  Your security analysis is still available below.
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
              {onRetry && (
                <button 
                  type="button" 
                  onClick={onRetry} 
                  className="btn-cg primary w-full sm:w-auto"
                  style={{ fontSize: 12, height: 38, padding: "0 16px" }}
                >
                  <RefreshCw size={13} />
                  <span>Try AI Analysis Again</span>
                </button>
              )}
              {onAskAi && (
                <button 
                  type="button" 
                  onClick={onAskAi} 
                  className="btn-cg ai w-full sm:w-auto"
                  style={{ fontSize: 12, height: 38, padding: "0 16px" }}
                >
                  <Bot size={14} />
                  <span>Ask AI About This Scan</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* ─── 3. SUCCESS / COMPLETE EXPLANATION STATE ─── */}
        {!isLoading && !isAiUnavailable && (
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            
            {/* Section 1: Simple Summary Callout */}
            <div 
              style={{ 
                padding: "14px 18px", 
                borderRadius: 10, 
                background: "linear-gradient(135deg, rgba(168,85,247,0.08), rgba(59,130,255,0.08))",
                border: "1px solid rgba(168,85,247,0.22)"
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#c084fc", marginBottom: 6, display: "flex", alignItems: "center", gap: 5 }}>
                <Info size={13} />
                <span>Security Summary</span>
              </div>
              <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6, color: "var(--foreground)", fontWeight: 500 }}>
                {summary}
              </p>
            </div>

            {/* Section 2: What does this result mean? */}
            <div>
              <h4 style={{ margin: "0 0 6px", fontSize: 13, fontWeight: 700, color: "var(--foreground)", display: "flex", alignItems: "center", gap: 6 }}>
                <HelpCircle size={15} style={{ color: "var(--blue)" }} />
                <span>What does this result mean?</span>
              </h4>
              <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.65, color: "var(--foreground)", opacity: 0.9 }}>
                {whatItMeans}
              </p>
            </div>

            {/* Section 3: Why It Matters & Key Indicators */}
            <div>
              <h4 style={{ margin: "0 0 6px", fontSize: 13, fontWeight: 700, color: "var(--foreground)", display: "flex", alignItems: "center", gap: 6 }}>
                <ShieldAlert size={15} style={{ color: safeThreatLevel === "SAFE" ? "var(--green)" : "var(--amber)" }} />
                <span>Why this matters & key indicators</span>
              </h4>
              {whyItMatters && (
                <p style={{ margin: "0 0 8px", fontSize: 12, lineHeight: 1.6, color: "var(--muted)" }}>
                  {whyItMatters}
                </p>
              )}
              {keyIndicators.length > 0 ? (
                <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 6 }}>
                  {keyIndicators.map((ind, i) => (
                    <li 
                      key={`ind-${i}`} 
                      style={{ 
                        display: "flex", 
                        alignItems: "flex-start", 
                        gap: 8, 
                        fontSize: 12, 
                        lineHeight: 1.5,
                        color: "var(--foreground)"
                      }}
                    >
                      <span style={{ color: "#c084fc", fontWeight: 700 }}>•</span>
                      <span>{ind}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p style={{ margin: 0, fontSize: 12, color: "var(--muted)" }}>
                  Verified multi-source intelligence feeds confirmed the current rating.
                </p>
              )}
            </div>

            {/* Section 4: What should you do? */}
            <div>
              <h4 style={{ margin: "0 0 8px", fontSize: 13, fontWeight: 700, color: "var(--foreground)", display: "flex", alignItems: "center", gap: 6 }}>
                <CheckCircle2 size={15} style={{ color: "var(--green)" }} />
                <span>What should you do?</span>
              </h4>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 6 }}>
                {recommendations.map((rec, i) => (
                  <li 
                    key={`rec-${i}`} 
                    style={{ 
                      display: "flex", 
                      alignItems: "flex-start", 
                      gap: 8, 
                      fontSize: 12, 
                      lineHeight: 1.5,
                      color: "var(--foreground)"
                    }}
                  >
                    <span style={{ color: "var(--blue)", fontWeight: 700 }}>•</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Section 5: Safety Note */}
            <div 
              style={{ 
                padding: "11px 15px", 
                borderRadius: 8, 
                background: "rgba(59,130,246,0.06)", 
                border: "1px solid rgba(59,130,246,0.2)", 
                fontSize: 11.5, 
                color: "var(--muted)", 
                lineHeight: 1.55, 
                display: "flex", 
                alignItems: "flex-start", 
                gap: 9 
              }}
            >
              <ShieldCheck size={15} style={{ color: "var(--blue)", marginTop: 2, flexShrink: 0 }} />
              <span>{userSafetyMessage}</span>
            </div>

            {/* Section 6: Action Footer with [ Ask AI About This Scan ] Button */}
            <div 
              style={{ 
                marginTop: 6, 
                paddingTop: 16, 
                borderTop: "1px solid var(--line)", 
                display: "flex", 
                justifyContent: "space-between", 
                alignItems: "center", 
                flexWrap: "wrap", 
                gap: 12 
              }}
            >
              <div style={{ fontSize: 11.5, color: "var(--muted)", maxWidth: 440 }}>
                Need more help? Ask follow-up questions about this scan without rerunning the analysis.
              </div>

              {onAskAi && (
                <button
                  type="button"
                  onClick={onAskAi}
                  className="btn-cg ai w-full sm:w-auto"
                  style={{
                    height: 40,
                    padding: "0 20px",
                    fontSize: 12.5,
                    fontWeight: 700,
                    borderRadius: 8,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                  }}
                >
                  <Bot size={15} />
                  <span>Ask AI About This Scan</span>
                  <ArrowRight size={13} />
                </button>
              )}
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
