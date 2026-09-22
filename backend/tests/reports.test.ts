import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Types } from "mongoose";
import {
  createIncidentReport,
  createAutomaticIncidentReportForScan,
  getUserReports,
  getReportById,
  updateIncidentReport,
  deleteIncidentReport,
  generateReportPdfBuffer,
} from "../src/services/report.service";
import { generateIncidentReportPdf } from "../src/services/report-pdf.service";
import { IncidentReport, IIncidentReport } from "../src/models/IncidentReport";
import { Scan } from "../src/models/Scan";

describe("Incident Report Service & PDF Generation", () => {
  const mockUserId = new Types.ObjectId().toString();
  const mockScanId = new Types.ObjectId().toString();

  const mockScan = {
    _id: new Types.ObjectId(mockScanId),
    userId: new Types.ObjectId(mockUserId),
    url: "https://secure-bank.example.test/login?token=sensitive_session_token_12345",
    normalizedUrl: "https://secure-bank.example.test/login?token=sensitive_session_token_12345",
    domain: "secure-bank.example.test",
    riskScore: 85,
    riskLevel: "CRITICAL",
    confidence: 90,
    createdAt: new Date(),
    risk: {
      score: 85,
      level: "CRITICAL",
      reasons: ["Known phishing page", "Blacklisted by threat feeds"],
      factors: [{ name: "Safe Browsing", impact: "HIGH", reason: "Phishing match" }],
    },
    safeBrowsing: { status: "THREAT_DETECTED", threatDetected: true, threatTypes: ["SOCIAL_ENGINEERING"] },
    virusTotal: { status: "threat_found", malicious: true, detectionRatio: "12 / 70" },
    urlhaus: { status: "CHECKED_NO_MATCH", match: false },
    sslAnalysis: { status: "CHECKED", protocol: "HTTPS", score: 0 },
    urlIntelligence: { status: "CHECKED", score: 20, indicators: [] },
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("createIncidentReport", () => {
    it("successfully creates an incident report with unique ID and frozen security snapshot", async () => {
      vi.spyOn(Scan, "findOne").mockResolvedValue(mockScan as any);
      vi.spyOn(IncidentReport, "findOne").mockResolvedValue(null);

      let createdPayload: any = null;
      vi.spyOn(IncidentReport, "create").mockImplementation(async (doc: any) => {
        createdPayload = doc;
        return {
          _id: new Types.ObjectId(),
          ...doc,
        } as any;
      });

      const report = await createIncidentReport(mockUserId, {
        scanId: mockScanId,
        incidentType: "Phishing",
        title: "Phishing attack detected",
        description: "Received suspicious SMS with this link",
        userNotes: "Did not enter banking PIN",
      });

      expect(report).toBeDefined();
      expect(createdPayload).toBeDefined();
      expect(createdPayload.reportId).toMatch(/^CG-\d{4}-[A-Z0-9]+$/);
      expect(createdPayload.userId.toString()).toBe(mockUserId);
      expect(createdPayload.incidentType).toBe("Phishing");
      expect(createdPayload.title).toBe("Phishing attack detected");
      // Security snapshot must be frozen from the scan
      expect(createdPayload.snapshot.riskScore).toBe(85);
      expect(createdPayload.snapshot.riskLevel).toBe("CRITICAL");
      expect(createdPayload.snapshot.domain).toBe("secure-bank.example.test");
    });

    it("throws error when referenced scan is not found or does not belong to user", async () => {
      vi.spyOn(Scan, "findOne").mockResolvedValue(null);

      await expect(
        createIncidentReport(mockUserId, {
          scanId: new Types.ObjectId().toString(),
          incidentType: "Phishing",
          title: "Title",
          description: "Description",
        })
      ).rejects.toThrow("Scan not found");
    });

    it("throws error when required fields are missing or invalid", async () => {
      vi.spyOn(Scan, "findOne").mockResolvedValue(mockScan as any);

      await expect(
        createIncidentReport(mockUserId, {
          scanId: mockScanId,
          incidentType: "invalid_type" as any,
          title: "Title",
          description: "Desc",
        })
      ).rejects.toThrow("Invalid incident type");

      await expect(
        createIncidentReport(mockUserId, {
          scanId: mockScanId,
          incidentType: "Malware",
          title: "",
          description: "Desc",
        })
      ).rejects.toThrow("Title is required");
    });
  });

  describe("createAutomaticIncidentReportForScan (Automatic URL Analysis Integration)", () => {
    it("1. Successful URL scan creates exactly one report with unique reportId", async () => {
      vi.spyOn(IncidentReport, "findOne").mockResolvedValue(null);
      vi.spyOn(Scan, "updateOne").mockResolvedValue({ acknowledged: true } as any);

      let createdReportDoc: any = null;
      vi.spyOn(IncidentReport, "create").mockImplementation(async (doc: any) => {
        createdReportDoc = doc;
        return {
          _id: new Types.ObjectId(),
          ...doc,
        } as any;
      });

      const report = await createAutomaticIncidentReportForScan(mockScan, mockUserId);

      expect(report).toBeDefined();
      expect(createdReportDoc).toBeDefined();
      expect(createdReportDoc.reportId).toMatch(/^CG-\d{4}-[A-Z0-9]+$/);
      expect(createdReportDoc.status).toBe("FINAL");
      expect(createdReportDoc.generatedAt).toBeDefined();
    });

    it("2. Report belongs strictly to the authenticated user", async () => {
      vi.spyOn(IncidentReport, "findOne").mockResolvedValue(null);
      vi.spyOn(Scan, "updateOne").mockResolvedValue({ acknowledged: true } as any);

      let createdReportDoc: any = null;
      vi.spyOn(IncidentReport, "create").mockImplementation(async (doc: any) => {
        createdReportDoc = doc;
        return { _id: new Types.ObjectId(), ...doc } as any;
      });

      await createAutomaticIncidentReportForScan(mockScan, mockUserId);

      expect(createdReportDoc.userId.toString()).toBe(mockUserId);
    });

    it("3. Report contains actual scan information and threat intelligence snapshot", async () => {
      vi.spyOn(IncidentReport, "findOne").mockResolvedValue(null);
      vi.spyOn(Scan, "updateOne").mockResolvedValue({ acknowledged: true } as any);

      let createdReportDoc: any = null;
      vi.spyOn(IncidentReport, "create").mockImplementation(async (doc: any) => {
        createdReportDoc = doc;
        return { _id: new Types.ObjectId(), ...doc } as any;
      });

      await createAutomaticIncidentReportForScan(mockScan, mockUserId);

      expect(createdReportDoc.snapshot.url).toBe(mockScan.url);
      expect(createdReportDoc.snapshot.domain).toBe(mockScan.domain);
      expect(createdReportDoc.snapshot.riskScore).toBe(mockScan.riskScore);
      expect(createdReportDoc.snapshot.riskLevel).toBe(mockScan.riskLevel);
      expect(createdReportDoc.snapshot.safeBrowsing.threatDetected).toBe(true);
      expect(createdReportDoc.snapshot.virusTotal.malicious).toBe(true);
      expect(createdReportDoc.incidentType).toBe("Phishing");
    });

    it("4. Throws error if scan or userId is missing", async () => {
      await expect(createAutomaticIncidentReportForScan(null, mockUserId)).rejects.toThrow();
      await expect(createAutomaticIncidentReportForScan(mockScan, "")).rejects.toThrow();
    });

    it("5. Partial threat intelligence failure is represented accurately in the report snapshot", async () => {
      const partialScan = {
        ...mockScan,
        analysisStatus: "LIMITED",
        safeBrowsing: { available: false, status: "UNAVAILABLE", reason: "API key error" },
        virusTotal: { available: false, status: "unavailable" },
        urlhaus: { available: true, status: "CHECKED_NO_MATCH", match: false },
        riskScore: 25,
        riskLevel: "LOW",
        confidence: 45,
      };

      vi.spyOn(IncidentReport, "findOne").mockResolvedValue(null);
      vi.spyOn(Scan, "updateOne").mockResolvedValue({ acknowledged: true } as any);

      let createdReportDoc: any = null;
      vi.spyOn(IncidentReport, "create").mockImplementation(async (doc: any) => {
        createdReportDoc = doc;
        return { _id: new Types.ObjectId(), ...doc } as any;
      });

      await createAutomaticIncidentReportForScan(partialScan, mockUserId);

      expect(createdReportDoc.snapshot.analysisStatus).toBe("LIMITED");
      expect(createdReportDoc.snapshot.safeBrowsing.available).toBe(false);
      expect(createdReportDoc.snapshot.confidence).toBe(45);
      expect(createdReportDoc.snapshot.riskScore).toBe(25);
    });

    it("6. Same scan cannot create duplicate reports (idempotent duplicate prevention)", async () => {
      const existingReportDoc = {
        _id: new Types.ObjectId(),
        reportId: "CG-2026-EXISTING",
        userId: new Types.ObjectId(mockUserId),
        scanId: mockScan._id,
        title: "Existing Automated Scan",
      };

      // Mock that report already exists for this scanId
      vi.spyOn(IncidentReport, "findOne").mockResolvedValue(existingReportDoc as any);
      const createSpy = vi.spyOn(IncidentReport, "create");

      const result = await createAutomaticIncidentReportForScan(mockScan, mockUserId);

      expect(result.reportId).toBe("CG-2026-EXISTING");
      expect(createSpy).not.toHaveBeenCalled();
    });

    it("7. User A cannot access User B's automatically generated report", async () => {
      const userB_Id = new Types.ObjectId().toString();

      // Report belongs to User A
      const userAReport = {
        _id: new Types.ObjectId(),
        reportId: "CG-2026-USERA",
        userId: new Types.ObjectId(mockUserId),
        title: "User A Security Incident",
      };

      vi.spyOn(IncidentReport, "findOne").mockImplementation((query: any) => {
        if (query.userId?.toString() === mockUserId) {
          return Promise.resolve(userAReport as any);
        }
        return Promise.resolve(null);
      });

      const reportForUserB = await getReportById(userB_Id, "CG-2026-USERA");
      expect(reportForUserB).toBeNull();
    });

    it("8. Automatically generated report appears through the existing reports API (getUserReports)", async () => {
      const autoReports = [
        {
          _id: new Types.ObjectId(),
          reportId: "CG-2026-AUTO01",
          userId: new Types.ObjectId(mockUserId),
          title: "Automated Security Scan: secure-bank.example.test",
          status: "FINAL",
        },
      ];

      vi.spyOn(IncidentReport, "find").mockReturnValue({
        sort: vi.fn().mockReturnValue({
          skip: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue(autoReports),
          }),
        }),
      } as any);
      vi.spyOn(IncidentReport, "countDocuments").mockResolvedValue(1);

      const result = await getUserReports(mockUserId, { page: 1, limit: 10 });
      expect(result.reports).toHaveLength(1);
      expect(result.reports[0].reportId).toBe("CG-2026-AUTO01");
    });
  });

  describe("getUserReports & getReportById", () => {
    it("lists reports for user with pagination", async () => {
      const mockReports = [
        { reportId: "CR-2026-0001", title: "Report 1", userId: new Types.ObjectId(mockUserId) },
        { reportId: "CR-2026-0002", title: "Report 2", userId: new Types.ObjectId(mockUserId) },
      ];

      vi.spyOn(IncidentReport, "find").mockReturnValue({
        sort: vi.fn().mockReturnValue({
          skip: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue(mockReports),
          }),
        }),
      } as any);

      vi.spyOn(IncidentReport, "countDocuments").mockResolvedValue(2);

      const result = await getUserReports(mockUserId, { page: 1, limit: 10 });
      expect(result.reports).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
    });

    it("retrieves single report by human-readable reportId", async () => {
      const mockReport = {
        reportId: "CR-2026-0001",
        title: "Single report",
        userId: new Types.ObjectId(mockUserId),
      };

      vi.spyOn(IncidentReport, "findOne").mockResolvedValue(mockReport as any);

      const report = await getReportById(mockUserId, "CR-2026-0001");
      expect(report).toBeDefined();
      expect(report?.reportId).toBe("CR-2026-0001");
    });
  });

  describe("updateIncidentReport", () => {
    it("updates editable fields without modifying the security snapshot", async () => {
      const mockReportDoc = {
        _id: new Types.ObjectId(),
        reportId: "CR-2026-0001",
        userId: new Types.ObjectId(mockUserId),
        title: "Old title",
        description: "Old desc",
        userNotes: "Old notes",
        status: "DRAFT",
        snapshot: { riskScore: 85, riskLevel: "CRITICAL" },
        save: vi.fn().mockResolvedValue(true),
      };

      vi.spyOn(IncidentReport, "findOne").mockResolvedValue(mockReportDoc as any);

      const updated = await updateIncidentReport(mockUserId, "CR-2026-0001", {
        title: "New updated title",
        userNotes: "Added evidence details",
        status: "FINAL",
      });

      expect(updated.title).toBe("New updated title");
      expect(updated.userNotes).toBe("Added evidence details");
      expect(updated.status).toBe("FINAL");
      // Snapshot must remain completely untouched
      expect(updated.snapshot.riskScore).toBe(85);
      expect(mockReportDoc.save).toHaveBeenCalledTimes(1);
    });
  });

  describe("deleteIncidentReport", () => {
    it("deletes report successfully", async () => {
      const mockReportDoc = {
        _id: new Types.ObjectId(),
        reportId: "CR-2026-0001",
        userId: new Types.ObjectId(mockUserId),
      };

      vi.spyOn(IncidentReport, "findOne").mockResolvedValue(mockReportDoc as any);
      vi.spyOn(IncidentReport, "deleteOne").mockResolvedValue({ deletedCount: 1 } as any);

      const success = await deleteIncidentReport(mockUserId, "CR-2026-0001");
      expect(success).toBe(true);
      expect(IncidentReport.deleteOne).toHaveBeenCalledWith({ _id: mockReportDoc._id });
    });
  });

  describe("PDF Generation (generateIncidentReportPdf)", () => {
    it("generates a valid, non-empty PDF buffer from incident report data", async () => {
      const mockReport: IIncidentReport = {
        _id: new Types.ObjectId(),
        reportId: "CR-2026-TEST",
        userId: new Types.ObjectId(mockUserId),
        scanId: new Types.ObjectId(mockScanId),
        incidentType: "Phishing",
        title: "Investigative Phishing Incident Report",
        description: "Credential harvesting page impersonating official bank portal.",
        incidentDate: new Date(),
        source: "SMS text message",
        affectedAccount: "user@example.com",
        userNotes: "Preserved screenshot and network log.",
        status: "FINAL",
        createdAt: new Date(),
        updatedAt: new Date(),
        snapshot: {
          url: "https://malicious-bank.test/login?auth_token=super_secret_session_token_xyz&safe_param=1",
          domain: "malicious-bank.test",
          riskScore: 92,
          riskLevel: "CRITICAL",
          confidence: 95,
          scanDate: new Date(),
          risk: {
            score: 92,
            level: "CRITICAL",
            reasons: ["Flagged by Google Safe Browsing as SOCIAL_ENGINEERING", "High VirusTotal ratio"],
            factors: [
              { name: "Google Safe Browsing", score: 90, impact: "HIGH", status: "THREAT_DETECTED", reason: "Phishing match" },
            ],
          },
          safeBrowsing: { checked: true, status: "THREAT_DETECTED", threatDetected: true, threatTypes: ["SOCIAL_ENGINEERING"] },
          virusTotal: { checked: true, status: "threat_found", malicious: true, detectionRatio: "14 / 70" },
          urlhaus: { status: "CHECKED_NO_MATCH", match: false },
          sslAnalysis: { status: "CHECKED", protocol: "HTTPS", score: 0 },
          urlIntelligence: { status: "CHECKED", score: 10, indicators: [] },
        },
      } as any;

      const pdfBuffer = await generateIncidentReportPdf(mockReport);

      expect(pdfBuffer).toBeInstanceOf(Buffer);
      expect(pdfBuffer.length).toBeGreaterThan(1000);
      // Verify PDF file signature: starts with %PDF-
      const header = pdfBuffer.subarray(0, 5).toString("ascii");
      expect(header).toBe("%PDF-");
    });

    it("redacts sensitive query tokens from the URL in PDF report", async () => {
      const mockReport: IIncidentReport = {
        _id: new Types.ObjectId(),
        reportId: "CR-2026-REDACT",
        userId: new Types.ObjectId(mockUserId),
        scanId: new Types.ObjectId(mockScanId),
        incidentType: "Phishing",
        title: "Credential Theft Report",
        description: "Test description",
        status: "DRAFT",
        createdAt: new Date(),
        updatedAt: new Date(),
        snapshot: {
          url: "https://phish.test/verify?password=PlainTextPassword&api_key=ConfidentialKey123",
          domain: "phish.test",
          riskScore: 80,
          riskLevel: "HIGH",
          confidence: 85,
        },
      } as any;

      const pdfBuffer = await generateIncidentReportPdf(mockReport);
      const pdfText = pdfBuffer.toString("latin1");

      // Verify that plain-text passwords and confidential keys are redacted from the generated document
      expect(pdfText).not.toContain("PlainTextPassword");
      expect(pdfText).not.toContain("ConfidentialKey123");
      // Verify redaction pattern in hex encoded stream: [REDACTED] in hex is 5b52454441435445445d
      const redactedHex = Buffer.from("[REDACTED]").toString("hex");
      expect(pdfText.toLowerCase()).toContain(redactedHex.toLowerCase());
    });
  });
});
