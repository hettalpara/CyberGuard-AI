import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { performUrlAnalysis } from "../src/services/analyzer.service";
import * as sslService from "../src/services/ssl-analysis.service";
import * as sbService from "../src/services/safe-browsing.service";
import * as vtService from "../src/services/virustotal.service";
import * as uhService from "../src/services/threat-intelligence/urlhaus.service";
import * as aiService from "../src/services/ai-analysis.service";
import * as reportService from "../src/services/report.service";
import { Scan } from "../src/models/Scan";
import { Types } from "mongoose";

describe("Analyzer Orchestrator Service (performUrlAnalysis)", () => {
  const mockUserId = new Types.ObjectId().toString();

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(reportService, "createAutomaticIncidentReportForScan").mockResolvedValue({
      reportId: "CG-2026-TEST01",
    } as any);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("throws validation error for invalid URL without calling threat engines", async () => {
    const sslSpy = vi.spyOn(sslService, "analyzeSslUrl");
    const sbSpy = vi.spyOn(sbService, "checkGoogleSafeBrowsing");

    await expect(
      performUrlAnalysis({
        rawUrl: "javascript:alert(1)",
        userId: mockUserId,
      })
    ).rejects.toThrow();

    expect(sslSpy).not.toHaveBeenCalled();
    expect(sbSpy).not.toHaveBeenCalled();
  });

  it("orchestrates all security engines in parallel and saves scan result for clean URL", async () => {
    vi.spyOn(sslService, "analyzeSslUrl").mockResolvedValue({
      status: "CHECKED",
      protocol: "HTTPS",
      score: 0,
      level: "SAFE",
      certificate: { authorized: true, issuer: { O: "Google Trust Services" } },
      reason: "Valid HTTPS certificate",
      checkedAt: new Date().toISOString(),
    });

    vi.spyOn(sbService, "checkGoogleSafeBrowsing").mockResolvedValue({
      checked: true,
      available: true,
      status: "CHECKED_NO_THREAT",
      threatDetected: false,
      threatTypes: [],
      score: 0,
      reason: "No threats identified in Google Safe Browsing.",
      provider: "GOOGLE_SAFE_BROWSING",
      checkedAt: new Date().toISOString(),
    });

    vi.spyOn(vtService, "checkUrlWithVirusTotal").mockResolvedValue({
      checked: true,
      available: true,
      malicious: false,
      suspicious: false,
      maliciousCount: 0,
      suspiciousCount: 0,
      undetectedCount: 5,
      totalEngines: 70,
      detectionRatio: "0 / 70",
      status: "clean",
    });

    vi.spyOn(uhService, "checkUrlWithUrlhaus").mockResolvedValue({
      available: true,
      status: "CHECKED_NO_MATCH",
      match: false,
      provider: "URLHAUS",
      reason: "No matching malware URL record in URLhaus.",
      checkedAt: new Date().toISOString(),
    });

    vi.spyOn(aiService, "generateSecurityExplanation").mockResolvedValue({
      available: true,
      summary: "The URL appears legitimate and safe.",
      threatType: "Clean",
      severity: "SAFE",
      explanation: "All verified threat intelligence feeds reported negative findings.",
      keyIndicators: ["Valid SSL", "No blacklists"],
      recommendedActions: ["Safe to browse"],
    });

    let savedPayload: any = null;
    vi.spyOn(Scan, "create").mockImplementation(async (doc: any) => {
      savedPayload = doc;
      return {
        _id: new Types.ObjectId(),
        ...doc,
      } as any;
    });

    const result = await performUrlAnalysis({
      rawUrl: "https://example.com",
      userId: mockUserId,
    });

    expect(result).toBeDefined();
    expect(savedPayload).toBeDefined();
    expect(savedPayload.url).toBe("https://example.com");
    expect(savedPayload.domain).toBe("example.com");
    expect(savedPayload.riskScore).toBeLessThanOrEqual(19);
    expect(savedPayload.riskLevel).toBe("SAFE");
    expect(savedPayload.safeBrowsing.status).toBe("CHECKED_NO_THREAT");
    expect(savedPayload.virusTotal.malicious).toBe(false);
    expect(savedPayload.urlhaus.match).toBe(false);
  });

  it("handles partial engine failures gracefully without crashing the scan pipeline", async () => {
    // VirusTotal fails / throws an error
    vi.spyOn(vtService, "checkUrlWithVirusTotal").mockRejectedValue(new Error("VT Network timeout"));

    // Safe Browsing detects MALWARE
    vi.spyOn(sbService, "checkGoogleSafeBrowsing").mockResolvedValue({
      checked: true,
      available: true,
      status: "THREAT_DETECTED",
      threatDetected: true,
      threatTypes: ["MALWARE"],
      score: 100,
      reason: "Identified as malware",
      provider: "GOOGLE_SAFE_BROWSING",
      checkedAt: new Date().toISOString(),
    });

    // SSL succeeds
    vi.spyOn(sslService, "analyzeSslUrl").mockResolvedValue({
      status: "CHECKED",
      protocol: "HTTPS",
      score: 0,
      level: "SAFE",
      certificate: {},
      reason: "Valid",
      checkedAt: new Date().toISOString(),
    });

    // URLhaus succeeds
    vi.spyOn(uhService, "checkUrlWithUrlhaus").mockResolvedValue({
      available: true,
      status: "CHECKED_NO_MATCH",
      match: false,
      provider: "URLHAUS",
      reason: "Clean",
      checkedAt: new Date().toISOString(),
    });

    // AI fails
    vi.spyOn(aiService, "generateSecurityExplanation").mockRejectedValue(new Error("AI quota exceeded"));

    let savedPayload: any = null;
    vi.spyOn(Scan, "create").mockImplementation(async (doc: any) => {
      savedPayload = doc;
      return {
        _id: new Types.ObjectId(),
        ...doc,
      } as any;
    });

    const result = await performUrlAnalysis({
      rawUrl: "https://infected-download.test/setup.exe",
      userId: mockUserId,
    });

    expect(result).toBeDefined();
    expect(savedPayload).toBeDefined();
    // Failed VirusTotal is caught safely
    expect(savedPayload.virusTotal.status).toBe("unavailable");
    // Safe Browsing threat triggers high/critical risk floor
    expect(savedPayload.riskScore).toBeGreaterThanOrEqual(75);
    expect(["HIGH", "CRITICAL"]).toContain(savedPayload.riskLevel);
    // AI failure triggers fallback explanation without aborting
    expect(savedPayload.aiAnalysis.available).toBe(false);
  });
});
