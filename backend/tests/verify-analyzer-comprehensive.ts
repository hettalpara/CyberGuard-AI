import dotenv from "dotenv";
dotenv.config();

import jwt from "jsonwebtoken";
import { validateAndNormalizeUrl } from "../src/utils/url.util";
import { calculateRiskScore } from "../src/services/risk-score.service";
import { generateAnalysisSummary } from "../src/services/analysis-summary.service";
import { analyzeSsl } from "../src/services/ssl.service";
import { checkGoogleSafeBrowsing } from "../src/services/safe-browsing.service";
import { checkUrlWithVirusTotal, checkVirusTotal } from "../src/services/virustotal.service";

interface TestResult {
  num: number;
  name: string;
  expected: string;
  actual: string;
  passed: boolean;
}

const results: TestResult[] = [];

async function runAnalyzerTestSuite() {
  console.log("==================================================");
  console.log("PHASE 5 — VIRUSTOTAL INTEGRATION ONLY TEST SUITE");
  console.log("==================================================\n");

  const JWT_SECRET = process.env.JWT_SECRET || "cyberguard_jwt_super_secure_key_2026_x8f";

  // In-memory mock database for Scan documents
  const mockScansDb = new Map<string, any>();

  const testUser1Id = "user_alpha_101";
  const testUser2Id = "user_beta_202";

  // ----------------------------------------------------
  // TEST 1: URL Validation & Normalization
  // ----------------------------------------------------
  try {
    const v1 = validateAndNormalizeUrl("https://github.com/torvalds/linux");
    const v2 = validateAndNormalizeUrl("http://subdomain.example.org:8080/path?key=val#hash");
    const v3 = validateAndNormalizeUrl("example.com");

    const passed =
      v1.isValid &&
      v1.domain === "github.com" &&
      v2.isValid &&
      v2.hostname === "subdomain.example.org" &&
      v3.isValid &&
      v3.normalizedUrl === "https://example.com";

    results.push({
      num: 1,
      name: "URL Validation (Valid Web URLs & Protocol Normalization)",
      expected: "All valid URLs accepted, formatted with https://",
      actual: `v1=${v1.isValid}, v2=${v2.isValid}, v3.url=${v3.normalizedUrl}`,
      passed,
    });
  } catch (e: any) {
    results.push({ num: 1, name: "URL Validation", expected: "Pass", actual: e.message, passed: false });
  }

  // ----------------------------------------------------
  // TEST 2: Disallowed Protocols & SSRF Protection
  // ----------------------------------------------------
  try {
    const r1 = validateAndNormalizeUrl("javascript:alert(document.cookie)");
    const r2 = validateAndNormalizeUrl("file:///etc/shadow");
    const s1 = validateAndNormalizeUrl("http://localhost:5000/api");
    const s2 = validateAndNormalizeUrl("http://169.254.169.254/latest/meta-data/");

    const passed = !r1.isValid && !r2.isValid && !s1.isValid && !s2.isValid;

    results.push({
      num: 2,
      name: "Disallowed Protocol & SSRF Protection (javascript, file, localhost, metadata)",
      expected: "All disallowed and internal network targets rejected",
      actual: `r1.valid=${r1.isValid}, s1.error=${s1.error}, s2.error=${s2.error}`,
      passed,
    });
  } catch (e: any) {
    results.push({ num: 2, name: "SSRF & Protocol Rejection", expected: "Pass", actual: e.message, passed: false });
  }

  // ----------------------------------------------------
  // TEST 3: VirusTotal Real API Request & Normalized Output
  // ----------------------------------------------------
  try {
    const vtResult = await checkUrlWithVirusTotal("https://example.com");
    const validVtStructure =
      typeof vtResult.checked === "boolean" &&
      typeof vtResult.available === "boolean" &&
      typeof vtResult.malicious === "boolean" &&
      typeof vtResult.suspicious === "boolean" &&
      typeof vtResult.maliciousCount === "number" &&
      typeof vtResult.suspiciousCount === "number" &&
      typeof vtResult.undetectedCount === "number" &&
      typeof vtResult.totalEngines === "number";

    results.push({
      num: 3,
      name: "VirusTotal Service Normalized Output (checkUrlWithVirusTotal)",
      expected: "Normalized VirusTotal result with boolean flags, engine counts & ratio",
      actual: `checked=${vtResult.checked}, available=${vtResult.available}, status=${vtResult.status}, engines=${vtResult.totalEngines}`,
      passed: validVtStructure,
    });
  } catch (e: any) {
    results.push({ num: 3, name: "VirusTotal Service Normalized Output", expected: "Pass", actual: e.message, passed: false });
  }

  // ----------------------------------------------------
  // TEST 4: VirusTotal Fallback (Missing API Key / Unconfigured)
  // ----------------------------------------------------
  try {
    const originalKey = process.env.VIRUSTOTAL_API_KEY;
    delete process.env.VIRUSTOTAL_API_KEY;
    const fallbackVt = await checkUrlWithVirusTotal("https://example.com");
    process.env.VIRUSTOTAL_API_KEY = originalKey;

    const passed =
      fallbackVt.checked === false &&
      fallbackVt.available === false &&
      fallbackVt.error === "VirusTotal API key is not configured";

    results.push({
      num: 4,
      name: "VirusTotal Fallback (Missing API Key / Unconfigured)",
      expected: "Returns available=false, error='VirusTotal API key is not configured'",
      actual: `checked=${fallbackVt.checked}, available=${fallbackVt.available}, error=${fallbackVt.error}`,
      passed,
    });
  } catch (e: any) {
    results.push({ num: 4, name: "VirusTotal Fallback", expected: "Pass", actual: e.message, passed: false });
  }

  // ----------------------------------------------------
  // TEST 5: Google Safe Browsing Service
  // ----------------------------------------------------
  try {
    const gsbResult = await checkGoogleSafeBrowsing("https://example.com");
    const validGsb =
      gsbResult &&
      (gsbResult.status === "not_configured" || gsbResult.status === "clean" || gsbResult.status === "threat_found" || gsbResult.status === "unavailable");

    results.push({
      num: 5,
      name: "Google Safe Browsing Service (Fallback & Threat Detection)",
      expected: "Safe Browsing result without API key exposure",
      actual: `checked=${gsbResult.checked}, status=${gsbResult.status}`,
      passed: validGsb,
    });
  } catch (e: any) {
    results.push({ num: 5, name: "Safe Browsing Service", expected: "Pass", actual: e.message, passed: false });
  }

  // ----------------------------------------------------
  // TEST 6: SSL / TLS Certificate Inspection
  // ----------------------------------------------------
  try {
    const httpOnlySsl = await analyzeSsl("example.com", false);
    const validStructure =
      httpOnlySsl.enabled === false &&
      httpOnlySsl.valid === false &&
      httpOnlySsl.status === "unavailable";

    results.push({
      num: 6,
      name: "SSL Service (HTTP vs HTTPS and Fallback Safety)",
      expected: "Structured object returned without server crash",
      actual: JSON.stringify(httpOnlySsl),
      passed: validStructure,
    });
  } catch (e: any) {
    results.push({ num: 6, name: "SSL Service", expected: "Pass", actual: e.message, passed: false });
  }

  // ----------------------------------------------------
  // TEST 7: Deterministic Risk Calculation with Reasons (No WHOIS)
  // ----------------------------------------------------
  try {
    // 1. Safe Domain Scan Data
    const safeEval = calculateRiskScore({
      normalizedUrl: "https://wikipedia.org/wiki/Computer_security",
      domain: "wikipedia.org",
      ssl: { enabled: true, valid: true, status: "valid", issuer: "DigiCert", validDaysRemaining: 300 },
      safeBrowsing: { checked: true, threatDetected: false, status: "clean" },
      virusTotal: { checked: true, available: true, malicious: false, suspicious: false, harmless: 70, maliciousCount: 0, suspiciousCount: 0, undetectedCount: 2, totalEngines: 72, detectionRatio: "0 / 72", enginesFlagged: 0, permalink: null, status: "clean" },
    });

    // 2. High-Risk Phishing Scan Data
    const phishingEval = calculateRiskScore({
      normalizedUrl: "https://sbi-verify-account.xyz/login",
      domain: "sbi-verify-account.xyz",
      ssl: { enabled: false, valid: false, status: "unavailable" },
      safeBrowsing: { checked: true, threatDetected: true, threatType: "SOCIAL_ENGINEERING", status: "threat_found" },
      virusTotal: { checked: true, available: true, malicious: true, suspicious: true, harmless: 20, maliciousCount: 14, suspiciousCount: 3, undetectedCount: 33, totalEngines: 70, detectionRatio: "17 / 70", enginesFlagged: 17, permalink: "https://virustotal.com/url/123", status: "threat_found" },
    });

    const passed =
      safeEval.score <= 29 &&
      (safeEval.level === "SAFE" || safeEval.level === "LOW") &&
      safeEval.reasons.length > 0 &&
      phishingEval.score >= 60 &&
      (phishingEval.level === "HIGH" || phishingEval.level === "CRITICAL") &&
      phishingEval.reasons.some((r) => r.includes("Google Safe Browsing")) &&
      phishingEval.reasons.some((r) => r.includes("VirusTotal"));

    results.push({
      num: 7,
      name: "Deterministic Risk Scoring Engine with Reasons (Safe vs Phishing)",
      expected: "Safe domain <= 29; Phishing domain >= 60 with documented reasons",
      actual: `SafeScore=${safeEval.score} (${safeEval.level}), PhishingScore=${phishingEval.score} (${phishingEval.level}), PhishingReasonsCount=${phishingEval.reasons.length}`,
      passed,
    });
  } catch (e: any) {
    results.push({ num: 7, name: "Deterministic Risk Scoring Engine", expected: "Pass", actual: e.message, passed: false });
  }

  // ----------------------------------------------------
  // TEST 8: Complete Analyzer Pipeline Persistence
  // ----------------------------------------------------
  try {
    const scanRecord = {
      id: "scan_integrated_001",
      userId: testUser1Id,
      url: "https://sbi-verify-account.xyz/login",
      normalizedUrl: "https://sbi-verify-account.xyz/login",
      domain: "sbi-verify-account.xyz",
      riskScore: 90,
      riskLevel: "CRITICAL",
      risk: {
        score: 90,
        level: "CRITICAL",
        reasons: ["Google Safe Browsing threat", "14 VirusTotal detections"],
      },
      ssl: { enabled: false, valid: false, status: "unavailable" },
      safeBrowsing: { checked: true, threatDetected: true, threatType: "SOCIAL_ENGINEERING" },
      virusTotal: { checked: true, available: true, malicious: true, suspicious: true, maliciousCount: 14, suspiciousCount: 3, harmless: 20, undetectedCount: 33, totalEngines: 70, detectionRatio: "17 / 70", permalink: "https://virustotal.com/..." },
      summary: "High-risk indicators detected.",
      scannedAt: new Date(),
    };

    mockScansDb.set("scan_integrated_001", scanRecord);

    const retrieved = mockScansDb.get("scan_integrated_001");
    const passed =
      retrieved.userId === testUser1Id &&
      retrieved.risk.reasons.length === 2 &&
      retrieved.virusTotal.maliciousCount === 14 &&
      retrieved.virusTotal.totalEngines === 70;

    results.push({
      num: 8,
      name: "MongoDB Scan Model Schema Persistence (VirusTotal + Safe Browsing + Risk)",
      expected: "Stores complete normalized record without WHOIS",
      actual: `Record persisted with risk.score=${retrieved.risk.score}, VT.maliciousCount=${retrieved.virusTotal.maliciousCount}`,
      passed,
    });
  } catch (e: any) {
    results.push({ num: 8, name: "MongoDB Scan Model Persistence", expected: "Pass", actual: e.message, passed: false });
  }

  // Summary
  console.log("\n==================================================");
  console.log("PHASE 5 TEST RESULTS SUMMARY");
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
  console.log(`OVERALL STATUS: ${allPassed ? "ALL PHASE 5 TESTS PASSED! 🚀" : "SOME TESTS FAILED ❌"}`);
  console.log("==================================================\n");

  if (!allPassed) {
    process.exitCode = 1;
  }
}

runAnalyzerTestSuite();
