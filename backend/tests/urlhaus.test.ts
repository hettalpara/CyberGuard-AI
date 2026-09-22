import { describe, it, expect, vi, afterEach } from "vitest";
import { checkUrlWithUrlhaus } from "../src/services/threat-intelligence/urlhaus.service";

describe("URLhaus Service (Mocked API)", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    delete process.env.URLHAUS_AUTH_KEY;
  });

  it("returns UNAVAILABLE when authKey is missing or placeholder", async () => {
    delete process.env.URLHAUS_AUTH_KEY;
    const res = await checkUrlWithUrlhaus("https://example.com");

    expect(res.available).toBe(false);
    expect(res.status).toBe("UNAVAILABLE");
    expect(res.match).toBe(false);
    expect(res.error).toContain("Auth-Key missing");
  });

  it("returns CHECKED_NO_MATCH when query_status is 'no_results'", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        query_status: "no_results",
      }),
    } as any);

    const res = await checkUrlWithUrlhaus("https://clean-site.org", { authKey: "mock_auth_key" });

    expect(res.available).toBe(true);
    expect(res.status).toBe("CHECKED_NO_MATCH");
    expect(res.match).toBe(false);
    expect(res.reason).toContain("No matching malware URL record");
  });

  it("returns MALWARE_URL_DETECTED when query_status is 'ok'", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        query_status: "ok",
        threat: "malware_download",
        tags: ["elf", "mirai"],
      }),
    } as any);

    const res = await checkUrlWithUrlhaus("http://malware-drop.test/bot.exe", { authKey: "mock_auth_key" });

    expect(res.available).toBe(true);
    expect(res.status).toBe("MALWARE_URL_DETECTED");
    expect(res.match).toBe(true);
    expect(res.threatType).toBe("malware_download");
    expect(res.tags).toEqual(["elf", "mirai"]);
    expect(res.reason).toContain("confirmed this URL as an active malware distribution source");
  });

  it("handles HTTP 429 / 500 error as UNAVAILABLE", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: false,
      status: 503,
      json: async () => ({ query_status: "service_maintenance" }),
    } as any);

    const res = await checkUrlWithUrlhaus("https://example.com", { authKey: "mock_auth_key" });

    expect(res.available).toBe(false);
    expect(res.status).toBe("UNAVAILABLE");
    expect(res.match).toBe(false);
  });

  it("handles unexpected query_status values as ERROR", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        query_status: "invalid_url",
      }),
    } as any);

    const res = await checkUrlWithUrlhaus("invalid-format", { authKey: "mock_auth_key" });

    expect(res.available).toBe(false);
    expect(res.status).toBe("ERROR");
    expect(res.match).toBe(false);
  });

  it("handles request timeout (AbortError)", async () => {
    const timeoutErr = new Error("Abort");
    timeoutErr.name = "AbortError";

    vi.spyOn(globalThis, "fetch").mockRejectedValue(timeoutErr);

    const res = await checkUrlWithUrlhaus("https://example.com", { authKey: "mock_auth_key" });

    expect(res.available).toBe(false);
    expect(res.status).toBe("UNAVAILABLE");
    expect(res.error).toContain("timed out");
  });
});
