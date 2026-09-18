// ============================================================================
// Google Safe Browsing Comprehensive Verification Suite
// Validates API integration, state management (CHECKED_NO_THREAT,
// THREAT_DETECTED, UNAVAILABLE, ERROR), risk engine normalization,
// and failure isolation.
// ============================================================================

import dotenv from "dotenv";
dotenv.config();

import { checkGoogleSafeBrowsing, SafeBrowsingResult } from "../src/services/safe-browsing.service";
import { calculateRiskScore, calculateSafeBrowsingScore } from "../src/services/risk-score.service";

interface TestResult {
  num: number;
  name: string;
  expected: string;
  actual: string;
  passed: boolean;
}

const results: TestResult[] = [];

async function runSafeBrowsingTestSuite() {
  console.log("==================================================");
  console.log("GOOGLE SAFE BROWSING VERIFICATION TEST SUITE");
  console.log("==================================================\n");

  const realApiKey = process.env.GOOGLE_SAFE_BROWSING_API_KEY;

  // ----------------------------------------------------
  // TEST 1: API Key Configuration Presence (Backend Only)
  // ----------------------------------------------------
  try {
    const isConfigured = Boolean(realApiKey && realApiKey.trim().length > 0);
    // Never print the actual key!
    results.push({
      num: 1,
      name: "API Key Configuration Presence (Backend only)",
      expected: "configured=true, length > 0, not default placeholder",
      actual: `configured=${isConfigured}, length=${realApiKey?.length || 0}`,
      passed: isConfigured && realApiKey !== "your_google_safe_browsing_api_key",
    });
  } catch (e: any) {
    results.push({ num: 1, name: "API Key check", expected: "Pass", actual: e.message, passed: false });
  }

  // ----------------------------------------------------
  // TEST 2: Real Google API Call on Clean URL (CHECKED_NO_THREAT)
  // ----------------------------------------------------
  try {
    const cleanRes = await checkGoogleSafeBrowsing("https://google.com");

    const passed =
      cleanRes.checked === true &&
      cleanRes.available === true &&
      cleanRes.threatDetected === false &&
      cleanRes.status === "CHECKED_NO_THREAT" &&
      cleanRes.score === 0;

    results.push({
      num: 2,
      name: "Normal Clean URL scan returns CHECKED_NO_THREAT",
      expected: "available=true, threatDetected=false, status=CHECKED_NO_THREAT, score=0",
      actual: `available=${cleanRes.available}, threatDetected=${cleanRes.threatDetected}, status=${cleanRes.status}, score=${cleanRes.score}`,
      passed,
    });
  } catch (e: any) {
    results.push({ num: 2, name: "Clean URL scan", expected: "Pass", actual: e.message, passed: false });
  }

  // ----------------------------------------------------
  // TEST 3: Threat Detection Test Fixture (THREAT_DETECTED)
  // ----------------------------------------------------
  try {
    // Official Google Safe Browsing test URL for phishing
    const testPhishUrl = "https://testsafebrowsing.appspot.com/s/phishing.html";
    const threatRes = await checkGoogleSafeBrowsing(testPhishUrl);

    const passed =
      threatRes.checked === true &&
      threatRes.available === true &&
      threatRes.threatDetected === true &&
      threatRes.status === "THREAT_DETECTED" &&
      threatRes.threatTypes.includes("SOCIAL_ENGINEERING");

    results.push({
      num: 3,
      name: "Confirmed Threat Detection (Official test URL: testsafebrowsing.appspot.com)",
      expected: "available=true, threatDetected=true, status=THREAT_DETECTED, threatTypes contains SOCIAL_ENGINEERING",
      actual: `available=${threatRes.available}, threatDetected=${threatRes.threatDetected}, status=${threatRes.status}, threatTypes=${JSON.stringify(threatRes.threatTypes)}`,
      passed,
    });
  } catch (e: any) {
    results.push({ num: 3, name: "Threat detection test", expected: "Pass", actual: e.message, passed: false });
  }

  // ----------------------------------------------------
  // TEST 4: Missing API Key Handling (UNAVAILABLE, never falsely clean)
  // ----------------------------------------------------
  try {
    delete process.env.GOOGLE_SAFE_BROWSING_API_KEY;

    const missingRes = await checkGoogleSafeBrowsing("https://example.com");

    process.env.GOOGLE_SAFE_BROWSING_API_KEY = realApiKey;

    const passed =
      missingRes.checked === false &&
      missingRes.available === false &&
      missingRes.threatDetected === false &&
      missingRes.status === "UNAVAILABLE" &&
      missingRes.score === null &&
      typeof missingRes.error === "string";

    results.push({
      num: 4,
      name: "Missing API key produces UNAVAILABLE (not false clean)",
      expected: "available=false, status=UNAVAILABLE, score=null",
      actual: `available=${missingRes.available}, status=${missingRes.status}, score=${missingRes.score}`,
      passed,
    });
  } catch (e: any) {
    process.env.GOOGLE_SAFE_BROWSING_API_KEY = realApiKey;
    results.push({ num: 4, name: "Missing API key", expected: "Pass", actual: e.message, passed: false });
  }

  // ----------------------------------------------------
  // TEST 5: Invalid API Key Rejection (ERROR / UNAVAILABLE, never crash)
  // ----------------------------------------------------
  try {
    process.env.GOOGLE_SAFE_BROWSING_API_KEY = "AIzaSyINVALID_KEY_123456789012345678901";

    const invalidRes = await checkGoogleSafeBrowsing("https://example.com");

    process.env.GOOGLE_SAFE_BROWSING_API_KEY = realApiKey;

    const passed =
      invalidRes.available === false &&
      (invalidRes.status === "ERROR" || invalidRes.status === "UNAVAILABLE") &&
      invalidRes.score === null;

    results.push({
      num: 5,
      name: "Invalid API key rejection (graceful ERROR/UNAVAILABLE, no crash)",
      expected: "available=false, status=ERROR/UNAVAILABLE, score=null",
      actual: `available=${invalidRes.available}, status=${invalidRes.status}, error=${invalidRes.error?.substring(0, 30)}...`,
      passed,
    });
  } catch (e: any) {
    process.env.GOOGLE_SAFE_BROWSING_API_KEY = realApiKey;
    results.push({ num: 5, name: "Invalid API key", expected: "Pass", actual: e.message, passed: false });
  }

  // ----------------------------------------------------
  // TEST 6: Risk Engine Score for Clean Safe Browsing (Score = 0)
  // ----------------------------------------------------
  try {
    const cleanInput: SafeBrowsingResult = {
      checked: true,
      available: true,
      threatDetected: false,
      threatTypes: [],
      score: 0,
      status: "CHECKED_NO_THREAT",
      reason: "No threats identified in Google Safe Browsing.",
      provider: "GOOGLE_SAFE_BROWSING",
      checkedAt: new Date().toISOString(),
    };

    const factor = calculateSafeBrowsingScore(cleanInput);

    const passed =
      factor.available === true &&
      factor.score === 0 &&
      factor.impact === "NONE" &&
      factor.status === "CHECKED" &&
      factor.reason.includes("No threats identified");

    results.push({
      num: 6,
      name: "Risk Engine correctly scores clean Safe Browsing as 0 with CHECKED status",
      expected: "available=true, score=0, impact=NONE, status=CHECKED",
      actual: `available=${factor.available}, score=${factor.score}, impact=${factor.impact}, status=${factor.status}`,
      passed,
    });
  } catch (e: any) {
    results.push({ num: 6, name: "Risk Engine clean score", expected: "Pass", actual: e.message, passed: false });
  }

  // ----------------------------------------------------
  // TEST 7: Risk Engine Score for Threat Detected (Score = 90 for Phishing)
  // ----------------------------------------------------
  try {
    const threatInput: SafeBrowsingResult = {
      checked: true,
      available: true,
      threatDetected: true,
      threatTypes: ["SOCIAL_ENGINEERING"],
      score: 90,
      status: "THREAT_DETECTED",
      reason: "Google Safe Browsing flagged SOCIAL_ENGINEERING",
      provider: "GOOGLE_SAFE_BROWSING",
      checkedAt: new Date().toISOString(),
    };

    const factor = calculateSafeBrowsingScore(threatInput);

    const passed =
      factor.available === true &&
      factor.score === 90 &&
      factor.impact === "CRITICAL" &&
      factor.status === "THREAT_DETECTED";

    results.push({
      num: 7,
      name: "Risk Engine scores phishing threat as 90 (CRITICAL)",
      expected: "available=true, score=90, impact=CRITICAL, status=THREAT_DETECTED",
      actual: `available=${factor.available}, score=${factor.score}, impact=${factor.impact}, status=${factor.status}`,
      passed,
    });
  } catch (e: any) {
    results.push({ num: 7, name: "Risk Engine threat score", expected: "Pass", actual: e.message, passed: false });
  }

  // ----------------------------------------------------
  // TEST 8: Risk Engine Weight Renormalization when Safe Browsing is UNAVAILABLE
  // ----------------------------------------------------
  try {
    const unavailInput: SafeBrowsingResult = {
      checked: false,
      available: false,
      threatDetected: false,
      threatTypes: [],
      score: null,
      status: "UNAVAILABLE",
      reason: "Service unavailable",
      provider: "GOOGLE_SAFE_BROWSING",
      checkedAt: new Date().toISOString(),
      error: "Service unavailable",
    };

    const factor = calculateSafeBrowsingScore(unavailInput);

    // Now check full risk score calculation
    // Provide an HTTP-only URL (SSL score 40) to verify renormalization increases the impact of remaining factors
    const riskResult = calculateRiskScore({
      normalizedUrl: "http://suspicious-test.com",
      domain: "suspicious-test.com",
      ssl: { enabled: false, valid: false, status: "unavailable" },
      safeBrowsing: unavailInput,
      virusTotal: {
        checked: true,
        available: true,
        malicious: false,
        suspicious: false,
        maliciousCount: 0,
        suspiciousCount: 0,
        undetectedCount: 70,
        totalEngines: 70,
      },
    });

    // Safe Browsing factor must be unavailable with score null
    const sbFactor = riskResult.factors.find((f) => f.name === "Google Safe Browsing");
    const passed =
      factor.available === false &&
      factor.score === null &&
      sbFactor?.available === false &&
      sbFactor?.score === null &&
      riskResult.score !== null &&
      riskResult.score > 0; // SSL missing still contributes via renormalized weight!

    results.push({
      num: 8,
      name: "Unavailable Safe Browsing: score=null, weight excluded, remaining weights renormalized",
      expected: "available=false, score=null, overall risk recalculated via remaining factors",
      actual: `available=${sbFactor?.available}, score=${sbFactor?.score}, overallScore=${riskResult.score}`,
      passed,
    });
  } catch (e: any) {
    results.push({ num: 8, name: "Weight renormalization", expected: "Pass", actual: e.message, passed: false });
  }

  // ----------------------------------------------------
  // TEST 9: Do NOT treat UNAVAILABLE or ERROR as CHECKED_NO_THREAT
  // ----------------------------------------------------
  try {
    const errorInput: SafeBrowsingResult = {
      checked: false,
      available: false,
      threatDetected: false,
      threatTypes: [],
      score: null,
      status: "ERROR",
      reason: "Google Safe Browsing API error 403",
      provider: "GOOGLE_SAFE_BROWSING",
      checkedAt: new Date().toISOString(),
      error: "Google Safe Browsing API error 403",
    };

    const factor = calculateSafeBrowsingScore(errorInput);

    const passed =
      factor.available === false &&
      factor.score === null &&
      factor.status === "UNAVAILABLE" &&
      !factor.reason.includes("No threats identified");

    results.push({
      num: 9,
      name: "ERROR state is NOT converted into CHECKED_NO_THREAT",
      expected: "available=false, score=null, status=UNAVAILABLE (not 0 or NO_THREAT)",
      actual: `available=${factor.available}, score=${factor.score}, status=${factor.status}`,
      passed,
    });
  } catch (e: any) {
    results.push({ num: 9, name: "Error isolation", expected: "Pass", actual: e.message, passed: false });
  }

  // ----------------------------------------------------
  // Summary
  // ----------------------------------------------------
  console.log("==================================================");
  console.log("SAFE BROWSING TEST RESULTS SUMMARY");
  console.log("==================================================");

  let passedCount = 0;
  for (const r of results) {
    if (r.passed) {
      passedCount++;
      console.log(`✅ PASS [${r.num}] ${r.name}`);
      console.log(`       Expected: ${r.expected}`);
      console.log(`       Actual:   ${r.actual}\n`);
    } else {
      console.log(`❌ FAIL [${r.num}] ${r.name}`);
      console.log(`       Expected: ${r.expected}`);
      console.log(`       Actual:   ${r.actual}\n`);
    }
  }

  console.log("==================================================");
  console.log(`TOTAL TESTS: ${results.length} | PASSED: ${passedCount} | FAILED: ${results.length - passedCount}`);
  if (passedCount === results.length) {
    console.log("OVERALL STATUS: ALL SAFE BROWSING TESTS PASSED! 🚀");
  } else {
    console.log("OVERALL STATUS: SOME TESTS FAILED");
  }
  console.log("==================================================\n");

  if (passedCount !== results.length) {
    process.exit(1);
  }
}

runSafeBrowsingTestSuite().catch((e) => {
  console.error("Test execution failed:", e);
  process.exit(1);
});
