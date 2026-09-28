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

  it("redacts sensitive query parameters before passing URL to AI", () => {
    const rawWithToken = "https://example.com/reset?token=SECRET123&password=myPass&user=john";
    const sanitized = aiService.sanitizeUrlForAI(rawWithToken);

    expect(sanitized).toContain("token=[REDACTED]");
    expect(sanitized).toContain("password=[REDACTED]");
    expect(sanitized).toContain("user=john");
    expect(sanitized).not.toContain("SECRET123");
    expect(sanitized).not.toContain("myPass");
  });

  it("explainScanById generates explanation without altering deterministic risk score or level", async () => {
    const mockScanId = new Types.ObjectId().toString();
    const fakeScan = {
      _id: new Types.ObjectId(mockScanId),
      userId: new Types.ObjectId(mockUserId),
      url: "http://xn--paypa1-9za.example/login?token=SECRET_AUTH",
      normalizedUrl: "http://xn--paypa1-9za.example/login?token=SECRET_AUTH",
      domain: "xn--paypa1-9za.example",
      riskScore: 44,
      riskLevel: "MODERATE",
      confidence: 80,
      riskCalculationVersion: "2.0",
      risk: {
        score: 44,
        level: "MODERATE",
        confidence: 80,
        factors: [
          { name: "Punycode Hostname", score: 35, impact: "MODERATE", status: "DETECTED", reason: "Punycode format" },
        ],
        reasons: ["Punycode format detected", "HTTP unencrypted"],
      },
      ssl: { enabled: false, valid: false, status: "unencrypted" },
      safeBrowsing: { checked: true, threatDetected: false },
      virusTotal: { checked: true, maliciousCount: 0, totalEngines: 70 },
      urlhaus: { available: true, match: false },
      save: vi.fn().mockResolvedValue(true),
    };

    vi.spyOn(Scan, "findOne").mockResolvedValue(fakeScan as any);

    const mockAiResponse = {
      available: true,
      summary: "This URL has a moderate security risk due to Punycode domain and HTTP connection.",
      whatItMeans: "The domain uses a special format that can sometimes mimic legitimate websites, and the connection is unencrypted.",
      whyItMatters: "Unencrypted connections allow attackers to intercept traffic, and fake domains can mislead users.",
      keyIndicators: ["Punycode domain name", "HTTP unencrypted connection"],
      recommendedActions: [
        "Avoid entering passwords or personal information.",
        "Verify the domain before opening the website.",
        "Prefer the official website or HTTPS version."
      ],
      userSafetyMessage: "A clean provider result does not guarantee that a website is completely safe.",
      threatType: "Potential Risk",
      severity: "MODERATE",
    };

    const explainSpy = vi.spyOn(aiService, "generateSecurityExplanation").mockResolvedValue(mockAiResponse as any);

    const { explainScanById } = await import("../src/services/analyzer.service");
    const result = await explainScanById(mockScanId, mockUserId);

    expect(explainSpy).toHaveBeenCalled();
    const passedInput = explainSpy.mock.calls[0][0];
    // Risk score and level are faithfully forwarded from Risk Engine
    expect(passedInput.riskScore).toBe(44);
    expect(passedInput.riskLevel).toBe("MODERATE");
    expect(passedInput.confidence).toBe(80);

    // URL passed to explanation was sanitized
    expect(passedInput.url).toContain("token=[REDACTED]");
    expect(passedInput.url).not.toContain("SECRET_AUTH");

    // Output strictly preserves the authoritative risk score and level
    expect(result.severity).toBe("MODERATE");
    expect(fakeScan.riskScore).toBe(44);
    expect(fakeScan.riskLevel).toBe("MODERATE");
    expect(result.whatItMeans).toBe(mockAiResponse.whatItMeans);
    expect(result.recommendedActions).toHaveLength(3);
    expect(fakeScan.save).toHaveBeenCalled();
  });
});
