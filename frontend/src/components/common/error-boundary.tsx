"use client";

import React, { Component, type ReactNode } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";

export interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  fallbackTitle?: string;
  fallbackMessage?: string;
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error("[ErrorBoundary caught an unhandled error]:", error, errorInfo);
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="card-cg" style={{ padding: 24, margin: "16px 0", borderColor: "rgba(239,68,68,.3)" }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
            <AlertCircle size={22} color="var(--red)" style={{ marginTop: 2, flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <h3 style={{ margin: "0 0 6px 0", fontSize: 14, color: "var(--text)" }}>
                {this.props.fallbackTitle || "Analysis could not be displayed."}
              </h3>
              <p style={{ margin: "0 0 14px 0", fontSize: 11, color: "var(--muted)", lineHeight: 1.5 }}>
                {this.props.fallbackMessage || "Something went wrong while processing this analysis."}
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
                onClick={this.handleReset}
                className="btn-cg primary"
                style={{ fontSize: 11, padding: "6px 14px" }}
              >
                <RefreshCw size={12} style={{ marginRight: 6 }} />
                <span>Try Again</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
