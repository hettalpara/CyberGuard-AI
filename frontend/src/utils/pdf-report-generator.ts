// ============================================================================
// PDF Security Scan Report Generator
// Generates professional PDF report downloads for URL Security Analyses
// ============================================================================

export interface PdfScanData {
  reportId: string;
  url: string;
  normalizedUrl: string;
  riskScore: number;
  threatLevel: string;
  ssl: { valid: boolean; issuer: string; validDaysRemaining: number };
  whois: { registrar: string; createdDate: string; domainAgeDays: number };
  safeBrowsing: { match: boolean; threatType?: string };
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

  const riskBadgeColor = data.riskScore >= 70 ? "#EF4444" : data.riskScore >= 35 ? "#F59E0B" : "#22C55E";

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Security Analysis Report - ${data.reportId}</title>
      <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #1F2937; margin: 40px; line-height: 1.5; background: #fff; }
        .header { border-b: 2px solid #E5E7EB; padding-bottom: 20px; margin-bottom: 25px; display: flex; justify-content: space-between; align-items: center; }
        .logo { font-size: 20px; font-weight: bold; color: #10B981; }
        .badge { background: ${riskBadgeColor}; color: white; padding: 6px 14px; border-radius: 6px; font-size: 14px; font-weight: bold; display: inline-block; }
        .section { margin-bottom: 25px; background: #F8FAFC; border: 1px solid #E5E7EB; border-radius: 8px; padding: 18px; }
        .section-title { font-size: 14px; font-weight: bold; text-transform: uppercase; color: #64748B; margin-bottom: 12px; letter-spacing: 0.5px; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 13px; }
        .label { color: #64748B; font-weight: 500; }
        .value { font-weight: 600; color: #1F2937; word-break: break-all; }
        .ai-box { background: #ECFDF5; border: 1px solid #A7F3D0; padding: 15px; border-radius: 8px; font-size: 13px; color: #065F46; line-height: 1.6; }
        .action-item { font-size: 13px; padding: 6px 0; border-bottom: 1px solid #E5E7EB; }
        .footer { border-top: 1px solid #E5E7EB; margin-top: 40px; padding-top: 15px; font-size: 11px; color: #9CA3AF; text-align: center; }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <div class="logo">🛡️ AI Cyber Crime Assistance Platform</div>
          <div style="font-size: 12px; color: #64748B; margin-top: 4px;">Official Smart URL Security Analysis Report</div>
        </div>
        <div>
          <span class="badge">RISK SCORE: ${data.riskScore}/100 (${data.threatLevel})</span>
        </div>
      </div>

      <div class="section">
        <div class="section-title">Scan Overview</div>
        <div class="grid">
          <div><span class="label">Report ID:</span> <span class="value">${data.reportId}</span></div>
          <div><span class="label">Scan Timestamp:</span> <span class="value">${data.timestamp}</span></div>
          <div><span class="label">Submitted URL:</span> <span class="value">${data.url}</span></div>
          <div><span class="label">Normalized URL:</span> <span class="value">${data.normalizedUrl}</span></div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">Technical Security Inspection</div>
        <div class="grid">
          <div><span class="label">SSL Certificate Status:</span> <span class="value">${data.ssl.valid ? "✓ Valid & Secure" : "⚠️ Untrusted / Expired"} (${data.ssl.issuer})</span></div>
          <div><span class="label">Domain Age & WHOIS:</span> <span class="value">${data.whois.domainAgeDays} Days Old (${data.whois.registrar})</span></div>
          <div><span class="label">Google Safe Browsing:</span> <span class="value">${data.safeBrowsing.match ? "🔴 Threat Flagged (" + data.safeBrowsing.threatType + ")" : "🟢 No Threat Match"}</span></div>
          <div><span class="label">VirusTotal Engine Ratio:</span> <span class="value">${data.virusTotal.detectionRatio} Engines Flagged</span></div>
        </div>
      </div>

      <div class="section-title">Gemini AI Security Explanation</div>
      <div class="ai-box">
        ${data.aiExplanation}
      </div>

      <div style="margin-top: 25px;">
        <div class="section-title">Recommended Safety Actions</div>
        ${data.recommendedActions.map((action, i) => `<div class="action-item"><strong>${i + 1}.</strong> ${action}</div>`).join("")}
      </div>

      <div class="footer">
        Generated automatically by AI Cyber Crime Assistance Platform • Phishing URL Detection Engine • Academic Major Project
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
