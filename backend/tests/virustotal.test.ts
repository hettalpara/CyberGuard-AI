import { describe, it, expect, vi, afterEach } from "vitest";
import { checkUrlWithVirusTotal } from "../src/services/virustotal.service";

describe("VirusTotal Service (Mocked API)", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    delete process.env.VIRUSTOTAL_API_KEY;
  });

  it("returns not_configured when VIRUSTOTAL_API_KEY is missing", async () => {
    delete process.env.VIRUSTOTAL_API_KEY;
    const res = await checkUrlWithVirusTotal("https://example.com");

    expect(res.checked).toBe(false);
    expect(res.available).toBe(false);
    expect(res.status).toBe("not_configured");
    expect(res.malicious).toBe(false);
    expect(res.error).toContain("not configured");
  });

  it("returns clean status when 0 engines flag the URL", async () => {
    process.env.VIRUSTOTAL_API_KEY = "mock_vt_key";

    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        data: {
          attributes: {
            last_analysis_stats: {
              malicious: 0,
              suspicious: 0,
              harmless: 65,
              undetected: 5,
            },
          },
        },
      }),
    } as any);

    const res = await checkUrlWithVirusTotal("https://clean-domain.org");

    expect(res.checked).toBe(true);
    expect(res.available).toBe(true);
    expect(res.malicious).toBe(false);
    expect(res.suspicious).toBe(false);
    expect(res.maliciousCount).toBe(0);
    expect(res.totalEngines).toBe(70);
    expect(res.detectionRatio).toBe("0 / 70");
    expect(res.status).toBe("clean");
  });

  it("returns threat_found and correct ratio when engines flag the URL as malicious", async () => {
    process.env.VIRUSTOTAL_API_KEY = "mock_vt_key";

    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        data: {
          attributes: {
            last_analysis_stats: {
              malicious: 8,
              suspicious: 2,
              harmless: 50,
              undetected: 10,
            },
          },
        },
      }),
    } as any);

    const res = await checkUrlWithVirusTotal("https://phishing-scam.test");

    expect(res.checked).toBe(true);
    expect(res.available).toBe(true);
    expect(res.malicious).toBe(true);
    expect(res.suspicious).toBe(true);
    expect(res.maliciousCount).toBe(8);
    expect(res.suspiciousCount).toBe(2);
    expect(res.detectionRatio).toBe("10 / 70");
    expect(res.status).toBe("threat_found");
    expect(res.permalink).toContain("https://www.virustotal.com/gui/url/");
  });

  it("handles 404 response (URL not yet seen by VT) as clean default", async () => {
    process.env.VIRUSTOTAL_API_KEY = "mock_vt_key";

    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: false,
      status: 404,
    } as any);

    const res = await checkUrlWithVirusTotal("https://brand-new-site.xyz");

    expect(res.checked).toBe(true);
    expect(res.available).toBe(true);
    expect(res.malicious).toBe(false);
    expect(res.status).toBe("clean");
    expect(res.detectionRatio).toBe("0 / 0");
  });

  it("handles 401/403 authentication failures gracefully", async () => {
    process.env.VIRUSTOTAL_API_KEY = "invalid_key";

    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: false,
      status: 401,
    } as any);

    const res = await checkUrlWithVirusTotal("https://example.com");

    expect(res.checked).toBe(false);
    expect(res.available).toBe(false);
    expect(res.status).toBe("unavailable");
    expect(res.error).toContain("authentication failed");
  });

  it("handles 429 rate limit gracefully", async () => {
    process.env.VIRUSTOTAL_API_KEY = "mock_vt_key";

    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: false,
      status: 429,
    } as any);

    const res = await checkUrlWithVirusTotal("https://example.com");

    expect(res.checked).toBe(false);
    expect(res.available).toBe(false);
    expect(res.status).toBe("unavailable");
    expect(res.error).toContain("rate limit");
  });

  it("handles network timeout (AbortError)", async () => {
    process.env.VIRUSTOTAL_API_KEY = "mock_vt_key";

    const abortErr = new Error("Abort");
    abortErr.name = "AbortError";

    vi.spyOn(globalThis, "fetch").mockRejectedValue(abortErr);

    const res = await checkUrlWithVirusTotal("https://example.com");

    expect(res.checked).toBe(false);
    expect(res.available).toBe(false);
    expect(res.status).toBe("unavailable");
    expect(res.error).toContain("timed out");
  });
});
