/**
 * ============================================================================
 * RISK SCORING ENGINE — COMPREHENSIVE TEST SUITE
 * ============================================================================
 * Tests the deterministic weighted risk scoring model with:
 * - Individual factor score calculations
 * - Weight renormalization for missing data
 * - Confidence scoring
 * - Risk level classification
 * - Backward compatibility
 * ============================================================================
 */

import {
  calculateRiskScore,
  calculateThreatIntelligenceScore,
  calculateVirusTotalScore,
  calculateUrlIntelligenceScore,
  calculateSSLScore,
  calculateReputationScore,
  calculateConfidence,
  getRiskLevel,
  RiskEvaluation,
  RiskFactor,
} from "../src/services/risk-score.service";

import type { SslAnalysisResult } from "../src/services/ssl.service";
import type { SafeBrowsingResult } from "../src/services/safe-browsing.service";
import type { VirusTotalResult } from "../src/services/virustotal.service";

// ============================================================================
// Test Utilities
// ============================================================================

interface TestResult {
  num: number;
  name: string;
  passed: boolean;
  expected: string;
  actual: string;
}

const results: TestResult[] = [];
let testNum = 0;

function test(name: string, fn: () => { passed: boolean; expected: string; actual: string }) {
  testNum++;
  try {
    const result = fn();
    results.push({ num: testNum, name, ...result });
  } catch (e: any) {
    results.push({ num: testNum, name, passed: false, expected: "No error", actual: e.message });
  }
}

// ============================================================================
// Helper: Clean Scan Data Factories
// ============================================================================

function cleanSsl(): SslAnalysisResult {
  return { enabled: true, valid: true, status: "valid", issuer: "DigiCert", validDaysRemaining: 300, protocol: "TLSv1.3" };
}

function cleanSafeBrowsing(): SafeBrowsingResult {
  return { checked: true, threatDetected: false, status: "clean", threats: [] };
}

function cleanVirusTotal(): VirusTotalResult {
  return {
    checked: true, available: true, malicious: false, suspicious: false,
    harmless: 70, maliciousCount: 0, suspiciousCount: 0, undetectedCount: 2,
    totalEngines: 72, detectionRatio: "0 / 72", enginesFlagged: 0,
    permalink: null, status: "clean",
  };
}

function unavailableSafeBrowsing(): SafeBrowsingResult {
  return { checked: false, threatDetected: false, status: "unavailable" };
}

function unavailableVirusTotal(): VirusTotalResult {
  return {
    checked: false, available: false, malicious: false, suspicious: false,
    harmless: 0, maliciousCount: 0, suspiciousCount: 0, undetectedCount: 0,
    totalEngines: 0, error: "VirusTotal service unavailable", status: "unavailable",
  };
}

function unavailableSsl(): SslAnalysisResult {
  return { enabled: true, valid: false, status: "unavailable" };
}

// ============================================================================
// TEST SUITE
// ============================================================================

