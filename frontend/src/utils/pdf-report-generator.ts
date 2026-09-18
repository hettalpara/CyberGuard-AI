// ============================================================================
// PDF Security Scan Report Generator
// Generates professional PDF report downloads for URL Security Analyses
// ============================================================================

export interface PdfScanData {
  reportId: string;
  url: string;
  normalizedUrl: string;
  riskScore: number | null;
  threatLevel: string;
  confidence?: number;
  ssl?: { valid: boolean; issuer: string; validDaysRemaining?: number };
  sslAnalysis?: {
    protocol?: string;
    certificateStatus?: string;
    score?: number | null;
    status?: string;
    issuer?: string;
    reasons?: string[];
  };
  safeBrowsing?: { match: boolean; threatType?: string; status?: string };
  urlhaus?: { match: boolean; threatType?: string; status?: string };
  urlIntelligence?: { score: number | null; riskLevel?: string; status?: string; indicators?: string[]; reasons?: string[] };
  virusTotal: { detectionRatio: string; enginesFlagged: number; totalEngines: number };
  aiExplanation: string;
  recommendedActions: string[];
  timestamp: string;
}

export function generatePdfReport(data: PdfScanData) {
  if (typeof window === "undefined") return;

  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    alert("Please allow popups to download the security report PDF.");
    return;
  }

  const riskBadgeColor =
    data.riskScore === null
      ? "#64748B"
      : data.riskScore >= 80
      ? "#EF4444"
      : data.riskScore >= 60
      ? "#F97316"
      : data.riskScore >= 40
      ? "#F59E0B"
      : data.riskScore >= 20
      ? "#EAB308"
      : "#22C55E";

  const safeBrowsingText = data.safeBrowsing?.match
    ? `⚠️ Potentially Unsafe (${data.safeBrowsing.threatType || "Suspected Threat"})`
    : data.safeBrowsing?.status === "UNAVAILABLE"
    ? "⚪ Service Unavailable"
    : "🟢 No Threat Listed";

  const urlhausText = data.urlhaus?.match
    ? `🔴 Active Malware Match (${data.urlhaus.threatType || "malware_download"})`
    : data.urlhaus?.status === "UNAVAILABLE"
    ? "⚪ Service Unavailable"
    : "🟢 No Matching Malware Record";

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Security Analysis Report - ${data.reportId}</title>
      <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #1F2937; margin: 40px; line-height: 1.5; background: #fff; }
        .header { border-bottom: 2px solid #E5E7EB; padding-bottom: 20px; margin-bottom: 25px; display: flex; justify-content: space-between; align-items: center; }
        .logo { font-size: 20px; font-weight: bold; color: #10B981; }
        .badge { background: ${riskBadgeColor}; color: white; padding: 6px 14px; border-radius: 6px; font-size: 14px; font-weight: bold; display: inline-block; }
        .section { margin-bottom: 25px; background: #F8FAFC; border: 1px solid #E5E7EB; border-radius: 8px; padding: 18px; }
        .section-title { font-size: 14px; font-weight: bold; text-transform: uppercase; color: #64748B; margin-bottom: 12px; letter-spacing: 0.5px; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 13px; }
        .label { color: #64748B; font-weight: 500; }
        .value { font-weight: 600; color: #1F2937; word-break: break-all; }
        .ai-box { background: #ECFDF5; border: 1px solid #A7F3D0; padding: 15px; border-radius: 8px; font-size: 13px; color: #065F46; line-height: 1.6; }
        .attribution-box { background: #FEF3C7; border: 1px solid #FDE68A; padding: 12px; border-radius: 6px; font-size: 11px; color: #92400E; margin-top: 15px; }
        .action-item { font-size: 13px; padding: 6px 0; border-bottom: 1px solid #E5E7EB; }
        .footer { border-top: 1px solid #E5E7EB; margin-top: 40px; padding-top: 15px; font-size: 11px; color: #9CA3AF; text-align: center; }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <div class="logo">🛡️ CyberGuard AI Platform</div>
          <div style="font-size: 12px; color: #64748B; margin-top: 4px;">Smart URL Threat Intelligence & Security Report</div>
        </div>
        <div>
          <span class="badge">RISK SCORE: ${data.riskScore !== null ? `${data.riskScore}/100` : "INCONCLUSIVE"} (${data.threatLevel})</span>
        </div>
      </div>

      <div class="section">
        <div class="section-title">Scan Overview</div>
        <div class="grid">
          <div><span class="label">Report ID:</span> <span class="value">${data.reportId}</span></div>
          <div><span class="label">Scan Timestamp:</span> <span class="value">${data.timestamp}</span></div>
          <div><span class="label">Submitted URL:</span> <span class="value">${data.url}</span></div>
          <div><span class="label">Normalized Destination:</span> <span class="value">${data.normalizedUrl}</span></div>
          <div><span class="label">Confidence Rating:</span> <span class="value">${data.confidence ?? 85}%</span></div>
          <div><span class="label">Risk Classification:</span> <span class="value">${data.threatLevel}</span></div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">Technical Security Intelligence</div>
        <div class="grid">
          <div><span class="label">SSL / Encryption:</span> <span class="value">${
            data.sslAnalysis
              ? `${data.sslAnalysis.certificateStatus || (data.ssl?.valid ? "VALID" : "UNTRUSTED")} (${data.sslAnalysis.protocol || (data.ssl?.valid ? "HTTPS" : "HTTP")})`
              : data.ssl ? (data.ssl.valid ? "✓ Valid HTTPS" : "⚠️ Plain HTTP / Untrusted") + ` (${data.ssl.issuer || "None"})` : "Not Evaluated"
          }</span></div>
          <div><span class="label">URL Intelligence:</span> <span class="value">${
            data.urlIntelligence
              ? `Score: ${data.urlIntelligence.score ?? "N/A"} (${data.urlIntelligence.riskLevel || "N/A"})${data.urlIntelligence.indicators?.length ? ` - ${data.urlIntelligence.indicators.map((i: any) => typeof i === "string" ? i : i.name || i.reason || "Suspicious Indicator").join(", ")}` : ""}`
              : "Not Evaluated"
          }</span></div>
          <div><span class="label">Google Safe Browsing:</span> <span class="value">${safeBrowsingText}</span></div>
          <div><span class="label">URLhaus Malware:</span> <span class="value">${urlhausText}</span></div>
          <div><span class="label">VirusTotal Consensus:</span> <span class="value">${data.virusTotal.detectionRatio} Engines Flagged</span></div>
        </div>
        ${
          data.safeBrowsing?.match
            ? `<div class="attribution-box">
                <strong>Google Safe Browsing Advisory Notice:</strong> Google Safe Browsing identified this URL on an unsafe-resource list. 
                Advisory information is provided for defensive awareness. For additional guidance, visit 
                <a href="https://developers.google.com/search/docs/monitor-debug/security" target="_blank" rel="noopener noreferrer" style="color:#92400E; text-decoration:underline;">Google Search Central Security Guidelines</a>.
               </div>`
            : ""
        }
      </div>

      <div class="section-title">Gemini AI Security Synthesis</div>
      <div class="ai-box">
        ${data.aiExplanation}
      </div>

      <div style="margin-top: 25px;">
        <div class="section-title">Recommended Safety Actions</div>
        ${data.recommendedActions.map((action, i) => `<div class="action-item"><strong>${i + 1}.</strong> ${action}</div>`).join("")}
      </div>

      <div class="footer">
        Generated automatically by CyberGuard AI • Advanced Threat Intelligence Platform • Academic Project
      </div>

      <script>
        window.onload = function() {
          window.print();
        };
      </script>
    </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(htmlContent);
  printWindow.document.close();
}
