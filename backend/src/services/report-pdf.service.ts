// ============================================================================
// Report PDF Generation Service — Phase 8
// Uses PDFKit to stream high-fidelity, professional cybersecurity incident reports.
// Generates vector layouts with executive summaries, threat intelligence metrics,
// AI synthesis, user notes, and official regulatory disclaimers.
// ============================================================================

import PDFDocument from "pdfkit";
import { IIncidentReport } from "../models/IncidentReport";

/**
 * Redacts sensitive query parameter values (tokens, passwords, secrets, session IDs)
 * from URLs before printing into reports.
 */
function sanitizeUrl(rawUrl: string): string {
  try {
    const parsed = new URL(rawUrl);
    const sensitiveKeys = ["token", "password", "pass", "pwd", "auth", "jwt", "secret", "key", "access_token", "api_key", "session", "otp", "code"];
    parsed.searchParams.forEach((_val, key) => {
      if (sensitiveKeys.some((s) => key.toLowerCase().includes(s))) {
        parsed.searchParams.set(key, "[REDACTED]");
      }
    });
    return decodeURIComponent(parsed.toString());
  } catch {
    return rawUrl;
  }
}

function formatDate(date?: Date | string | null): string {
  if (!date) return "N/A";
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return "N/A";
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, "0");
    const mins = String(d.getMinutes()).padStart(2, "0");
    return `${day}/${month}/${year} ${hours}:${mins}`;
  } catch {
    return "N/A";
  }
}

function getRiskColorHex(level: string): string {
  switch (level?.toUpperCase()) {
    case "CRITICAL":
      return "#DC2626"; // red-600
    case "HIGH":
      return "#EA580C"; // orange-600
    case "MEDIUM":
    case "MODERATE":
      return "#D97706"; // amber-600
    case "LOW":
      return "#CA8A04"; // yellow-600
    case "SAFE":
      return "#16A34A"; // green-600
    default:
      return "#4B5563"; // gray-600
  }
}

