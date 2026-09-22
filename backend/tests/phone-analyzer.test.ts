import { describe, it, expect } from "vitest";
import {
  analyzePhone,
  sanitizePhoneInput,
  parsePhoneNumber,
  PhoneReputationData,
} from "../src/services/phone-analyzer.service";

describe("Phone Threat Analyzer Service", () => {
  // 1. Valid phone number
  it("1. Valid phone number: normalizes and analyzes standard international phone number", async () => {
    const result = await analyzePhone({
      phone: "+1 (415) 555-2671",
    });

    expect(result.isValid).toBe(true);
    expect(result.validationStatus).toBe("VALID");
    expect(result.e164).toBe("+14155552671");
    expect(result.countryCode).toBe("US");
    expect(result.callingCode).toBe("1");
    expect(result.summary).toContain("+14155552671");
  });

  // 2. Invalid phone number
  it("2. Invalid phone number: rejects numbers that are too short (< 7 digits) according to E.164", async () => {
    await expect(
      analyzePhone({ phone: "+1 234" })
    ).rejects.toThrow(/Invalid phone number length/i);
  });

  // 3. Empty phone number
  it("3. Empty phone number: throws validation error when phone number is empty", async () => {
    await expect(
      analyzePhone({ phone: "   " })
    ).rejects.toThrow(/Phone number is required and cannot be empty/i);
  });

  // 4. Invalid country/format
  it("4. Invalid country/format: rejects impossible NANP area codes starting with 0 or 1", async () => {
    await expect(
      analyzePhone({ phone: "+1 (012) 345-6789" })
    ).rejects.toThrow(/Invalid North American area code/i);

    await expect(
      analyzePhone({ phone: "+1 (123) 456-7890" })
    ).rejects.toThrow(/Invalid North American area code/i);
  });

  // 5. Normalized phone number
  it("5. Normalized phone number: converts punctuation, dashes, spaces into standardized E.164 format", async () => {
    const result = await analyzePhone({
      phone: "+44 (0) 7700 900077",
    });

    expect(result.e164).toBe("+4407700900077");
    expect(result.countryName).toBe("United Kingdom");
  });

  // 6. Known reputation result if supported
  it("6. Known reputation result: flags high threat when provider confirms scam intelligence", async () => {
    const mockReputationLookup = async (): Promise<PhoneReputationData> => ({
      status: "AVAILABLE",
      available: true,
      spamScore: 92,
      category: "Tech Support Refund Scam",
      reportedAsScam: true,
      complaintsCount: 84,
      details: "Reported 84 times in the past 7 days for impersonating Microsoft Support.",
    });

    const result = await analyzePhone({
      phone: "+1 800 555 0199",
      reputationLookup: mockReputationLookup,
    });

    expect(result.reputation.status).toBe("AVAILABLE");
    expect(result.reputation.reportedAsScam).toBe(true);
    expect(result.riskScore).toBeGreaterThanOrEqual(80);
    expect(result.riskLevel).toBe("CRITICAL");
    expect(result.warnings.some((w) => w.includes("Tech Support Refund Scam"))).toBe(true);
  });

  // 7. Unknown reputation
  it("7. Unknown reputation: clearly specifies UNKNOWN status and warns that lack of data does NOT guarantee safety", async () => {
    const result = await analyzePhone({
      phone: "+1 415 888 2345",
    });

    expect(result.reputation.status).toBe("UNKNOWN");
    expect(result.reputation.available).toBe(false);
    // Crucial requirement: Do NOT claim the number is guaranteed safe
    expect(result.reputation.details).toContain("does NOT guarantee that a phone number is safe");
    expect(result.warnings.some((w) => w.includes("Reputation intelligence is UNKNOWN"))).toBe(true);
  });

  // 8. Provider/API failure if applicable
  it("8. Provider/API failure: gracefully handles reputation provider errors without crashing", async () => {
    const failingLookup = async (): Promise<PhoneReputationData> => {
      throw new Error("Downstream reputation API timeout (ETIMEDOUT)");
    };

    const result = await analyzePhone({
      phone: "+1 415 777 9999",
      reputationLookup: failingLookup,
    });

    expect(result.isValid).toBe(true);
    expect(result.reputation.status).toBe("UNAVAILABLE");
    expect(result.reputation.details).toContain("temporarily unavailable");
    expect(result.confidence).toBeLessThan(60);
  });

  // 9. Malformed input
  it("9. Malformed input: rejects characters, SQL injection attempts, and oversized inputs", async () => {
    await expect(
      analyzePhone({ phone: "+1 555-DROP-TABLE;" })
    ).rejects.toThrow(/contains invalid characters/i);

    await expect(
      analyzePhone({ phone: "<script>alert(1)</script>" })
    ).rejects.toThrow(/contains invalid characters/i);

    const oversizedPhone = "+1" + "9".repeat(40);
    await expect(
      analyzePhone({ phone: oversizedPhone })
    ).rejects.toThrow(/exceeds maximum permitted length/i);
  });
});
