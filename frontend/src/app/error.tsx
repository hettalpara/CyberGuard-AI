"use client";

import React, { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Route Error Boundary caught]:", error);
  }, [error]);

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "var(--bg)",
      padding: 24,
      fontFamily: "Inter, sans-serif"
    }}>
      <div className="card-cg" style={{ maxWidth: 520, width: "100%", padding: 28, textAlign: "center" }}>
        <div style={{
          width: 48,
          height: 48,
          borderRadius: "50%",
          background: "rgba(239,68,68,.12)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 16px"
        }}>
          <AlertTriangle size={24} color="var(--red)" />
        </div>
        <h2 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 8px", color: "var(--text)" }}>
          Analysis could not be displayed.
        </h2>
        <p style={{ fontSize: 12, color: "var(--muted)", margin: "0 0 20px", lineHeight: 1.6 }}>
          Something went wrong while processing or rendering this view. You can reload or try again. Technical error details are available in the browser console.
        </p>
        <div style={{ display: "flex", justifyContent: "center", gap: 10 }}>
          <button
            type="button"
            onClick={() => reset()}
            className="btn-cg primary"
            style={{ padding: "8px 18px", fontSize: 12 }}
          >
            <RefreshCw size={13} style={{ marginRight: 6 }} />
            <span>Try Again</span>
          </button>
        </div>
      </div>
    </div>
  );
}