export async function generateIncidentReportPdf(report: IIncidentReport): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      compress: false,
      size: "A4",
      margins: { top: 40, bottom: 40, left: 45, right: 45 },
      info: {
        Title: `CyberGuard Incident Report - ${report.reportId}`,
        Author: "CyberGuard AI Platform",
        Subject: `Cybercrime Incident Report: ${report.incidentType}`,
        CreationDate: new Date(),
      },
    });

    const chunks: Buffer[] = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", (err) => reject(err));

    const snap = report.snapshot;
    const safeUrl = sanitizeUrl(snap.url || snap.normalizedUrl || "N/A");
    const riskLevelColor = getRiskColorHex(snap.riskLevel);
    const contentWidth = doc.page.width - 90; // 595.28 - 90 = 505.28

    // Helper: draw section divider
    const drawSectionHeader = (title: string, yPos?: number) => {
      if (yPos) doc.y = yPos;
      if (doc.y > 720) doc.addPage();
      doc
        .moveDown(0.5)
        .rect(45, doc.y, contentWidth, 20)
        .fill("#0F172A") // slate-900
        .fillColor("#FFFFFF")
        .fontSize(9)
        .font("Helvetica-Bold")
        .text(title.toUpperCase(), 55, doc.y + 5)
        .fillColor("#1F2937")
        .moveDown(1);
    };

    // Helper: draw key-value pair
    const drawField = (label: string, value: string, indent = 45) => {
      if (doc.y > 740) doc.addPage();
      doc
        .font("Helvetica-Bold")
        .fontSize(9)
        .fillColor("#475569")
        .text(`${label}: `, indent, doc.y, { continued: true })
        .font("Helvetica")
        .fillColor("#0F172A")
        .text(value)
        .moveDown(0.2);
    };

    // ─── Document Header ──────────────────────────────────────────
    doc
      .rect(45, 40, contentWidth, 60)
      .fill("#F8FAFC")
      .strokeColor("#E2E8F0")
      .lineWidth(1)
      .stroke();

    doc
      .fillColor("#10B981") // emerald-500
      .fontSize(16)
      .font("Helvetica-Bold")
      .text("CYBERGUARD AI", 55, 50);

    doc
      .fontSize(10)
      .fillColor("#64748B")
      .font("Helvetica")
      .text("CYBERCRIME INCIDENT REPORT", 55, 70);

    // Right-aligned header metadata
    doc
      .fontSize(8)
      .font("Helvetica-Bold")
      .fillColor("#334155")
      .text(`Report ID: ${report.reportId}`, 360, 48, { align: "right", width: 180 })
      .font("Helvetica")
      .fillColor("#64748B")
      .text(`Status: ${report.status}`, 360, 60, { align: "right", width: 180 })
      .text(`Generated: ${formatDate(report.generatedAt || new Date())}`, 360, 72, { align: "right", width: 180 });

    doc.y = 115;

    // ─── 1. INCIDENT SUMMARY ──────────────────────────────────────
    drawSectionHeader("1. Incident Summary");

    drawField("Incident Type", report.incidentType);
    drawField("Report Title", report.title);
    drawField("Incident Date", formatDate(report.incidentDate));
    if (report.source) drawField("Platform / Source", report.source);
    if (report.affectedAccount) drawField("Affected Account Identifier", report.affectedAccount);

    doc
      .moveDown(0.3)
      .font("Helvetica-Bold")
      .fontSize(9)
      .fillColor("#475569")
      .text("Incident Description:", 45)
      .font("Helvetica")
      .fillColor("#1E293B")
      .fontSize(8.5)
      .text(report.description || "No description provided.", {
        width: contentWidth,
        align: "justify",
      })
      .moveDown(0.5);

    // ─── 2. ANALYZED URL & RISK ASSESSMENT ────────────────────────
    drawSectionHeader("2. Analyzed URL & Deterministic Risk Rating");

    doc
      .font("Helvetica-Bold")
      .fontSize(9)
      .fillColor("#475569")
      .text("Target URL: ", 45, doc.y, { continued: true })
      .font("Courier")
      .fontSize(8)
      .fillColor("#0F172A")
      .text(safeUrl, { width: contentWidth })
      .moveDown(0.4);

    // Risk Meter Box
    const boxY = doc.y;
    doc
      .rect(45, boxY, contentWidth, 38)
      .fill("#F1F5F9")
      .strokeColor("#CBD5E1")
      .lineWidth(0.8)
      .stroke();

    const scoreDisplay = snap.riskScore !== null ? `${snap.riskScore} / 100` : "INCONCLUSIVE";

    doc
      .font("Helvetica-Bold")
      .fontSize(10)
      .fillColor("#1E293B")
      .text("Risk Score:", 55, boxY + 8)
      .fillColor(riskLevelColor)
      .fontSize(14)
      .text(scoreDisplay, 125, boxY + 6);

    doc
      .font("Helvetica-Bold")
      .fontSize(10)
      .fillColor("#1E293B")
      .text("Risk Level:", 240, boxY + 8)
      .fillColor(riskLevelColor)
      .fontSize(12)
      .text(snap.riskLevel.toUpperCase(), 305, boxY + 7);

    doc
      .font("Helvetica-Bold")
      .fontSize(10)
      .fillColor("#1E293B")
      .text("Confidence:", 410, boxY + 8)
      .font("Helvetica")
      .fillColor("#334155")
      .fontSize(11)
      .text(`${snap.confidence}%`, 480, boxY + 7);

    doc.y = boxY + 48;

    // ─── 3. TECHNICAL SECURITY ANALYSIS ───────────────────────────
    drawSectionHeader("3. Multi-Engine Threat Intelligence");

    // Google Safe Browsing
    const sb = snap.safeBrowsing;
    const sbStatus = sb?.available ? (sb?.threatDetected ? "THREAT DETECTED" : "CHECKED CLEAN") : "UNAVAILABLE";
    const sbTypes = sb?.threatTypes && sb.threatTypes.length > 0 ? sb.threatTypes.join(", ") : "None matched";
    drawField("Google Safe Browsing", `${sbStatus} (${sbTypes}) — ${sb?.reason || "No detail"}`);

    // VirusTotal
    const vt = snap.virusTotal;
    const vtRatio = vt?.detectionRatio || `${vt?.maliciousCount || 0} / ${vt?.totalEngines || 70} engines flagged`;
    const vtStatus = vt?.available ? (vt?.malicious ? "THREAT FLAGGED" : "CHECKED CLEAN") : "UNAVAILABLE";
    drawField("VirusTotal Multi-Engine", `${vtStatus} — Ratio: ${vtRatio}`);

    // URLhaus
    const uh = snap.urlhaus;
    const uhStatus = uh?.available ? (uh?.match ? `MALWARE ACTIVE (${uh?.threatType || "malware"})` : "NO MATCH") : "UNAVAILABLE";
    const uhTags = uh?.tags && uh.tags.length > 0 ? ` [Tags: ${uh.tags.join(", ")}]` : "";
    drawField("URLhaus Malware Database", `${uhStatus}${uhTags}`);

    // Local URL Intelligence
    const intel = snap.urlIntelligence;
    const intelScore = intel?.score !== null && intel?.score !== undefined ? `${intel.score}/100 (${intel.level || "N/A"})` : "Not evaluated";
    const intelIndicators = intel?.indicators && intel.indicators.length > 0 ? intel.indicators.map((i) => i.name).join(", ") : "None";
    drawField("Local URL Intelligence", `${intelScore} — Indicators: ${intelIndicators}`);

    // SSL/TLS Analysis
    const ssl = snap.sslAnalysis || snap.ssl;
    const sslStatus = snap.sslAnalysis
      ? `${snap.sslAnalysis.status} (${snap.sslAnalysis.protocol}) — ${snap.sslAnalysis.reason || ""}`
      : snap.ssl
      ? `${snap.ssl.valid ? "VALID HTTPS" : "INSECURE / PLAIN HTTP"} (${snap.ssl.issuer || "None"})`
      : "Not evaluated";
    drawField("SSL / TLS Encryption", sslStatus);

    // ─── 4. GEMINI AI SECURITY ANALYSIS ───────────────────────────
    drawSectionHeader("4. Gemini AI Security Synthesis");

    const ai = snap.aiAnalysis;
    if (ai && ai.available && ai.summary) {
      drawField("AI Executive Summary", ai.summary);
      if (ai.threatType) drawField("Identified Threat Category", ai.threatType);
      if (ai.explanation) {
        doc
          .font("Helvetica-Bold")
          .fontSize(8.5)
          .fillColor("#475569")
          .text("Detailed Security Explanation:", 45)
          .font("Helvetica")
          .fillColor("#1E293B")
          .fontSize(8)
          .text(ai.explanation, { width: contentWidth, align: "justify" })
          .moveDown(0.4);
      }

      if (ai.keyIndicators && ai.keyIndicators.length > 0) {
        doc
          .font("Helvetica-Bold")
          .fontSize(8.5)
          .fillColor("#475569")
          .text("Key Technical Indicators:", 45);
        ai.keyIndicators.forEach((ind) => {
          doc
            .font("Helvetica")
            .fontSize(8)
            .fillColor("#1E293B")
            .text(` • ${ind}`, 55);
        });
        doc.moveDown(0.3);
      }

      if (ai.recommendedActions && ai.recommendedActions.length > 0) {
        doc
          .font("Helvetica-Bold")
          .fontSize(8.5)
          .fillColor("#475569")
          .text("Recommended Defensive Countermeasures:", 45);
        ai.recommendedActions.forEach((action, idx) => {
          doc
            .font("Helvetica")
            .fontSize(8)
            .fillColor("#1E293B")
            .text(` ${idx + 1}. ${action}`, 55);
        });
        doc.moveDown(0.3);
      }

      if (ai.confidenceNote) {
        drawField("AI Confidence Assessment", ai.confidenceNote);
      }
    } else {
      doc
        .font("Helvetica-Oblique")
        .fontSize(8.5)
        .fillColor("#64748B")
        .text("AI security explanation was unavailable at the time of analysis.", 45)
        .moveDown(0.4);
    }

    // ─── 5. USER INFORMATION & INVESTIGATION NOTES ────────────────
    drawSectionHeader("5. User Notes & Evidence Context");

    doc
      .font("Helvetica")
      .fontSize(8.5)
      .fillColor("#1E293B")
      .text(report.userNotes || "No additional user notes entered for this incident.", {
        width: contentWidth,
      })
      .moveDown(0.5);

    // ─── 6. REPORT METADATA ───────────────────────────────────────
    drawSectionHeader("6. Audit Metadata & Verification");

    drawField("Report Identifier", report.reportId);
    drawField("Record Created", formatDate(report.createdAt));
    drawField("Last Updated", formatDate(report.updatedAt));
    drawField("Snapshot Timestamp", formatDate(snap.scannedAt));
    drawField("Current Lifecycle Status", report.status);

    // ─── 7. REGULATORY & SAFETY DISCLAIMER ────────────────────────
    if (doc.y > 670) doc.addPage();
    doc.moveDown(0.5);

    doc
      .rect(45, doc.y, contentWidth, 58)
      .fill("#FEF2F2") // red-50
      .strokeColor("#FECACA")
      .lineWidth(0.8)
      .stroke();

    const discY = doc.y + 6;
    doc
      .font("Helvetica-Bold")
      .fontSize(7.5)
      .fillColor("#991B1B") // red-800
      .text("OFFICIAL ADVISORY & STATUTORY NOTICE:", 55, discY)
      .font("Helvetica")
      .fontSize(7)
      .fillColor("#7F1D1D")
      .text(
        "This report summarizes the security signals available to CyberGuard AI at the time of analysis. A security scan cannot guarantee that a website is completely safe or malicious. Users should verify important incidents through trusted official channels. If financial fraud or identity theft has occurred, immediately contact National Cyber Crime Helpline at 1930 or file a formal complaint at https://cybercrime.gov.in.",
        55,
        discY + 11,
        { width: contentWidth - 20, align: "justify" }
      );

    // Footer on all pages
    const range = doc.bufferedPageRange();
    for (let i = range.start; i < range.start + range.count; i++) {
      doc.switchToPage(i);
      doc
        .fontSize(7)
        .font("Helvetica")
        .fillColor("#94A3B8")
        .text(
          `CyberGuard AI • Incident Report ${report.reportId} • Confidential • Page ${i + 1} of ${range.count}`,
          45,
          doc.page.height - 25,
          { align: "center", width: contentWidth }
        );
    }

    doc.end();
  });
}
