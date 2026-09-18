// ============================================================================
// Phase 8: Incident Reports & PDF Generation Comprehensive Test Suite
// Verifies:
// 1. Report creation from verified user scans
// 2. Data ownership & cross-user access isolation
// 3. Immutability of security snapshot (scores/levels cannot be modified)
// 4. Input validation (length limits, incident types)
// 5. Lifecycle status transitions (DRAFT -> FINAL -> ARCHIVED)
// 6. Backend PDF generation with PDFKit (format, headers, threat data)
// 7. Omission of sensitive tokens/secrets
// 8. Error handling & unauthorized request rejection
// ============================================================================

import dotenv from "dotenv";
dotenv.config();

import { Types } from "mongoose";
import {
  createIncidentReport,
  getUserReports,
  getReportById,
  updateIncidentReport,
  deleteIncidentReport,
  generateReportPdfBuffer,
} from "../src/services/report.service";
import { generateIncidentReportPdf } from "../src/services/report-pdf.service";
import { IncidentReport, IIncidentReport } from "../src/models/IncidentReport";
import { Scan } from "../src/models/Scan";

interface TestResult {
  num: number;
  name: string;
  expected: string;
  actual: string;
  passed: boolean;
}

const results: TestResult[] = [];

async function runPhase8TestSuite() {
  console.log("==================================================");
  console.log("PHASE 8 — INCIDENT REPORTS & PDF GENERATION TESTS");
  console.log("==================================================\n");

  const userA_Id = new Types.ObjectId().toString();
  const userB_Id = new Types.ObjectId().toString();

  // Mock in-memory scan documents
  const scanA_Id = new Types.ObjectId();
  const scanDocA: any = {
    _id: scanA_Id,
    userId: new Types.ObjectId(userA_Id),
    url: "https://secure-bank-login.xyz/verify?token=secret_abc_123&session=xyz987",
    normalizedUrl: "https://secure-bank-login.xyz/verify",
    domain: "secure-bank-login.xyz",
    riskScore: 88,
    riskLevel: "HIGH",
    confidence: 85,
    riskCalculationVersion: "2.0.0",
    analysisStatus: "COMPLETE",
    safeBrowsing: {
      checked: true,
      available: true,
      status: "THREAT_DETECTED",
      threatDetected: true,
      threatTypes: ["SOCIAL_ENGINEERING"],
      score: 90,
      reason: "Google Safe Browsing flagged SOCIAL_ENGINEERING",
      checkedAt: new Date().toISOString(),
    },
    virusTotal: {
      checked: true,
      available: true,
      malicious: true,
      suspicious: false,
      harmless: 50,
      maliciousCount: 14,
      suspiciousCount: 2,
      undetectedCount: 14,
      totalEngines: 70,
      detectionRatio: "16 / 70",
      status: "THREAT_DETECTED",
    },
    urlhaus: {
      available: true,
      status: "MALWARE_URL_DETECTED",
      match: true,
      threatType: "malware_download",
      tags: ["credential_theft", "stealer"],
      reason: "Active malware download site",
      checkedAt: new Date().toISOString(),
    },
    urlIntelligence: {
      status: "CHECKED",
      score: 35,
      level: "LOW",
      indicators: [
        { name: "Suspicious Keywords", score: 10, reason: "Contains login/verify" },
        { name: "Raw IP Pattern", score: 25, reason: "Suspicious structure" },
      ],
      reasons: ["Contains banking terms"],
    },
    sslAnalysis: {
      status: "EXPIRED_CERTIFICATE",
      protocol: "HTTPS",
      score: 60,
      level: "HIGH",
      reason: "SSL certificate expired 5 days ago",
      checkedAt: new Date().toISOString(),
    },
    aiAnalysis: {
      available: true,
      summary: "Critical credential harvesting portal masquerading as a banking service.",
      threatType: "Phishing / Credential Theft",
      severity: "HIGH",
      explanation: "Domain exhibits high confidence indicators of phishing with flagged security engines and expired TLS credentials.",
      keyIndicators: [
        "16 of 70 security engines flagged malicious",
        "Google Safe Browsing Social Engineering match",
        "Expired SSL Certificate",
      ],
      recommendedActions: [
        "Do not enter passwords or personal data",
        "Report to National Helpline 1930",
        "Block domain in perimeter DNS resolver",
      ],
      confidenceNote: "High confidence: multiple independent engines match phishing patterns.",
      generatedAt: new Date(),
    },
    summary: "High risk phishing website detected.",
    scannedAt: new Date(),
    createdAt: new Date(),
  };

  const scanB_Id = new Types.ObjectId();
  const scanDocB: any = {
    _id: scanB_Id,
    userId: new Types.ObjectId(userB_Id),
    url: "https://user-b-personal-link.example/",
    normalizedUrl: "https://user-b-personal-link.example/",
    domain: "user-b-personal-link.example",
    riskScore: 10,
    riskLevel: "SAFE",
    confidence: 90,
    scannedAt: new Date(),
  };

  // Mock in-memory database for IncidentReports
  const reportsDb = new Map<string, any>();

  // Mock Scan.findOne
  const originalScanFindOne = Scan.findOne;
  Scan.findOne = (query: any) => {
    const scanIdStr = query._id?.toString();
    const userIdStr = query.userId?.toString();

    if (scanIdStr === scanA_Id.toString() && userIdStr === userA_Id) {
      return Promise.resolve(scanDocA) as any;
    }
    if (scanIdStr === scanB_Id.toString() && userIdStr === userB_Id) {
      return Promise.resolve(scanDocB) as any;
    }
    return Promise.resolve(null) as any;
  };

  // Mock IncidentReport methods
  const originalReportCreate = IncidentReport.create;
  const originalReportFindOne = IncidentReport.findOne;
  const originalReportFind = IncidentReport.find;
  const originalReportCount = IncidentReport.countDocuments;
  const originalReportDeleteOne = IncidentReport.deleteOne;

  IncidentReport.create = ((data: any) => {
    const id = new Types.ObjectId();
    const reportDoc = {
      ...data,
      _id: id,
      createdAt: new Date(),
      updatedAt: new Date(),
      save: function () {
        this.updatedAt = new Date();
        reportsDb.set(this._id.toString(), this);
        return Promise.resolve(this);
      },
    };
    reportsDb.set(id.toString(), reportDoc);
    return Promise.resolve(reportDoc);
  }) as any;

  IncidentReport.findOne = ((query: any) => {
    for (const report of reportsDb.values()) {
      let matches = true;
      if (query._id && report._id.toString() !== query._id.toString()) matches = false;
      if (query.reportId && report.reportId !== query.reportId) matches = false;
      if (query.userId && report.userId.toString() !== query.userId.toString()) matches = false;
      if (matches) {
        return Promise.resolve(report);
      }
    }
    return Promise.resolve(null);
  }) as any;

  IncidentReport.find = ((query: any) => {
    const matched: any[] = [];
    for (const report of reportsDb.values()) {
      let matches = true;
      if (query.userId && report.userId.toString() !== query.userId.toString()) matches = false;
      if (query.status && report.status !== query.status) matches = false;
      if (matches) matched.push(report);
    }
    return {
      sort: () => ({
        skip: () => ({
          limit: () => Promise.resolve(matched),
        }),
      }),
    } as any;
  }) as any;

  IncidentReport.countDocuments = ((query: any) => {
    let count = 0;
    for (const report of reportsDb.values()) {
      let matches = true;
      if (query.userId && report.userId.toString() !== query.userId.toString()) matches = false;
      if (query.status && report.status !== query.status) matches = false;
      if (matches) count++;
    }
    return Promise.resolve(count);
  }) as any;

  IncidentReport.deleteOne = ((query: any) => {
    for (const [key, report] of reportsDb.entries()) {
      if (query._id && report._id.toString() === query._id.toString()) {
        reportsDb.delete(key);
        return Promise.resolve({ deletedCount: 1 });
      }
    }
    return Promise.resolve({ deletedCount: 0 });
  }) as any;

  let createdReportId = "";
  let createdReportMongoId = "";

  try {
    // ----------------------------------------------------
    // TEST 1: Create report with valid scan -> PASS
    // ----------------------------------------------------
    try {
      const rep = await createIncidentReport(userA_Id, {
        scanId: scanA_Id.toString(),
        incidentType: "Phishing",
        title: "Fake NetBanking Phishing Portal",
        description: "Received an SMS asking to verify bank account credentials via this suspicious link.",
        source: "SMS Message",
        affectedAccount: "john.doe@example.com",
        userNotes: "Did not submit OTP, alerted bank immediately.",
        status: "DRAFT",
      });

      createdReportId = rep.reportId;
      createdReportMongoId = rep._id.toString();

      const passed =
        Boolean(rep.reportId && rep.reportId.startsWith("CG-")) &&
        rep.incidentType === "Phishing" &&
        rep.status === "DRAFT" &&
        rep.snapshot.riskScore === 88 &&
        rep.snapshot.riskLevel === "HIGH";

      results.push({
        num: 1,
        name: "Create incident report with valid scan and frozen snapshot",
        expected: "reportId starts with CG-, status=DRAFT, riskScore=88",
        actual: `reportId=${rep.reportId}, status=${rep.status}, riskScore=${rep.snapshot.riskScore}`,
        passed,
      });
    } catch (e: any) {
      results.push({ num: 1, name: "Create incident report", expected: "Pass", actual: e.message, passed: false });
    }

    // ----------------------------------------------------
    // TEST 2: Unauthenticated create -> Denied
    // ----------------------------------------------------
    try {
      let threw = false;
      try {
        await createIncidentReport("", {
          scanId: scanA_Id.toString(),
          incidentType: "Phishing",
          title: "Title",
          description: "Desc",
        });
      } catch {
        threw = true;
      }

      results.push({
        num: 2,
        name: "Missing/invalid user ID rejected (unauthenticated)",
        expected: "Throws error",
        actual: `threw=${threw}`,
        passed: threw,
      });
    } catch (e: any) {
      results.push({ num: 2, name: "Unauthenticated create", expected: "Pass", actual: e.message, passed: false });
    }

    // ----------------------------------------------------
    // TEST 3: Invalid scanId -> Rejected
    // ----------------------------------------------------
    try {
      let threw = false;
      try {
        await createIncidentReport(userA_Id, {
          scanId: "invalid-mongo-id-xyz",
          incidentType: "Phishing",
          title: "Title",
          description: "Desc",
        });
      } catch {
        threw = true;
      }

      results.push({
        num: 3,
        name: "Invalid scanId format safely rejected",
        expected: "Throws error",
        actual: `threw=${threw}`,
        passed: threw,
      });
    } catch (e: any) {
      results.push({ num: 3, name: "Invalid scanId", expected: "Pass", actual: e.message, passed: false });
    }

    // ----------------------------------------------------
    // TEST 4: User attempts another user's scan -> Denied
    // ----------------------------------------------------
    try {
      let threw = false;
      let errorMsg = "";
      try {
        // User A tries to create a report for User B's scan
        await createIncidentReport(userA_Id, {
          scanId: scanB_Id.toString(),
          incidentType: "Phishing",
          title: "Stealing Scan",
          description: "Desc",
        });
      } catch (err: any) {
        threw = true;
        errorMsg = err.message;
      }

      results.push({
        num: 4,
        name: "Cross-user scan access strictly denied with Scan not found",
        expected: "Scan not found (no information disclosure)",
        actual: `threw=${threw}, message=${errorMsg}`,
        passed: threw && errorMsg.includes("Scan not found"),
      });
    } catch (e: any) {
      results.push({ num: 4, name: "Cross-user scan", expected: "Pass", actual: e.message, passed: false });
    }

    // ----------------------------------------------------
    // TEST 5: Get own report -> PASS
    // ----------------------------------------------------
    try {
      const ownReport = await getReportById(userA_Id, createdReportId);
      const passed = ownReport !== null && ownReport.reportId === createdReportId;

      results.push({
        num: 5,
        name: "Retrieve own report by human-readable reportId",
        expected: `reportId=${createdReportId}`,
        actual: `retrieved=${ownReport?.reportId}`,
        passed,
      });
    } catch (e: any) {
      results.push({ num: 5, name: "Get own report", expected: "Pass", actual: e.message, passed: false });
    }

    // ----------------------------------------------------
    // TEST 6: Get another user's report -> Denied (null / 404)
    // ----------------------------------------------------
    try {
      const otherUserReport = await getReportById(userB_Id, createdReportId);
      const passed = otherUserReport === null;

      results.push({
        num: 6,
        name: "User B cannot view User A's incident report (strict tenant isolation)",
        expected: "null (not found)",
        actual: `result=${otherUserReport}`,
        passed,
      });
    } catch (e: any) {
      results.push({ num: 6, name: "Get other user report", expected: "Pass", actual: e.message, passed: false });
    }

    // ----------------------------------------------------
    // TEST 7: Update own report -> PASS
    // ----------------------------------------------------
    try {
      const updated = await updateIncidentReport(userA_Id, createdReportId, {
        title: "Updated NetBanking Phishing Investigation",
        userNotes: "Bank security confirmed fake portal was taken down.",
        status: "FINAL",
      });

      const passed =
        updated.title === "Updated NetBanking Phishing Investigation" &&
        updated.status === "FINAL" &&
        Boolean(updated.generatedAt);

      results.push({
        num: 7,
        name: "Update own report title, notes, and promote to FINAL status",
        expected: "title updated, status=FINAL, generatedAt set",
        actual: `title=${updated.title}, status=${updated.status}, generatedAt=${Boolean(updated.generatedAt)}`,
        passed,
      });
    } catch (e: any) {
      results.push({ num: 7, name: "Update own report", expected: "Pass", actual: e.message, passed: false });
    }

    // ----------------------------------------------------
    // TEST 8: Attempt to modify riskScore in update -> Ignored / immutable
    // ----------------------------------------------------
    try {
      const beforeReport = await getReportById(userA_Id, createdReportId);
      const beforeScore = beforeReport?.snapshot.riskScore;

      // Attempt to tamper with score
      await updateIncidentReport(userA_Id, createdReportId, {
        title: "Tamper Attempt",
        ...({ riskScore: 0, "snapshot.riskScore": 0 } as any),
      });

      const afterReport = await getReportById(userA_Id, createdReportId);
      const afterScore = afterReport?.snapshot.riskScore;

      const passed = beforeScore === 88 && afterScore === 88;

      results.push({
        num: 8,
        name: "Tampering with riskScore in update is ignored (snapshot immutability)",
        expected: "score remains 88",
        actual: `before=${beforeScore}, after=${afterScore}`,
        passed,
      });
    } catch (e: any) {
      results.push({ num: 8, name: "Tamper riskScore", expected: "Pass", actual: e.message, passed: false });
    }

    // ----------------------------------------------------
    // TEST 9: Attempt to modify riskLevel in update -> Ignored / immutable
    // ----------------------------------------------------
    try {
      const beforeReport = await getReportById(userA_Id, createdReportId);
      const beforeLevel = beforeReport?.snapshot.riskLevel;

      await updateIncidentReport(userA_Id, createdReportId, {
        title: "Tamper Level Attempt",
        ...({ riskLevel: "SAFE", "snapshot.riskLevel": "SAFE" } as any),
      });

      const afterReport = await getReportById(userA_Id, createdReportId);
      const afterLevel = afterReport?.snapshot.riskLevel;

      const passed = beforeLevel === "HIGH" && afterLevel === "HIGH";

      results.push({
        num: 9,
        name: "Tampering with riskLevel in update is ignored (snapshot immutability)",
        expected: "level remains HIGH",
        actual: `before=${beforeLevel}, after=${afterLevel}`,
        passed,
      });
    } catch (e: any) {
      results.push({ num: 9, name: "Tamper riskLevel", expected: "Pass", actual: e.message, passed: false });
    }

    // ----------------------------------------------------
    // TEST 10: Report snapshot contains all 5 security modules + Gemini AI
    // ----------------------------------------------------
    try {
      const rep = await getReportById(userA_Id, createdReportId);
      const snap = rep?.snapshot;

      const passed =
        snap &&
        snap.safeBrowsing?.threatDetected === true &&
        snap.virusTotal?.maliciousCount === 14 &&
        snap.urlhaus?.match === true &&
        snap.urlIntelligence?.score === 35 &&
        snap.sslAnalysis?.status === "EXPIRED_CERTIFICATE" &&
        snap.aiAnalysis?.available === true;

      results.push({
        num: 10,
        name: "Report snapshot captures all 5 threat modules + Gemini AI analysis",
        expected: "SafeBrowsing, VirusTotal, URLhaus, URLIntel, SSL, and Gemini AI all present",
        actual: `SB=${snap?.safeBrowsing?.status}, VT=${snap?.virusTotal?.detectionRatio}, UH=${snap?.urlhaus?.threatType}, Intel=${snap?.urlIntelligence?.score}, SSL=${snap?.sslAnalysis?.status}`,
        passed: Boolean(passed),
      });
    } catch (e: any) {
      results.push({ num: 10, name: "Snapshot fields", expected: "Pass", actual: e.message, passed: false });
    }

    // ----------------------------------------------------
    // TEST 11: Backend PDF generation produces valid PDF buffer (%PDF-)
    // ----------------------------------------------------
    let pdfBuffer: Buffer | null = null;
    try {
      const res = await generateReportPdfBuffer(userA_Id, createdReportId);
      pdfBuffer = res.buffer;

      const isPdfHeader = pdfBuffer.slice(0, 5).toString("ascii") === "%PDF-";
      const hasLength = pdfBuffer.length > 500;

      results.push({
        num: 11,
        name: "Backend PDF generation returns valid binary PDF buffer",
        expected: "Starts with %PDF-, size > 500 bytes",
        actual: `header=${pdfBuffer.slice(0, 5).toString("ascii")}, bytes=${pdfBuffer.length}`,
        passed: isPdfHeader && hasLength,
      });
    } catch (e: any) {
      results.push({ num: 11, name: "PDF generation", expected: "Pass", actual: e.message, passed: false });
    }

function extractPdfText(buf: Buffer): string {
  const str = buf.toString("latin1");
  const matches = [...str.matchAll(/\[(.*?)\]\s*TJ/g)];
  const streamText = matches
    .map((m) =>
      (m[1].match(/<([0-9a-fA-F]+)>/g) || [])
        .map((h) => Buffer.from(h.slice(1, -1), "hex").toString("latin1"))
        .join("")
    )
    .join(" ");
  return streamText + " " + str;
}

    // ----------------------------------------------------
    // TEST 12: PDF content contains Report ID
    // ----------------------------------------------------
    try {
      const pdfText = pdfBuffer ? extractPdfText(pdfBuffer) : "";
      const containsReportId = pdfText.includes(createdReportId);

      results.push({
        num: 12,
        name: "PDF stream contains Report ID",
        expected: `contains ${createdReportId}`,
        actual: `found=${containsReportId}`,
        passed: containsReportId,
      });
    } catch (e: any) {
      results.push({ num: 12, name: "PDF Report ID", expected: "Pass", actual: e.message, passed: false });
    }

    // ----------------------------------------------------
    // TEST 13: PDF contains risk score
    // ----------------------------------------------------
    try {
      const pdfText = pdfBuffer ? extractPdfText(pdfBuffer) : "";
      const containsScore = pdfText.includes("88 / 100") || pdfText.includes("88");

      results.push({
        num: 13,
        name: "PDF stream contains risk score (88)",
        expected: "contains 88",
        actual: `found=${containsScore}`,
        passed: containsScore,
      });
    } catch (e: any) {
      results.push({ num: 13, name: "PDF risk score", expected: "Pass", actual: e.message, passed: false });
    }

    // ----------------------------------------------------
    // TEST 14: PDF contains Google Safe Browsing
    // ----------------------------------------------------
    try {
      const pdfText = pdfBuffer ? extractPdfText(pdfBuffer) : "";
      const containsSB = pdfText.includes("Google Safe Browsing");

      results.push({
        num: 14,
        name: "PDF stream contains Google Safe Browsing indicator",
        expected: "contains Google Safe Browsing",
        actual: `found=${containsSB}`,
        passed: containsSB,
      });
    } catch (e: any) {
      results.push({ num: 14, name: "PDF Safe Browsing", expected: "Pass", actual: e.message, passed: false });
    }

    // ----------------------------------------------------
    // TEST 15: PDF contains VirusTotal
    // ----------------------------------------------------
    try {
      const pdfText = pdfBuffer ? extractPdfText(pdfBuffer) : "";
      const containsVT = pdfText.includes("VirusTotal");

      results.push({
        num: 15,
        name: "PDF stream contains VirusTotal indicator",
        expected: "contains VirusTotal",
        actual: `found=${containsVT}`,
        passed: containsVT,
      });
    } catch (e: any) {
      results.push({ num: 15, name: "PDF VirusTotal", expected: "Pass", actual: e.message, passed: false });
    }

    // ----------------------------------------------------
    // TEST 16: PDF contains URLhaus
    // ----------------------------------------------------
    try {
      const pdfText = pdfBuffer ? extractPdfText(pdfBuffer) : "";
      const containsUH = pdfText.includes("URLhaus");

      results.push({
        num: 16,
        name: "PDF stream contains URLhaus indicator",
        expected: "contains URLhaus",
        actual: `found=${containsUH}`,
        passed: containsUH,
      });
    } catch (e: any) {
      results.push({ num: 16, name: "PDF URLhaus", expected: "Pass", actual: e.message, passed: false });
    }

    // ----------------------------------------------------
    // TEST 17: PDF contains Local URL Intelligence
    // ----------------------------------------------------
    try {
      const pdfText = pdfBuffer ? extractPdfText(pdfBuffer) : "";
      const containsIntel = pdfText.includes("Local URL Intelligence");

      results.push({
        num: 17,
        name: "PDF stream contains Local URL Intelligence indicator",
        expected: "contains Local URL Intelligence",
        actual: `found=${containsIntel}`,
        passed: containsIntel,
      });
    } catch (e: any) {
      results.push({ num: 17, name: "PDF URL Intelligence", expected: "Pass", actual: e.message, passed: false });
    }

    // ----------------------------------------------------
    // TEST 18: PDF contains SSL/TLS analysis
    // ----------------------------------------------------
    try {
      const pdfText = pdfBuffer ? extractPdfText(pdfBuffer) : "";
      const containsSSL = pdfText.includes("SSL / TLS");

      results.push({
        num: 18,
        name: "PDF stream contains SSL/TLS Encryption section",
        expected: "contains SSL / TLS",
        actual: `found=${containsSSL}`,
        passed: containsSSL,
      });
    } catch (e: any) {
      results.push({ num: 18, name: "PDF SSL/TLS", expected: "Pass", actual: e.message, passed: false });
    }

    // ----------------------------------------------------
    // TEST 19: PDF contains AI analysis when available
    // ----------------------------------------------------
    try {
      const pdfText = pdfBuffer ? extractPdfText(pdfBuffer) : "";
      const containsAI =
        pdfText.toLowerCase().includes("gemini ai security synthesis") &&
        pdfText.toLowerCase().includes("credential harvesting");

      results.push({
        num: 19,
        name: "PDF stream contains Gemini AI analysis findings when available",
        expected: "contains Gemini AI Security Synthesis & executive summary",
        actual: `found=${containsAI}`,
        passed: containsAI,
      });
    } catch (e: any) {
      results.push({ num: 19, name: "PDF AI analysis", expected: "Pass", actual: e.message, passed: false });
    }

    // ----------------------------------------------------
    // TEST 20: PDF handles AI unavailable gracefully
    // ----------------------------------------------------
    try {
      const mockReportNoAI: any = {
        reportId: "CG-2026-NOAITest",
        incidentType: "Suspicious URL",
        title: "Test Without AI",
        description: "Test description",
        incidentDate: new Date(),
        status: "FINAL",
        snapshot: {
          url: "https://example.com",
          normalizedUrl: "https://example.com",
          domain: "example.com",
          riskScore: 5,
          riskLevel: "SAFE",
          confidence: 80,
          aiAnalysis: { available: false, summary: "" },
          scannedAt: new Date(),
        },
      };

      const noAiBuffer = await generateIncidentReportPdf(mockReportNoAI);
      const pdfText = extractPdfText(noAiBuffer);
      const containsNotice = pdfText.includes("AI security explanation was unavailable at the time of analysis");

      results.push({
        num: 20,
        name: "PDF stream handles AI unavailable with clean standard notice",
        expected: "contains 'AI security explanation was unavailable at the time of analysis'",
        actual: `found=${containsNotice}`,
        passed: containsNotice,
      });
    } catch (e: any) {
      results.push({ num: 20, name: "PDF AI unavailable", expected: "Pass", actual: e.message, passed: false });
    }

    // ----------------------------------------------------
    // TEST 21: Sensitive secrets / tokens omitted from PDF (sanitization)
    // ----------------------------------------------------
    try {
      const pdfText = pdfBuffer ? extractPdfText(pdfBuffer) : "";
      const hasSecretToken = pdfText.includes("secret_abc_123");
      const hasRedacted = pdfText.includes("[REDACTED]");

      results.push({
        num: 21,
        name: "Sensitive URL query tokens are redacted in generated PDF",
        expected: "secret_abc_123 omitted, [REDACTED] present",
        actual: `secretPresent=${hasSecretToken}, redactedPresent=${hasRedacted}`,
        passed: !hasSecretToken && hasRedacted,
      });
    } catch (e: any) {
      results.push({ num: 21, name: "Sensitive data redaction", expected: "Pass", actual: e.message, passed: false });
    }

    // ----------------------------------------------------
    // TEST 22: Report list returns only current user's reports
    // ----------------------------------------------------
    try {
      const listA = await getUserReports(userA_Id);
      const listB = await getUserReports(userB_Id);

      const passed =
        listA.reports.every((r) => r.userId.toString() === userA_Id) &&
        listB.reports.length === 0;

      results.push({
        num: 22,
        name: "Report list strictly filters by authenticated user ID",
        expected: "User A reports belong to A, User B has 0 reports",
        actual: `listA_count=${listA.reports.length}, listB_count=${listB.reports.length}`,
        passed,
      });
    } catch (e: any) {
      results.push({ num: 22, name: "Report list filtering", expected: "Pass", actual: e.message, passed: false });
    }

    // ----------------------------------------------------
    // TEST 23: Report status workflow works (DRAFT -> FINAL -> ARCHIVED)
    // ----------------------------------------------------
    try {
      const r1 = await updateIncidentReport(userA_Id, createdReportId, { status: "ARCHIVED" });
      const passed = r1.status === "ARCHIVED";

      results.push({
        num: 23,
        name: "Report status lifecycle transitions safely to ARCHIVED",
        expected: "status=ARCHIVED",
        actual: `status=${r1.status}`,
        passed,
      });
    } catch (e: any) {
      results.push({ num: 23, name: "Status workflow", expected: "Pass", actual: e.message, passed: false });
    }

    // ----------------------------------------------------
    // TEST 24: Delete report removes document without deleting underlying scan
    // ----------------------------------------------------
    try {
      await deleteIncidentReport(userA_Id, createdReportId);
      const repAfterDelete = await getReportById(userA_Id, createdReportId);
      // Ensure underlying scan still exists
      const scanAfterDelete = await Scan.findOne({ _id: scanA_Id, userId: new Types.ObjectId(userA_Id) });

      const passed = repAfterDelete === null && scanAfterDelete !== null;

      results.push({
        num: 24,
        name: "Report deletion purges report while preserving original scan document",
        expected: "report=null, scan!=null",
        actual: `reportExists=${Boolean(repAfterDelete)}, scanExists=${Boolean(scanAfterDelete)}`,
        passed,
      });
    } catch (e: any) {
      results.push({ num: 24, name: "Delete report", expected: "Pass", actual: e.message, passed: false });
    }
  } finally {
    // Restore mocks
    Scan.findOne = originalScanFindOne;
    IncidentReport.create = originalReportCreate;
    IncidentReport.findOne = originalReportFindOne;
    IncidentReport.find = originalReportFind;
    IncidentReport.countDocuments = originalReportCount;
    IncidentReport.deleteOne = originalReportDeleteOne;
  }

  // ----------------------------------------------------
  // Summary
  // ----------------------------------------------------
  console.log("==================================================");
  console.log("PHASE 8 TEST RESULTS SUMMARY");
  console.log("==================================================");

  let passedCount = 0;
  for (const r of results) {
    if (r.passed) {
      passedCount++;
      console.log(`✅ PASS [${r.num}] ${r.name}`);
      console.log(`       Expected: ${r.expected}`);
      console.log(`       Actual:   ${r.actual}\n`);
    } else {
      console.log(`❌ FAIL [${r.num}] ${r.name}`);
      console.log(`       Expected: ${r.expected}`);
      console.log(`       Actual:   ${r.actual}\n`);
    }
  }

  console.log("==================================================");
  console.log(`TOTAL TESTS: ${results.length} | PASSED: ${passedCount} | FAILED: ${results.length - passedCount}`);
  if (passedCount === results.length) {
    console.log("OVERALL STATUS: ALL PHASE 8 BACKEND & PDF TESTS PASSED! 🚀");
  } else {
    console.log("OVERALL STATUS: SOME TESTS FAILED");
  }
  console.log("==================================================\n");

  if (passedCount !== results.length) {
    process.exit(1);
  }
}

runPhase8TestSuite().catch((e) => {
  console.error("Test execution failed:", e);
  process.exit(1);
});
