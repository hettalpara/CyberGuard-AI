// ============================================================================
// Comprehensive Verification Suite: Local URL Intelligence & SSL/TLS Analysis
// Verifies:
// Test 1: https://example.com
// Test 2: http://example.com (Expected SSL score: 40)
// Test 3: http://192.0.2.1/login (Expected: IP address indicator)
// Test 4: http://xn--paypa1-9za.example/login (Expected: Punycode indicator)
// Test 5: very long URL (Expected: long URL indicator)
// Test 6: URL with excessive subdomains (Expected: subdomain indicator)
// Test 7: HTTPS certificate failure (Expected: not automatically SAFE)
// Test 8: all external APIs unavailable (Expected: local analysis still works)
// Test 9: all checks unavailable (Expected: INCONCLUSIVE)
// ============================================================================

import { analyzeUrlIntelligence } from "../src/services/url-intelligence.service";
import { analyzeSslUrl, SslAnalysisOutput } from "../src/services/ssl-analysis.service";
import { calculateRiskScore, calculateSSLScore } from "../src/services/risk-score.service";
import { VirusTotalResult } from "../src/services/virustotal.service";
import { SafeBrowsingResult } from "../src/services/safe-browsing.service";
import { UrlhausResult } from "../src/services/threat-intelligence/urlhaus.service";

interface LocalModuleTest {
  id: number;
  name: string;
  run: () => Promise<{ passed: boolean; details: string }>;
}

const unavailableVT = (): VirusTotalResult => ({
  checked: false,
  available: false,
  malicious: false,
  suspicious: false,
  harmless: 0,
  maliciousCount: 0,
  suspiciousCount: 0,
  undetectedCount: 0,
  totalEngines: 0,
  error: "VirusTotal unavailable",
  status: "unavailable",
});

const unavailableSafeBrowsing = (): SafeBrowsingResult => ({
  checked: false,
  available: false,
  status: "UNAVAILABLE",
  threatDetected: false,
  threatTypes: [],
  score: null,
  provider: "GOOGLE_SAFE_BROWSING",
  reason: "Safe Browsing unavailable",
  checkedAt: new Date().toISOString(),
  error: "Service unavailable",
});

const unavailableUrlhaus = (): UrlhausResult => ({
  available: false,
  status: "UNAVAILABLE",
  match: false,
  provider: "URLHAUS",
  reason: "URLhaus unavailable",
  checkedAt: new Date().toISOString(),
  error: "Service unavailable",
});

