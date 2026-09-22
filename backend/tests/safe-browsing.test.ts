import { describe, it, expect, vi, afterEach } from "vitest";
import { checkGoogleSafeBrowsing } from "../src/services/safe-browsing.service";

describe("Google Safe Browsing Service (Mocked API)", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    delete process.env.GOOGLE_SAFE_BROWSING_API_KEY;
  });

  it("returns UNAVAILABLE when API key is missing or placeholder", async () => {
    process.env.GOOGLE_SAFE_BROWSING_API_KEY = "";
    const res = await checkGoogleSafeBrowsing("https://example.com");

    expect(res.checked).toBe(false);
    expect(res.available).toBe(false);
    expect(res.status).toBe("UNAVAILABLE");
    expect(res.threatDetected).toBe(false);
    expect(res.score).toBeNull();
    expect(res.error).toContain("not configured");
  });

  it("returns CHECKED_NO_THREAT and score 0 for benign URL with no matches", async () => {
    const mockFetch = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ matches: [] }),
    } as any);

    const res = await checkGoogleSafeBrowsing("https://clean-site.org", { apiKey: "mock-valid-key" });

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(res.checked).toBe(true);
    expect(res.available).toBe(true);
    expect(res.status).toBe("CHECKED_NO_THREAT");
    expect(res.threatDetected).toBe(false);
    expect(res.score).toBe(0);
    expect(res.reason).toContain("No threats identified");
  });

  it("identifies MALWARE threat and assigns score 100", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        matches: [
          {
            threatType: "MALWARE",
            platformType: "ANY_PLATFORM",
            threat: { url: "http://malware-distributor.test" },
          },
        ],
      }),
    } as any);

    const res = await checkGoogleSafeBrowsing("http://malware-distributor.test", { apiKey: "mock-valid-key" });

    expect(res.checked).toBe(true);
    expect(res.available).toBe(true);
    expect(res.status).toBe("THREAT_DETECTED");
    expect(res.threatDetected).toBe(true);
    expect(res.score).toBe(100);
    expect(res.threatTypes).toContain("MALWARE");
    expect(res.reason).toContain("MALWARE");
  });

  it("identifies SOCIAL_ENGINEERING (phishing) threat and assigns score 90", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        matches: [
          {
            threatType: "SOCIAL_ENGINEERING",
            platformType: "ANY_PLATFORM",
            threat: { url: "http://phish-bank.test" },
          },
        ],
      }),
    } as any);

    const res = await checkGoogleSafeBrowsing("http://phish-bank.test", { apiKey: "mock-valid-key" });

    expect(res.status).toBe("THREAT_DETECTED");
    expect(res.threatDetected).toBe(true);
    expect(res.score).toBe(90);
    expect(res.threatTypes).toContain("SOCIAL_ENGINEERING");
    expect(res.reason).toContain("phishing");
  });

  it("identifies UNWANTED_SOFTWARE threat and assigns score 70", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        matches: [
          {
            threatType: "UNWANTED_SOFTWARE",
            platformType: "ANY_PLATFORM",
          },
        ],
      }),
    } as any);

    const res = await checkGoogleSafeBrowsing("http://adware-bundler.test", { apiKey: "mock-valid-key" });

    expect(res.status).toBe("THREAT_DETECTED");
    expect(res.threatDetected).toBe(true);
    expect(res.score).toBe(70);
    expect(res.threatTypes).toContain("UNWANTED_SOFTWARE");
  });

  it("handles HTTP 500 server error gracefully as UNAVAILABLE", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ error: { message: "Internal server error" } }),
    } as any);

    const res = await checkGoogleSafeBrowsing("https://example.com", { apiKey: "mock-valid-key" });

    expect(res.checked).toBe(false);
    expect(res.available).toBe(false);
    expect(res.status).toBe("UNAVAILABLE");
    expect(res.score).toBeNull();
  });

  it("handles HTTP 400 client error as ERROR status", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ error: { message: "Invalid payload" } }),
    } as any);

    const res = await checkGoogleSafeBrowsing("https://example.com", { apiKey: "mock-valid-key" });

    expect(res.checked).toBe(false);
    expect(res.available).toBe(false);
    expect(res.status).toBe("ERROR");
    expect(res.score).toBeNull();
  });

  it("handles request timeout (AbortError) without crashing", async () => {
    const abortErr = new Error("The operation was aborted");
    abortErr.name = "AbortError";

    vi.spyOn(globalThis, "fetch").mockRejectedValue(abortErr);

    const res = await checkGoogleSafeBrowsing("https://example.com", { apiKey: "mock-valid-key" });

    expect(res.checked).toBe(false);
    expect(res.available).toBe(false);
    expect(res.status).toBe("UNAVAILABLE");
    expect(res.error).toContain("timed out");
  });
});
