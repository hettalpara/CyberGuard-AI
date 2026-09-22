import { describe, it, expect } from "vitest";
import {
  analyzeEmail,
  extractEmailAddress,
  parseEmailHeaders,
  DnsResolver,
} from "../src/services/email-analyzer.service";

describe("Email Threat Analyzer Service", () => {
  // Helper to create mock DNS resolver
  const createMockResolver = (overrides?: {
    spfRecord?: string;
    dmarcRecord?: string;
    hasMx?: boolean;
    throwSpf?: Error;
    throwDmarc?: Error;
  }): DnsResolver => ({
    resolveTxt: async (hostname: string) => {
      if (hostname.startsWith("_dmarc.")) {
        if (overrides?.throwDmarc) throw overrides.throwDmarc;
        if (overrides?.dmarcRecord) return [[overrides.dmarcRecord]];
        const err = new Error("Not found") as any;
        err.code = "ENOTFOUND";
        throw err;
      }
      if (overrides?.throwSpf) throw overrides.throwSpf;
      if (overrides?.spfRecord) return [[overrides.spfRecord]];
      const err = new Error("Not found") as any;
      err.code = "ENOTFOUND";
      throw err;
    },
    resolveMx: async () => {
      if (overrides?.hasMx === false) return [];
      return [{ exchange: "mail.example.com", priority: 10 }];
    },
  });

  // 1. Valid email
  it("1. Valid email: analyzes legitimate email address and computes safe score", async () => {
    const resolver = createMockResolver({
      spfRecord: "v=spf1 include:_spf.google.com ~all",
      dmarcRecord: "v=DMARC1; p=reject; rua=mailto:d@example.com",
    });

    const result = await analyzeEmail({
      email: "security-team@example.com",
      dnsResolver: resolver,
    });

    expect(result.isValidFormat).toBe(true);
    expect(result.validationStatus).toBe("VALID");
    expect(result.domain).toBe("example.com");
    expect(result.localPart).toBe("security-team");
    expect(result.spf.status).toBe("PASS");
    expect(result.dmarc.status).toBe("PASS");
    expect(result.riskLevel).toBe("SAFE");
  });

  // 2. Invalid email
  it("2. Invalid email: rejects invalid email syntax with clear validation error", async () => {
    await expect(
      analyzeEmail({ email: "invalid-email-format" })
    ).rejects.toThrow(/Invalid email address format/i);
  });

  // 3. Empty email
  it("3. Empty email: throws validation error when email is empty or whitespace", async () => {
    await expect(
      analyzeEmail({ email: "   " })
    ).rejects.toThrow(/Email address is required and cannot be empty/i);
  });

  // 4. Malformed email
  it("4. Malformed email: throws error for missing local-part or domain", async () => {
    await expect(
      analyzeEmail({ email: "@nodomain.com" })
    ).rejects.toThrow(/Invalid email address format/i);

    await expect(
      analyzeEmail({ email: "user@" })
    ).rejects.toThrow(/Invalid email address format/i);
  });

  // 5. SPF PASS
  it("5. SPF PASS: detects valid SPF TXT record on sender domain", async () => {
    const resolver = createMockResolver({
      spfRecord: "v=spf1 ip4:192.0.2.1 -all",
    });

    const result = await analyzeEmail({
      email: "alerts@corporate.com",
      dnsResolver: resolver,
    });

    expect(result.spf.status).toBe("PASS");
    expect(result.spf.mechanism).toContain("-all (HardFail)");
  });

  // 6. SPF FAIL
  it("6. SPF FAIL: identifies SPF failure from email authentication headers", async () => {
    const resolver = createMockResolver();
    const rawHeaders = `From: admin@spoofed.com\r\nReceived-SPF: fail (domain of spoofed.com does not designate 203.0.113.1)\r\nSubject: Account Verification`;

    const result = await analyzeEmail({
      email: "admin@spoofed.com",
      headers: rawHeaders,
      dnsResolver: resolver,
    });

    expect(result.spf.status).toBe("FAIL");
    expect(result.warnings.some((w) => w.includes("SPF authentication FAILED"))).toBe(true);
  });

  // 7. SPF MISSING
  it("7. SPF MISSING: marks missing SPF as security weakness without automatically classifying as malicious", async () => {
    const resolver = createMockResolver({
      spfRecord: undefined, // no record found
    });

    const result = await analyzeEmail({
      email: "contact@smallbusiness.org",
      dnsResolver: resolver,
    });

    expect(result.spf.status).toBe("MISSING");
    expect(result.spf.details).toContain("No SPF");
    // Important constraint: Missing SPF should NOT mark as CRITICAL or malicious on its own
    expect(result.riskLevel).not.toBe("CRITICAL");
  });

  // 8. DKIM PASS
  it("8. DKIM PASS: detects passing DKIM signature in authentication headers", async () => {
    const rawHeaders = [
      "From: notification@chase.com",
      "Authentication-Results: mx.google.com; dkim=pass header.i=@chase.com header.s=s1024",
      "Subject: Your Monthly Statement",
    ].join("\r\n");

    const result = await analyzeEmail({
      email: "notification@chase.com",
      headers: rawHeaders,
      dnsResolver: createMockResolver({
        spfRecord: "v=spf1 include:_spf.chase.com ~all",
        dmarcRecord: "v=DMARC1; p=reject",
      }),
    });

    expect(result.dkim.status).toBe("PASS");
    expect(result.dkim.details).toContain("validated successfully");
  });

  // 9. DKIM FAIL
  it("9. DKIM FAIL: identifies failed DKIM verification indicating potential tampering", async () => {
    const rawHeaders = [
      "From: invoice@finance.com",
      "Authentication-Results: mx.google.com; dkim=fail (body hash did not verify)",
      "Subject: Wire Instructions",
    ].join("\r\n");

    const result = await analyzeEmail({
      email: "invoice@finance.com",
      headers: rawHeaders,
      dnsResolver: createMockResolver(),
    });

    expect(result.dkim.status).toBe("FAIL");
    expect(result.warnings.some((w) => w.includes("DKIM cryptographic signature check FAILED"))).toBe(true);
  });

  // 10. DKIM MISSING
  it("10. DKIM MISSING: identifies missing DKIM signature when headers are provided without signing", async () => {
    const rawHeaders = [
      "From: sender@unauthenticated.com",
      "Subject: Casual greeting without signing",
    ].join("\r\n");

    const result = await analyzeEmail({
      email: "sender@unauthenticated.com",
      headers: rawHeaders,
      dnsResolver: createMockResolver(),
    });

    expect(result.dkim.status).toBe("MISSING");
  });

  // 11. DMARC PASS
  it("11. DMARC PASS: verifies active DMARC policy on sender domain", async () => {
    const resolver = createMockResolver({
      dmarcRecord: "v=DMARC1; p=quarantine; sp=quarantine; pct=100",
    });

    const result = await analyzeEmail({
      email: "updates@verifieddomain.org",
      dnsResolver: resolver,
    });

    expect(result.dmarc.status).toBe("PASS");
    expect(result.dmarc.mechanism).toBe("p=quarantine");
  });

  // 12. DMARC FAIL
  it("12. DMARC FAIL: identifies missing or failing DMARC policy", async () => {
    const resolver = createMockResolver({
      throwDmarc: Object.assign(new Error("DMARC lookup failed"), { code: "ENOTFOUND" }),
    });

    const result = await analyzeEmail({
      email: "user@vulnerablesite.com",
      dnsResolver: resolver,
    });

    expect(result.dmarc.status).toBe("MISSING");
  });

  // 13. DMARC MISSING
  it("13. DMARC MISSING: explains that missing DMARC is a security posture gap without auto-malicious labeling", async () => {
    const resolver = createMockResolver(); // default throws ENOTFOUND for DMARC

    const result = await analyzeEmail({
      email: "friend@personalsite.org",
      dnsResolver: resolver,
    });

    expect(result.dmarc.status).toBe("MISSING");
    expect(result.dmarc.details).toContain("No DMARC record found");
    expect(result.riskLevel).not.toBe("CRITICAL");
  });

  // 14. Suspicious From/Reply-To mismatch
  it("14. Suspicious From/Reply-To mismatch: flags spoofing when From and Reply-To domains differ", async () => {
    const rawHeaders = [
      "From: Security Team <security@bankofamerica.com>",
      "Reply-To: Bank Support <verify-account@suspicious-portal.ru>",
      "Subject: Urgent: Verify your credentials",
    ].join("\r\n");

    const result = await analyzeEmail({
      email: "security@bankofamerica.com",
      headers: rawHeaders,
      dnsResolver: createMockResolver({
        spfRecord: "v=spf1 include:_spf.bankofamerica.com -all",
      }),
    });

    expect(result.headers).toBeDefined();
    expect(result.headers?.mismatches.length).toBeGreaterThan(0);
    const mismatch = result.headers?.mismatches.find((m) => m.type === "FROM_REPLYTO_MISMATCH");
    expect(mismatch).toBeDefined();
    expect(mismatch?.severity).toBe("HIGH");
    expect(result.riskScore).toBeGreaterThanOrEqual(35);
  });

  // 15. Malformed headers
  it("15. Malformed headers: safely handles unusual, folded, or malformed email headers without crashing", async () => {
    const malformedHeaders = [
      "NotAHeaderLineWithoutColon",
      "Folded: First part of header",
      "   continuation line with tabs and weird chars \u0000",
      "EmptyColon:",
      ":MissingKey",
      "From: test@example.com",
    ].join("\r\n");

    const result = await analyzeEmail({
      email: "test@example.com",
      headers: malformedHeaders,
      dnsResolver: createMockResolver(),
    });

    expect(result.isValidFormat).toBe(true);
    expect(result.headers).toBeDefined();
    expect(result.headers?.from).toBe("test@example.com");
  });

  // 16. Oversized input
  it("16. Oversized input: rejects email over 320 chars and headers over 100KB", async () => {
    const longLocalPart = "a".repeat(320);
    const longEmail = `${longLocalPart}@example.com`;

    await expect(
      analyzeEmail({ email: longEmail, dnsResolver: createMockResolver() })
    ).rejects.toThrow(/exceeds maximum permitted length/i);

    const hugeHeaders = "X-Spam-Header: " + "A".repeat(105 * 1024);
    await expect(
      analyzeEmail({ email: "user@example.com", headers: hugeHeaders, dnsResolver: createMockResolver() })
    ).rejects.toThrow(/Headers exceed maximum permitted length/i);
  });
});