const tests: LocalModuleTest[] = [
  // Test 1: https://example.com
  {
    id: 1,
    name: "Test 1: https://example.com (Valid HTTPS & clean local URL intelligence)",
    run: async () => {
      const url = "https://example.com";
      const intel = analyzeUrlIntelligence(url);
      const passedIntel = intel.status === "CHECKED" && intel.score === 0 && intel.level === "SAFE";

      // Also run SSL check (with network fallback check)
      const ssl = await analyzeSslUrl(url);
      // example.com has a valid DigiCert cert on 443
      const passedSsl = ssl.protocol === "HTTPS" && (ssl.status === "CHECKED" || ssl.status === "UNAVAILABLE");

      return {
        passed: passedIntel && passedSsl,
        details: `Intel: score=${intel.score}, level=${intel.level}; SSL: protocol=${ssl.protocol}, status=${ssl.status}, score=${ssl.score}`,
      };
    },
  },

  // Test 2: http://example.com (Expected SSL score: 40)
  {
    id: 2,
    name: "Test 2: http://example.com (Expected SSL score: 40, Plain HTTP without SSL)",
    run: async () => {
      const url = "http://example.com";
      const ssl = await analyzeSslUrl(url);
      const passed =
        ssl.status === "CHECKED" &&
        ssl.protocol === "HTTP" &&
        ssl.score === 40 &&
        ssl.level === "MODERATE" &&
        ssl.reason === "Website uses plain HTTP without SSL/TLS encryption.";

      return {
        passed,
        details: `SSL status=${ssl.status}, protocol=${ssl.protocol}, score=${ssl.score}, level=${ssl.level}, reason="${ssl.reason}"`,
      };
    },
  },

  // Test 3: http://192.0.2.1/login (Expected: IP address indicator)
  {
    id: 3,
    name: "Test 3: http://192.0.2.1/login (Expected: IP address indicator +25)",
    run: async () => {
      const url = "http://192.0.2.1/login";
      const intel = analyzeUrlIntelligence(url);
      const hasIpIndicator = intel.indicators.some(
        (ind) => ind.name === "Raw IP Address" && ind.score === 25
      );
      const hasKeyword = intel.indicators.some(
        (ind) => ind.name === "Suspicious Path/Query Keywords"
      );
      const passed = hasIpIndicator && intel.score >= 25;

      return {
        passed,
        details: `Indicators: [${intel.indicators.map((i) => `${i.name} (+${i.score})`).join(", ")}], TotalScore=${intel.score}`,
      };
    },
  },

  // Test 4: http://xn--paypa1-9za.example/login (Expected: Punycode indicator)
  {
    id: 4,
    name: "Test 4: http://xn--paypa1-9za.example/login (Expected: Punycode indicator +20)",
    run: async () => {
      const url = "http://xn--paypa1-9za.example/login";
      const intel = analyzeUrlIntelligence(url);
      const hasPunyIndicator = intel.indicators.some(
        (ind) => ind.name === "Punycode Encoding" && ind.score === 20
      );
      const passed = hasPunyIndicator && intel.score >= 20;

      return {
        passed,
        details: `Indicators: [${intel.indicators.map((i) => `${i.name} (+${i.score})`).join(", ")}], TotalScore=${intel.score}`,
      };
    },
  },

  // Test 5: very long URL (Expected: long URL indicator)
  {
    id: 5,
    name: "Test 5: very long URL (Expected: long URL indicator > 150 chars: +10, > 250 chars: +15)",
    run: async () => {
      const longUrl160 = `https://example.com/path?param=${"x".repeat(140)}`; // len ~165
      const longUrl280 = `https://example.com/path?param=${"x".repeat(260)}`; // len ~285

      const intel160 = analyzeUrlIntelligence(longUrl160);
      const intel280 = analyzeUrlIntelligence(longUrl280);

      const ind160 = intel160.indicators.find((i) => i.name === "Long URL" && i.score === 10);
      const ind280 = intel280.indicators.find((i) => i.name === "Excessive URL Length" && i.score === 15);

      const passed = !!ind160 && !!ind280;

      return {
        passed,
        details: `Len 165 indicator=${ind160?.name} (+${ind160?.score}); Len 285 indicator=${ind280?.name} (+${ind280?.score})`,
      };
    },
  },

  // Test 6: URL with excessive subdomains (Expected: subdomain indicator)
  {
    id: 6,
    name: "Test 6: URL with excessive subdomains (Expected: subdomain indicator +10 for >= 3 levels)",
    run: async () => {
      const url = "https://sub3.sub2.sub1.example.com/dashboard";
      const intel = analyzeUrlIntelligence(url);
      const subInd = intel.indicators.find((i) => i.name === "Excessive Subdomains" && i.score === 10);
      const passed = !!subInd;

      return {
        passed,
        details: `Indicators: [${intel.indicators.map((i) => `${i.name} (+${i.score})`).join(", ")}], Evidence=${JSON.stringify(intel.evidence)}`,
      };
    },
  },

  // Test 7: HTTPS certificate failure (Expected: not automatically SAFE)
  {
    id: 7,
    name: "Test 7: HTTPS certificate failure (Expired or hostname mismatch not automatically SAFE)",
    run: async () => {
      const expiredSsl: SslAnalysisOutput = {
        status: "CHECKED",
        protocol: "HTTPS",
        score: 60,
        level: "HIGH",
        certificate: {
          validTo: "2020-01-01T00:00:00.000Z",
          authorized: false,
        },
        reason: "SSL/TLS certificate expired on 2020-01-01T00:00:00.000Z.",
        checkedAt: new Date().toISOString(),
      };

      const mismatchSsl: SslAnalysisOutput = {
        status: "CHECKED",
        protocol: "HTTPS",
        score: 80,
        level: "HIGH",
        certificate: {
          authorized: false,
        },
        reason: "SSL/TLS certificate hostname mismatch.",
        checkedAt: new Date().toISOString(),
      };

      const factorExpired = calculateSSLScore(expiredSsl);
      const factorMismatch = calculateSSLScore(mismatchSsl);

      const passedExpired = factorExpired.score === 60 && factorExpired.status === "EXPIRED_CERTIFICATE" && factorExpired.impact === "HIGH";
      const passedMismatch = factorMismatch.score === 80 && factorMismatch.status === "HOSTNAME_MISMATCH" && factorMismatch.impact === "CRITICAL";

      return {
        passed: passedExpired && passedMismatch,
        details: `Expired score=${factorExpired.score} status=${factorExpired.status}; Mismatch score=${factorMismatch.score} status=${factorMismatch.status}`,
      };
    },
  },

  // Test 8: all external APIs unavailable (Expected: local analysis still works)
  {
    id: 8,
    name: "Test 8: all external APIs unavailable (Expected: local analysis still works, analysisStatus='LIMITED')",
    run: async () => {
      // Test with raw IP + plain HTTP
      const url = "http://192.0.2.1/login";
      const domain = "192.0.2.1";

      const localIntel = analyzeUrlIntelligence(url);
      const localSsl: SslAnalysisOutput = {
        status: "CHECKED",
        protocol: "HTTP",
        score: 40,
        level: "MODERATE",
        certificate: {},
        reason: "Website uses plain HTTP without SSL/TLS encryption.",
        checkedAt: new Date().toISOString(),
      };

      const res = calculateRiskScore({
        normalizedUrl: url,
        domain,
        sslAnalysis: localSsl,
        urlIntelligence: localIntel,
        safeBrowsing: unavailableSafeBrowsing(),
        virusTotal: unavailableVT(),
        urlhaus: unavailableUrlhaus(),
      });

      // Local URL Intel: raw IP (25) + login keyword combined (5) = 30.
      // Local SSL: 40.
      // Re-normalized available weights: URL Intel (0.15 / 0.25 = 60%), SSL (0.10 / 0.25 = 40%)
      // Weighted score = 30 * 0.60 + 40 * 0.40 = 18 + 16 = 34.
      // Structural floor: 34.
      // analysisStatus: "LIMITED"
      const passed =
        res.analysisStatus === "LIMITED" &&
        res.score !== null &&
        res.score > 0 &&
        res.level === "LOW" &&
        res.summary.includes("External threat intelligence services were unavailable") &&
        res.confidence < 60;

      return {
        passed,
        details: `Score=${res.score}, Level=${res.level}, Status=${res.analysisStatus}, Confidence=${res.confidence}%, Summary="${res.summary}"`,
      };
    },
  },

  // Test 9: all checks unavailable (Expected: INCONCLUSIVE)
  {
    id: 9,
    name: "Test 9: all checks unavailable (Expected: INCONCLUSIVE, riskScore=null, analysisStatus='INSUFFICIENT_DATA')",
    run: async () => {
      const url = "https://unreachable-host.example";
      const domain = "unreachable-host.example";

      const unavailIntel = {
        status: "ERROR" as const,
        score: 0,
        level: "SAFE" as const,
        indicators: [],
        reasons: ["URL Intelligence could not parse target"],
        evidence: {},
      };

      const unavailSsl: SslAnalysisOutput = {
        status: "UNAVAILABLE",
        protocol: "HTTPS",
        score: null,
        level: null,
        certificate: {},
        reason: "TLS connection timed out after 6000ms.",
        checkedAt: new Date().toISOString(),
      };

      const res = calculateRiskScore({
        normalizedUrl: url,
        domain,
        sslAnalysis: unavailSsl,
        urlIntelligence: unavailIntel,
        safeBrowsing: unavailableSafeBrowsing(),
        virusTotal: unavailableVT(),
        urlhaus: unavailableUrlhaus(),
      });

      const passed =
        res.score === null &&
        res.riskScore === null &&
        res.level === "INCONCLUSIVE" &&
        res.analysisStatus === "INSUFFICIENT_DATA" &&
        res.confidence === 0 &&
        res.summary.includes("Insufficient security signals were available");

      return {
        passed,
        details: `Score=${res.score}, Level=${res.level}, Status=${res.analysisStatus}, Confidence=${res.confidence}%, Summary="${res.summary}"`,
      };
    },
  },
];

async function main() {
  console.log("\n=======================================================");
  console.log("   LOCAL URL INTELLIGENCE & SSL/TLS TEST SUITE");
  console.log("=======================================================\n");

  let passedCount = 0;

  for (const t of tests) {
    try {
      const result = await t.run();
      if (result.passed) {
        console.log(`[PASS] Test ${t.id}: ${t.name}`);
        console.log(`       Details: ${result.details}\n`);
        passedCount++;
      } else {
        console.error(`[FAIL] Test ${t.id}: ${t.name}`);
        console.error(`       Details: ${result.details}\n`);
      }
    } catch (err: any) {
      console.error(`[ERROR] Test ${t.id}: ${t.name}`);
      console.error(`       Error: ${err?.message || err}\n`);
    }
  }

  console.log("-------------------------------------------------------");
  console.log(`Results: ${passedCount}/${tests.length} tests passed.`);
  console.log("=======================================================\n");

  if (passedCount < tests.length) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Test runner failed:", err);
  process.exit(1);
});