function runRiskEngineTestSuite() {
  console.log("==================================================");
  console.log("RISK SCORING ENGINE — COMPREHENSIVE TEST SUITE");
  console.log("==================================================\n");

  // ──────────────────────────────────────────────────────────────
  // TEST 1: Completely clean URL
  // ──────────────────────────────────────────────────────────────
  test("Clean URL produces SAFE score (< 20)", () => {
    const result = calculateRiskScore({
      normalizedUrl: "https://wikipedia.org/wiki/Computer_security",
      domain: "wikipedia.org",
      ssl: cleanSsl(),
      safeBrowsing: cleanSafeBrowsing(),
      virusTotal: cleanVirusTotal(),
    });

    return {
      passed: result.score >= 0 && result.score < 20 && result.level === "SAFE",
      expected: "score < 20, level = SAFE",
      actual: `score=${result.score}, level=${result.level}`,
    };
  });

  // ──────────────────────────────────────────────────────────────
  // TEST 2: Valid HTTPS URL — low SSL factor
  // ──────────────────────────────────────────────────────────────
  test("Valid HTTPS URL produces SSL factor score of 0", () => {
    const sslFactor = calculateSSLScore(cleanSsl());

    return {
      passed: sslFactor.score === 0 && sslFactor.status === "VALID" && sslFactor.available === true,
      expected: "SSL score=0, status=VALID, available=true",
      actual: `score=${sslFactor.score}, status=${sslFactor.status}, available=${sslFactor.available}`,
    };
  });

  // ──────────────────────────────────────────────────────────────
  // TEST 3: HTTP URL — elevated SSL factor
  // ──────────────────────────────────────────────────────────────
  test("HTTP-only URL produces elevated SSL factor score (40)", () => {
    const httpSsl: SslAnalysisResult = { enabled: false, valid: false, status: "unavailable", issuer: "No SSL (HTTP Only)" };
    const sslFactor = calculateSSLScore(httpSsl);

    return {
      passed: sslFactor.score === 40 && sslFactor.status === "NO_HTTPS",
      expected: "SSL score=40, status=NO_HTTPS",
      actual: `score=${sslFactor.score}, status=${sslFactor.status}`,
    };
  });

  // ──────────────────────────────────────────────────────────────
  // TEST 4: Invalid SSL certificate
  // ──────────────────────────────────────────────────────────────
  test("Invalid SSL certificate produces score >= 70", () => {
    const invalidSsl: SslAnalysisResult = { enabled: true, valid: false, status: "invalid", issuer: "Unknown" };
    const sslFactor = calculateSSLScore(invalidSsl);

    return {
      passed: sslFactor.score !== null && sslFactor.score >= 70 && sslFactor.available === true,
      expected: "SSL score >= 70, available=true",
      actual: `score=${sslFactor.score}, status=${sslFactor.status}`,
    };
  });

  // ──────────────────────────────────────────────────────────────
  // TEST 5: Safe Browsing phishing result
  // ──────────────────────────────────────────────────────────────
  test("Safe Browsing phishing threat produces score 90", () => {
    const phishing: SafeBrowsingResult = {
      checked: true, threatDetected: true, threatType: "SOCIAL_ENGINEERING", status: "threat_found",
    };
    const factor = calculateThreatIntelligenceScore(phishing);

    return {
      passed: factor.score === 90 && factor.status === "THREAT_DETECTED",
      expected: "score=90, status=THREAT_DETECTED",
      actual: `score=${factor.score}, status=${factor.status}`,
    };
  });

  // ──────────────────────────────────────────────────────────────
  // TEST 6: Safe Browsing malware result
  // ──────────────────────────────────────────────────────────────
  test("Safe Browsing malware threat produces score 100", () => {
    const malware: SafeBrowsingResult = {
      checked: true, threatDetected: true, threatType: "MALWARE", status: "threat_found",
    };
    const factor = calculateThreatIntelligenceScore(malware);

    return {
      passed: factor.score === 100 && factor.status === "THREAT_DETECTED",
      expected: "score=100, status=THREAT_DETECTED",
      actual: `score=${factor.score}, status=${factor.status}`,
    };
  });

  // ──────────────────────────────────────────────────────────────
  // TEST 7: VirusTotal 0 malicious
  // ──────────────────────────────────────────────────────────────
  test("VirusTotal with 0 malicious produces score 0", () => {
    const factor = calculateVirusTotalScore({
      checked: true, available: true, maliciousCount: 0, suspiciousCount: 0, totalEngines: 72, status: "clean",
    });

    return {
      passed: factor.score === 0 && factor.status === "CLEAN",
      expected: "score=0, status=CLEAN",
      actual: `score=${factor.score}, status=${factor.status}`,
    };
  });

  // ──────────────────────────────────────────────────────────────
  // TEST 8: VirusTotal low malicious ratio (1-2%)
  // ──────────────────────────────────────────────────────────────
  test("VirusTotal low malicious ratio (1/70 = 1.4%) produces score 20", () => {
    const factor = calculateVirusTotalScore({
      checked: true, available: true, maliciousCount: 1, suspiciousCount: 0, totalEngines: 70, status: "threat_found",
    });

    return {
      passed: factor.score === 20 && factor.status === "MALICIOUS_DETECTIONS",
      expected: "score=20, status=MALICIOUS_DETECTIONS",
      actual: `score=${factor.score}, status=${factor.status}`,
    };
  });

  // ──────────────────────────────────────────────────────────────
  // TEST 9: VirusTotal high malicious ratio (>20%)
  // ──────────────────────────────────────────────────────────────
  test("VirusTotal high malicious ratio (20/70 = 28.6%) produces score 100", () => {
    const factor = calculateVirusTotalScore({
      checked: true, available: true, maliciousCount: 20, suspiciousCount: 3, totalEngines: 70, status: "threat_found",
    });

    return {
      passed: factor.score === 100 && factor.status === "MALICIOUS_DETECTIONS",
      expected: "score=100",
      actual: `score=${factor.score}, ratio=${(20/70*100).toFixed(1)}%`,
    };
  });

  // ──────────────────────────────────────────────────────────────
  // TEST 10: Suspicious URL characteristics
  // ──────────────────────────────────────────────────────────────
  test("URL with IP address and suspicious encoding scores high on URL intelligence", () => {
    const factor = calculateUrlIntelligenceScore(
      "https://192.168.1.1/%2e%2e/%2e%2e/admin",
      "192.168.1.1"
    );

    return {
      passed: factor.score !== null && factor.score >= 25 && factor.status === "SUSPICIOUS_FEATURES",
      expected: "score >= 25 (IP address = 25 + encoding)",
      actual: `score=${factor.score}, status=${factor.status}`,
    };
  });

  // ──────────────────────────────────────────────────────────────
  // TEST 11: Multiple threat indicators
  // ──────────────────────────────────────────────────────────────
  test("Multiple threat indicators produce HIGH or CRITICAL score", () => {
    const result = calculateRiskScore({
      normalizedUrl: "https://sbi-verify-account.xyz/login",
      domain: "sbi-verify-account.xyz",
      ssl: { enabled: false, valid: false, status: "unavailable" },
      safeBrowsing: { checked: true, threatDetected: true, threatType: "SOCIAL_ENGINEERING", status: "threat_found" },
      virusTotal: {
        checked: true, available: true, malicious: true, suspicious: true,
        harmless: 20, maliciousCount: 14, suspiciousCount: 3, undetectedCount: 33,
        totalEngines: 70, detectionRatio: "17 / 70", enginesFlagged: 17,
        permalink: "https://virustotal.com/url/123", status: "threat_found",
      },
    });

    return {
      passed: result.score >= 60 && (result.level === "HIGH" || result.level === "CRITICAL"),
      expected: "score >= 60, level = HIGH or CRITICAL",
      actual: `score=${result.score}, level=${result.level}`,
    };
  });

  // ──────────────────────────────────────────────────────────────
  // TEST 12: Missing Safe Browsing result
  // ──────────────────────────────────────────────────────────────
  test("Missing Safe Browsing does NOT produce false safe result", () => {
    const factor = calculateThreatIntelligenceScore({
      checked: false, threatDetected: false, status: "unavailable",
    });

    return {
      passed: factor.available === false && factor.score === null,
      expected: "available=false, score=null (not falsely safe)",
      actual: `available=${factor.available}, score=${factor.score}`,
    };
  });

  // ──────────────────────────────────────────────────────────────
  // TEST 13: Missing VirusTotal result
  // ──────────────────────────────────────────────────────────────
  test("Missing VirusTotal does NOT produce false clean result", () => {
    const factor = calculateVirusTotalScore({
      checked: false, available: false, maliciousCount: 0, suspiciousCount: 0,
      totalEngines: 0, error: "VirusTotal service unavailable", status: "unavailable",
    });

    return {
      passed: factor.available === false && factor.score === null,
      expected: "available=false, score=null",
      actual: `available=${factor.available}, score=${factor.score}`,
    };
  });

  // ──────────────────────────────────────────────────────────────
  // TEST 14: Missing SSL result
  // ──────────────────────────────────────────────────────────────
  test("Unavailable SSL inspection is marked unavailable", () => {
    const ssl: SslAnalysisResult = { enabled: true, valid: false, status: "unavailable" };
    const factor = calculateSSLScore(ssl);

    return {
      passed: factor.available === false && factor.score === null,
      expected: "available=false, score=null",
      actual: `available=${factor.available}, score=${factor.score}`,
    };
  });

  // ──────────────────────────────────────────────────────────────
  // TEST 15: Conflicting security signals
  // ──────────────────────────────────────────────────────────────
  test("Conflicting signals (Safe Browsing clean, VT malicious) reduces confidence", () => {
    const result = calculateRiskScore({
      normalizedUrl: "https://example-site.com",
      domain: "example-site.com",
      ssl: cleanSsl(),
      safeBrowsing: cleanSafeBrowsing(),
      virusTotal: {
        checked: true, available: true, malicious: true, suspicious: false,
        harmless: 50, maliciousCount: 10, suspiciousCount: 0, undetectedCount: 10,
        totalEngines: 70, detectionRatio: "10 / 70", enginesFlagged: 10,
        permalink: null, status: "threat_found",
      },
    });

    // With clean SB (score=0) and high VT (score>=60), there's a mixed signal
    // Confidence should be less than a fully consistent assessment
    const fullClean = calculateRiskScore({
      normalizedUrl: "https://example-site.com",
      domain: "example-site.com",
      ssl: cleanSsl(),
      safeBrowsing: cleanSafeBrowsing(),
      virusTotal: cleanVirusTotal(),
    });

    return {
      passed: result.confidence <= fullClean.confidence,
      expected: "Conflicting confidence <= fully clean confidence",
      actual: `conflicting=${result.confidence}, clean=${fullClean.confidence}`,
    };
  });

  // ──────────────────────────────────────────────────────────────
  // TEST 16: Final score 0–19 (SAFE)
  // ──────────────────────────────────────────────────────────────
  test("Score 0-19 maps to SAFE risk level", () => {
    const l0 = getRiskLevel(0);
    const l10 = getRiskLevel(10);
    const l19 = getRiskLevel(19);

    return {
      passed: l0 === "SAFE" && l10 === "SAFE" && l19 === "SAFE",
      expected: "All SAFE",
      actual: `0=${l0}, 10=${l10}, 19=${l19}`,
    };
  });

  // ──────────────────────────────────────────────────────────────
  // TEST 17: Final score 20–39 (LOW)
  // ──────────────────────────────────────────────────────────────
  test("Score 20-39 maps to LOW risk level", () => {
    const l20 = getRiskLevel(20);
    const l30 = getRiskLevel(30);
    const l39 = getRiskLevel(39);

    return {
      passed: l20 === "LOW" && l30 === "LOW" && l39 === "LOW",
      expected: "All LOW",
      actual: `20=${l20}, 30=${l30}, 39=${l39}`,
    };
  });

  // ──────────────────────────────────────────────────────────────
  // TEST 18: Final score 40–59 (MODERATE)
  // ──────────────────────────────────────────────────────────────
  test("Score 40-59 maps to MODERATE risk level", () => {
    const l40 = getRiskLevel(40);
    const l50 = getRiskLevel(50);
    const l59 = getRiskLevel(59);

    return {
      passed: l40 === "MODERATE" && l50 === "MODERATE" && l59 === "MODERATE",
      expected: "All MODERATE",
      actual: `40=${l40}, 50=${l50}, 59=${l59}`,
    };
  });

  // ──────────────────────────────────────────────────────────────
  // TEST 19: Final score 60–79 (HIGH)
  // ──────────────────────────────────────────────────────────────
  test("Score 60-79 maps to HIGH risk level", () => {
    const l60 = getRiskLevel(60);
    const l70 = getRiskLevel(70);
    const l79 = getRiskLevel(79);

    return {
      passed: l60 === "HIGH" && l70 === "HIGH" && l79 === "HIGH",
      expected: "All HIGH",
      actual: `60=${l60}, 70=${l70}, 79=${l79}`,
    };
  });

  // ──────────────────────────────────────────────────────────────
  // TEST 20: Final score 80–100 (CRITICAL)
  // ──────────────────────────────────────────────────────────────
  test("Score 80-100 maps to CRITICAL risk level", () => {
    const l80 = getRiskLevel(80);
    const l90 = getRiskLevel(90);
    const l100 = getRiskLevel(100);

    return {
      passed: l80 === "CRITICAL" && l90 === "CRITICAL" && l100 === "CRITICAL",
      expected: "All CRITICAL",
      actual: `80=${l80}, 90=${l90}, 100=${l100}`,
    };
  });

  // ──────────────────────────────────────────────────────────────
  // TEST 21: Score clamping (always 0–100)
  // ──────────────────────────────────────────────────────────────
  test("Final score is always clamped between 0 and 100", () => {
    // Test various extreme inputs
    const resultClean = calculateRiskScore({
      normalizedUrl: "https://google.com",
      domain: "google.com",
      ssl: cleanSsl(),
      safeBrowsing: cleanSafeBrowsing(),
      virusTotal: cleanVirusTotal(),
    });

    const resultDangerous = calculateRiskScore({
      normalizedUrl: "http://192.168.1.1/malware/%2e%2e/hack",
      domain: "192.168.1.1",
      ssl: { enabled: false, valid: false, status: "unavailable" },
      safeBrowsing: { checked: true, threatDetected: true, threatType: "MALWARE", status: "threat_found" },
      virusTotal: {
        checked: true, available: true, malicious: true, suspicious: true,
        harmless: 0, maliciousCount: 60, suspiciousCount: 10, undetectedCount: 0,
        totalEngines: 70, detectionRatio: "70 / 70", enginesFlagged: 70, permalink: null, status: "threat_found",
      },
    });

    return {
      passed: resultClean.score >= 0 && resultClean.score <= 100 &&
              resultDangerous.score >= 0 && resultDangerous.score <= 100,
      expected: "All scores between 0 and 100",
      actual: `clean=${resultClean.score}, dangerous=${resultDangerous.score}`,
    };
  });

  // ──────────────────────────────────────────────────────────────
  // TEST 22: Determinism — same input = same output
  // ──────────────────────────────────────────────────────────────
  test("Deterministic: same input always produces same score", () => {
    const input = {
      normalizedUrl: "https://test-phishing.xyz/login?id=123",
      domain: "test-phishing.xyz",
      ssl: cleanSsl(),
      safeBrowsing: { checked: true, threatDetected: true, threatType: "SOCIAL_ENGINEERING", status: "threat_found" as const },
      virusTotal: {
        checked: true, available: true, malicious: true, suspicious: false,
        harmless: 65, maliciousCount: 3, suspiciousCount: 0, undetectedCount: 2,
        totalEngines: 70, detectionRatio: "3 / 70", enginesFlagged: 3, permalink: null, status: "threat_found" as const,
      },
    };

    const r1 = calculateRiskScore(input);
    const r2 = calculateRiskScore(input);
    const r3 = calculateRiskScore(input);

    return {
      passed: r1.score === r2.score && r2.score === r3.score &&
              r1.level === r2.level && r2.level === r3.level &&
              r1.confidence === r2.confidence && r2.confidence === r3.confidence,
      expected: "All three runs produce identical results",
      actual: `scores=[${r1.score}, ${r2.score}, ${r3.score}], levels=[${r1.level}, ${r2.level}, ${r3.level}]`,
    };
  });

  // ──────────────────────────────────────────────────────────────
  // TEST 23: Confidence always 0–100
  // ──────────────────────────────────────────────────────────────
  test("Confidence is always between 0 and 100", () => {
    const r1 = calculateRiskScore({
      normalizedUrl: "https://google.com", domain: "google.com",
      ssl: cleanSsl(), safeBrowsing: cleanSafeBrowsing(), virusTotal: cleanVirusTotal(),
    });

    const r2 = calculateRiskScore({
      normalizedUrl: "https://test.com", domain: "test.com",
      ssl: unavailableSsl(), safeBrowsing: unavailableSafeBrowsing(), virusTotal: unavailableVirusTotal(),
    });

    return {
      passed: r1.confidence >= 0 && r1.confidence <= 100 &&
              r2.confidence >= 0 && r2.confidence <= 100,
      expected: "All confidences between 0 and 100",
      actual: `full=${r1.confidence}, unavailable=${r2.confidence}`,
    };
  });

  // ──────────────────────────────────────────────────────────────
  // TEST 24: Factor weights sum to 1.0
  // ──────────────────────────────────────────────────────────────
  test("All factor weights sum to 1.0 (100%)", () => {
    const result = calculateRiskScore({
      normalizedUrl: "https://example.com", domain: "example.com",
      ssl: cleanSsl(), safeBrowsing: cleanSafeBrowsing(), virusTotal: cleanVirusTotal(),
    });

    const totalWeight = result.factors.reduce((sum, f) => sum + f.weight, 0);
    const isClose = Math.abs(totalWeight - 1.0) < 0.001;

    return {
      passed: isClose,
      expected: "Total weight ≈ 1.0",
      actual: `totalWeight=${totalWeight.toFixed(4)}`,
    };
  });

  // ──────────────────────────────────────────────────────────────
  // TEST 25: Backward compatibility — old interface shape
  // ──────────────────────────────────────────────────────────────
  test("Backward compatibility: returns score, level, reasons, appliedRules, riskScore, riskLevel", () => {
    const result = calculateRiskScore({
      normalizedUrl: "https://example.com", domain: "example.com",
      ssl: cleanSsl(), safeBrowsing: cleanSafeBrowsing(), virusTotal: cleanVirusTotal(),
    });

    const hasOldFields =
      typeof result.score === "number" &&
      typeof result.level === "string" &&
      Array.isArray(result.reasons) &&
      Array.isArray(result.appliedRules) &&
      typeof result.riskScore === "number" &&
      typeof result.riskLevel === "string";

    const hasNewFields =
      typeof result.confidence === "number" &&
      Array.isArray(result.factors) &&
      result.assessment !== undefined;

    return {
      passed: hasOldFields && hasNewFields,
      expected: "Both old and new interface fields present",
      actual: `oldFields=${hasOldFields}, newFields=${hasNewFields}`,
    };
  });

  // ──────────────────────────────────────────────────────────────
  // TEST 26: Weight renormalization with missing APIs
  // ──────────────────────────────────────────────────────────────
  test("Weight renormalization: missing Safe Browsing doesn't artificially lower score", () => {
    // With VT threat, missing SB should NOT make the site appear safer
    const withSB = calculateRiskScore({
      normalizedUrl: "https://test.xyz", domain: "test.xyz",
      ssl: cleanSsl(),
      safeBrowsing: cleanSafeBrowsing(),
      virusTotal: {
        checked: true, available: true, malicious: true, suspicious: false,
        harmless: 50, maliciousCount: 15, suspiciousCount: 0, undetectedCount: 5,
        totalEngines: 70, detectionRatio: "15 / 70", enginesFlagged: 15, permalink: null, status: "threat_found",
      },
    });

    const withoutSB = calculateRiskScore({
      normalizedUrl: "https://test.xyz", domain: "test.xyz",
      ssl: cleanSsl(),
      safeBrowsing: unavailableSafeBrowsing(),
      virusTotal: {
        checked: true, available: true, malicious: true, suspicious: false,
        harmless: 50, maliciousCount: 15, suspiciousCount: 0, undetectedCount: 5,
        totalEngines: 70, detectionRatio: "15 / 70", enginesFlagged: 15, permalink: null, status: "threat_found",
      },
    });

    // Without SB, VT weight should be renormalized UP so the score doesn't drop
    return {
      passed: withoutSB.score >= withSB.score * 0.5, // Should still be significant
      expected: "Score without SB is not artificially low",
      actual: `withSB=${withSB.score}, withoutSB=${withoutSB.score}`,
    };
  });

  // ──────────────────────────────────────────────────────────────
  // TEST 27: URL intelligence — weak keywords NOT over-weighted
  // ──────────────────────────────────────────────────────────────
  test("URL with only common keywords (login, verify) scores LOW on URL intelligence", () => {
    const factor = calculateUrlIntelligenceScore(
      "https://mybank.com/login/verify-account",
      "mybank.com"
    );

    // "login" and "verify" are common legitimate URL patterns
    // Score should be low — no IP, no punycode, no structural issues
    return {
      passed: factor.score !== null && factor.score < 30,
      expected: "URL intelligence score < 30 (weak keywords not over-weighted)",
      actual: `score=${factor.score}`,
    };
  });

  // ──────────────────────────────────────────────────────────────
  // TEST 28: Expired SSL certificate
  // ──────────────────────────────────────────────────────────────
  test("Expired SSL certificate produces score 60", () => {
    const expired: SslAnalysisResult = { enabled: true, valid: false, status: "expired", issuer: "DigiCert" };
    const factor = calculateSSLScore(expired);

    return {
      passed: factor.score === 60 && factor.status === "EXPIRED_CERTIFICATE",
      expected: "score=60, status=EXPIRED_CERTIFICATE",
      actual: `score=${factor.score}, status=${factor.status}`,
    };
  });

  // ──────────────────────────────────────────────────────────────
  // TEST 29: VirusTotal suspicious-only detections
  // ──────────────────────────────────────────────────────────────
  test("VirusTotal with only suspicious detections adds bonus correctly", () => {
    const factorLow = calculateVirusTotalScore({
      checked: true, available: true, maliciousCount: 0, suspiciousCount: 1, totalEngines: 70, status: "clean",
    });

    const factorHigh = calculateVirusTotalScore({
      checked: true, available: true, maliciousCount: 0, suspiciousCount: 5, totalEngines: 70, status: "clean",
    });

    return {
      passed: factorLow.score === 5 && factorHigh.score === 15,
      expected: "1 suspicious = score 5, 5 suspicious = score 15",
      actual: `1susp=${factorLow.score}, 5susp=${factorHigh.score}`,
    };
  });

  // ──────────────────────────────────────────────────────────────
  // TEST 30: Reputation factor unavailable (no fake data)
  // ──────────────────────────────────────────────────────────────
  test("Reputation factor is correctly marked as unavailable", () => {
    const factor = calculateReputationScore();

    return {
      passed: factor.available === false && factor.score === null && factor.status === "UNAVAILABLE",
      expected: "available=false, score=null, status=UNAVAILABLE",
      actual: `available=${factor.available}, score=${factor.score}, status=${factor.status}`,
    };
  });

  // ──────────────────────────────────────────────────────────────
  // TEST 31: Punycode domain detection
  // ──────────────────────────────────────────────────────────────
  test("Punycode domain (xn--) is detected by URL intelligence", () => {
    const factor = calculateUrlIntelligenceScore(
      "https://xn--pple-43d.com",
      "xn--pple-43d.com"
    );

    return {
      passed: factor.score !== null && factor.score >= 20 && factor.status === "SUSPICIOUS_FEATURES",
      expected: "score >= 20 (punycode detected)",
      actual: `score=${factor.score}`,
    };
  });

  // ──────────────────────────────────────────────────────────────
  // TEST 32: Risk level always matches score range
  // ──────────────────────────────────────────────────────────────
  test("Risk level always matches score range in full calculation", () => {
    const scenarios = [
      { url: "https://google.com", domain: "google.com", ssl: cleanSsl(), sb: cleanSafeBrowsing(), vt: cleanVirusTotal() },
      {
        url: "http://192.168.1.1", domain: "192.168.1.1",
        ssl: { enabled: false, valid: false, status: "unavailable" as const },
        sb: { checked: true, threatDetected: true, threatType: "MALWARE", status: "threat_found" as const },
        vt: { checked: true, available: true, malicious: true, suspicious: true, harmless: 0, maliciousCount: 50, suspiciousCount: 10, undetectedCount: 0, totalEngines: 60, detectionRatio: "60 / 60", enginesFlagged: 60, permalink: null, status: "threat_found" as const },
      },
    ];

    let allMatch = true;
    const details: string[] = [];

    for (const s of scenarios) {
      const r = calculateRiskScore({
        normalizedUrl: s.url, domain: s.domain,
        ssl: s.ssl, safeBrowsing: s.sb, virusTotal: s.vt,
      });

      const expectedLevel = getRiskLevel(r.score);
      if (r.level !== expectedLevel) {
        allMatch = false;
        details.push(`score=${r.score}: got ${r.level}, expected ${expectedLevel}`);
      }
    }

    return {
      passed: allMatch,
      expected: "All risk levels match their score ranges",
      actual: allMatch ? "All matched" : details.join("; "),
    };
  });

  // ============================================================================
  // RESULTS SUMMARY
  // ============================================================================
  console.log("\n==================================================");
  console.log("RISK ENGINE TEST RESULTS SUMMARY");
  console.log("==================================================");

  let allPassed = true;
  for (const r of results) {
    const icon = r.passed ? "✅ PASS" : "❌ FAIL";
    console.log(`${icon} [${r.num}] ${r.name}`);
    console.log(`       Expected: ${r.expected}`);
    console.log(`       Actual:   ${r.actual}\n`);
    if (!r.passed) allPassed = false;
  }

  console.log("==================================================");
  console.log(`TOTAL TESTS: ${results.length} | PASSED: ${results.filter((r) => r.passed).length} | FAILED: ${results.filter((r) => !r.passed).length}`);
  console.log(`OVERALL STATUS: ${allPassed ? "ALL RISK ENGINE TESTS PASSED! 🚀" : "SOME TESTS FAILED ❌"}`);
  console.log("==================================================\n");

  if (!allPassed) {
    process.exitCode = 1;
  }
}

runRiskEngineTestSuite();
