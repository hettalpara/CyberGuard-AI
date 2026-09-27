"use client";

import React, { Component, type ReactNode } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";

interface AnalyzerErrorBoundaryProps {
  children: ReactNode;
  onRetry?: () => void;
}

interface AnalyzerErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class AnalyzerErrorBoundary extends Component<
  AnalyzerErrorBoundaryProps,
  AnalyzerErrorBoundaryState
> {
  constructor(props: AnalyzerErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): AnalyzerErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error("[AnalyzerErrorBoundary caught runtime render error]:", error, errorInfo);
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: null });
    if (this.props.onRetry) {
      this.props.onRetry();
    }
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div 
          className="card-cg" 
          style={{ 
            padding: 24, 
            marginTop: 14, 
            borderColor: "rgba(239,68,68,.3)", 
            background: "rgba(239,68,68,.03)" 
          }}
        >
          <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              background: "rgba(239,68,68,.12)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0
            }}>
              <AlertCircle size={20} color="var(--red)" />
            </div>

            <div style={{ flex: 1 }}>
              <h3 style={{ margin: "0 0 6px 0", fontSize: 14, color: "var(--text)", fontWeight: 700 }}>
                Unable to display analysis results.
              </h3>
              <p style={{ margin: "0 0 14px 0", fontSize: 11, color: "var(--muted)", lineHeight: 1.6 }}>
                Something went wrong while processing or rendering this analysis result. The URL input and analyzer controls remain fully operational. Technical error details have been logged to the browser console.
              </p>

              {this.state.error?.message && (
                <div style={{ 
                  margin: "0 0 14px 0", 
                  padding: "8px 12px", 
                  background: "var(--panel-2)", 
                  borderRadius: 6, 
                  fontSize: 10, 
                  fontFamily: "monospace", 
                  color: "var(--red)",
                  wordBreak: "break-all" 
                }}>
                  {this.state.error.message}
                </div>
              )}

              <button 
                type="button" 
                onClick={this.handleRetry}
                className="btn-cg primary"
                style={{ fontSize: 11, padding: "6px 14px" }}
              >
                <RefreshCw size={12} style={{ marginRight: 6 }} />
                <span>Retry Analysis</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
