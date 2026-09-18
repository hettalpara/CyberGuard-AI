// ============================================================================
// Deterministic Risk Engine V2 Comprehensive Test Suite
// Verifies all threat intelligence integrations, weight normalizations,
// critical overrides, structural risk floors, thresholds, and 100/100 fixture.
// Standardized on Google Safe Browsing API (v4 ThreatMatches).
// ============================================================================

import {
  calculateRiskScore,
  getRiskLevel,
  RiskFactor,
} from "../src/services/risk-score.service";
import { SslAnalysisResult } from "../src/services/ssl.service";
import { VirusTotalResult } from "../src/services/virustotal.service";
import { SafeBrowsingResult } from "../src/services/safe-browsing.service";
import { UrlhausResult } from "../src/services/threat-intelligence/urlhaus.service";

interface EngineTest {
  id: number;
  name: string;
  run: () => { passed: boolean; score: number | null; level: string; details: string };
}

// Helpers for test inputs
const cleanSsl = (): SslAnalysisResult => ({
  enabled: true,
  valid: true,
  status: "valid",
  issuer: "DigiCert",
  validDaysRemaining: 180,
});

const httpSsl = (): SslAnalysisResult => ({
  enabled: false,
  valid: false,
  status: "unavailable",
});

const cleanSafeBrowsing = (): SafeBrowsingResult => ({
  checked: true,
  available: true,
  status: "CHECKED_NO_THREAT",
  threatDetected: false,
  threatTypes: [],
  score: 0,
  provider: "GOOGLE_SAFE_BROWSING",
  reason: "Clean",
  checkedAt: new Date().toISOString(),
});

const malwareSafeBrowsing = (): SafeBrowsingResult => ({
  checked: true,
  available: true,
  status: "THREAT_DETECTED",
  threatDetected: true,
  threatTypes: ["MALWARE"],
  score: 100,
  provider: "GOOGLE_SAFE_BROWSING",
  reason: "Malware confirmed",
  checkedAt: new Date().toISOString(),
});

const phishSafeBrowsing = (): SafeBrowsingResult => ({
  checked: true,
  available: true,
  status: "THREAT_DETECTED",
  threatDetected: true,
  threatTypes: ["SOCIAL_ENGINEERING"],
  score: 90,
  provider: "GOOGLE_SAFE_BROWSING",
  reason: "Social engineering confirmed",
  checkedAt: new Date().toISOString(),
});

const unavailSafeBrowsing = (): SafeBrowsingResult => ({
  checked: false,
  available: false,
  status: "UNAVAILABLE",
  threatDetected: false,
  threatTypes: [],
  score: null,
  provider: "GOOGLE_SAFE_BROWSING",
  reason: "Unavailable",
  checkedAt: new Date().toISOString(),
});

const cleanUrlhaus = (): UrlhausResult => ({
  available: true,
  status: "CHECKED_NO_MATCH",
  match: false,
  provider: "URLHAUS",
  reason: "No match",
  checkedAt: new Date().toISOString(),
});

const malwareUrlhaus = (): UrlhausResult => ({
  available: true,
  status: "MALWARE_URL_DETECTED",
  match: true,
  threatType: "malware_download",
  tags: ["exe", "redline"],
  provider: "URLHAUS",
  reason: "Active malware distributor",
  checkedAt: new Date().toISOString(),
});

const unavailUrlhaus = (): UrlhausResult => ({
  available: false,
  status: "UNAVAILABLE",
  match: false,
  provider: "URLHAUS",
  reason: "URLhaus service unreachable",
  checkedAt: new Date().toISOString(),
});

const cleanVT = (): VirusTotalResult => ({
  checked: true,
  available: true,
  malicious: false,
  suspicious: false,
  harmless: 70,
  maliciousCount: 0,
  suspiciousCount: 0,
  undetectedCount: 0,
  totalEngines: 70,
  detectionRatio: "0 / 70",
});

const unavailVT = (): VirusTotalResult => ({
  checked: false,
  available: false,
  malicious: false,
  suspicious: false,
  harmless: 0,
  maliciousCount: 0,
  suspiciousCount: 0,
  undetectedCount: 0,
  totalEngines: 0,
  detectionRatio: "0 / 0",
  status: "unavailable",
});

const tests: EngineTest[] = [
  // 1. All Clean Providers -> 0 SAFE
  {
    id: 1,
    name: "All Clean Providers -> 0 SAFE",
    run: () => {
      const res = calculateRiskScore({
        normalizedUrl: "https://example.com/",
        domain: "example.com",
        ssl: cleanSsl(),
        safeBrowsing: cleanSafeBrowsing(),
        virusTotal: cleanVT(),
        urlhaus: cleanUrlhaus(),
      });
      const passed = res.score === 0 && res.level === "SAFE";
      return { passed, score: res.score, level: res.level, details: `Score=${res.score}, Level=${res.level}` };
    },
  },

  // 2. Google Safe Browsing MALWARE -> >= 80 CRITICAL
  {
    id: 2,
    name: "Safe Browsing MALWARE threat -> >= 80 CRITICAL override",
    run: () => {
      const res = calculateRiskScore({
        normalizedUrl: "https://example.com/",
        domain: "example.com",
        ssl: cleanSsl(),
        safeBrowsing: malwareSafeBrowsing(),
        virusTotal: cleanVT(),
        urlhaus: cleanUrlhaus(),
      });
      const passed = res.score !== null && res.score >= 80 && res.level === "CRITICAL";
      return { passed, score: res.score, level: res.level, details: `Score=${res.score}, Level=${res.level}` };
    },
  },

  // 3. Google Safe Browsing SOCIAL_ENGINEERING -> >= 75 HIGH
  {
    id: 3,
    name: "Safe Browsing SOCIAL_ENGINEERING threat -> >= 75 HIGH override",
    run: () => {
      const res = calculateRiskScore({
        normalizedUrl: "https://example.com/",
        domain: "example.com",
        ssl: cleanSsl(),
        safeBrowsing: phishSafeBrowsing(),
        virusTotal: cleanVT(),
        urlhaus: cleanUrlhaus(),
      });
      const passed = res.score !== null && res.score >= 75 && (res.level === "HIGH" || res.level === "CRITICAL");
      return { passed, score: res.score, level: res.level, details: `Score=${res.score}, Level=${res.level}` };
    },
  },

  // 4. URLhaus MALWARE_URL_DETECTED -> >= 80 CRITICAL
  {
    id: 4,
    name: "URLhaus MALWARE_URL_DETECTED -> >= 80 CRITICAL override",
    run: () => {
      const res = calculateRiskScore({
        normalizedUrl: "https://example.com/",
        domain: "example.com",
        ssl: cleanSsl(),
        safeBrowsing: cleanSafeBrowsing(),
        virusTotal: cleanVT(),
        urlhaus: malwareUrlhaus(),
      });
      const passed = res.score !== null && res.score >= 80 && res.level === "CRITICAL";
      return { passed, score: res.score, level: res.level, details: `Score=${res.score}, Level=${res.level}` };
    },
  },

  // 5. VirusTotal High Malicious Ratio -> >= 75 HIGH
  {
    id: 5,
    name: "VirusTotal High Malicious Count (15/70) -> >= 75 HIGH override",
    run: () => {
      const res = calculateRiskScore({
        normalizedUrl: "https://example.com/",
        domain: "example.com",
        ssl: cleanSsl(),
        safeBrowsing: cleanSafeBrowsing(),
        virusTotal: {
          checked: true,
          available: true,
          malicious: true,
          suspicious: false,
          harmless: 55,
          maliciousCount: 15,
          suspiciousCount: 0,
          undetectedCount: 0,
          totalEngines: 70,
          detectionRatio: "15 / 70",
        },
        urlhaus: cleanUrlhaus(),
      });
      const passed = res.score !== null && res.score >= 75 && (res.level === "HIGH" || res.level === "CRITICAL");
      return { passed, score: res.score, level: res.level, details: `Score=${res.score}, Level=${res.level}` };
    },
  },

  // 6. Multiple Threat Detections (Safe Browsing + URLhaus + VT) -> 85-100 CRITICAL
  {
    id: 6,
    name: "Multiple Threat Intelligence Detections -> 85-100 CRITICAL",
    run: () => {
      const res = calculateRiskScore({
        normalizedUrl: "https://example.com/",
        domain: "example.com",
        ssl: cleanSsl(),
        safeBrowsing: malwareSafeBrowsing(),
        virusTotal: {
          checked: true,
          available: true,
          malicious: true,
          suspicious: false,
          harmless: 50,
          maliciousCount: 20,
          suspiciousCount: 0,
          undetectedCount: 0,
          totalEngines: 70,
          detectionRatio: "20 / 70",
        },
        urlhaus: malwareUrlhaus(),
      });
      const passed = res.score !== null && res.score >= 85 && res.level === "CRITICAL";
      return { passed, score: res.score, level: res.level, details: `Score=${res.score}, Level=${res.level}` };
    },
  },

  // 7. Unavailable Safe Browsing -> Renormalize among VT, URLhaus, URL Intel, SSL
  {
    id: 7,
    name: "Unavailable Safe Browsing -> Excluded from weights, renormalized",
    run: () => {
      const res = calculateRiskScore({
        normalizedUrl: "https://example.com/",
        domain: "example.com",
        ssl: cleanSsl(),
        safeBrowsing: unavailSafeBrowsing(),
        virusTotal: cleanVT(),
        urlhaus: malwareUrlhaus(), // 100
      });
      const sbFactor = res.factors.find((f) => f.name === "Google Safe Browsing");
      const passed = sbFactor?.available === false && sbFactor?.contribution === 0 && res.score !== null && res.score >= 80;
      return { passed, score: res.score, level: res.level, details: `SB contribution=${sbFactor?.contribution}, Final score=${res.score}` };
    },
  },

  // 8. Unavailable URLhaus -> Excluded from weights
  {
    id: 8,
    name: "Unavailable URLhaus -> Excluded from weights, renormalized",
    run: () => {
      const res = calculateRiskScore({
        normalizedUrl: "https://example.com/",
        domain: "example.com",
        ssl: cleanSsl(),
        safeBrowsing: malwareSafeBrowsing(),
        virusTotal: cleanVT(),
        urlhaus: unavailUrlhaus(),
      });
      const uhFactor = res.factors.find((f) => f.name === "URLhaus Malware Reputation");
      const passed = uhFactor?.available === false && uhFactor?.contribution === 0 && res.score !== null && res.score >= 80;
      return { passed, score: res.score, level: res.level, details: `UH contribution=${uhFactor?.contribution}, Final score=${res.score}` };
    },
  },

  // 9. Unavailable VirusTotal -> Excluded from weights
  {
    id: 9,
    name: "Unavailable VirusTotal -> Excluded from weights, renormalized",
    run: () => {
      const res = calculateRiskScore({
        normalizedUrl: "https://example.com/",
        domain: "example.com",
        ssl: cleanSsl(),
        safeBrowsing: cleanSafeBrowsing(),
        virusTotal: unavailVT(),
        urlhaus: cleanUrlhaus(),
      });
      const vtFactor = res.factors.find((f) => f.name === "VirusTotal");
      const passed = vtFactor?.available === false && vtFactor?.contribution === 0 && res.score === 0;
      return { passed, score: res.score, level: res.level, details: `VT contribution=${vtFactor?.contribution}, Final score=${res.score}` };
    },
  },

  // 10. Raw IP + HTTP (User Audit Case: http://192.0.2.1/login/verify) -> LOW (20-39)
  {
    id: 10,
    name: "Raw IP + Plain HTTP + Login Path -> LOW (20-39), structural floor active",
    run: () => {
      const res = calculateRiskScore({
        normalizedUrl: "http://192.0.2.1/login/verify",
        domain: "192.0.2.1",
        ssl: httpSsl(),
        safeBrowsing: cleanSafeBrowsing(),
        virusTotal: unavailVT(),
        urlhaus: cleanUrlhaus(),
      });
      // Raw IP (25) + Login/verify keyword (10) = 35. SSL = 40.
      // Structural floor prevents misleading ~14.7 SAFE classification
      const passed = res.score !== null && res.score >= 20 && res.score <= 39 && res.level === "LOW";
      return { passed, score: res.score, level: res.level, details: `Score=${res.score}, Level=${res.level}` };
    },
  },

  // 11. Punycode + HTTP (http://xn--paypa1-9za.example/login) -> LOW (20-45)
  {
    id: 11,
    name: "Punycode + HTTP (http://xn--paypa1-9za.example/login) -> 20-45",
    run: () => {
      const res = calculateRiskScore({
        normalizedUrl: "http://xn--paypa1-9za.example/login",
        domain: "xn--paypa1-9za.example",
        ssl: httpSsl(),
        safeBrowsing: cleanSafeBrowsing(),
        virusTotal: unavailVT(),
        urlhaus: cleanUrlhaus(),
      });
      const passed = res.score !== null && res.score >= 20 && res.score <= 45;
      return { passed, score: res.score, level: res.level, details: `Score=${res.score}, Level=${res.level}` };
    },
  },

  // 12. Normal Plain HTTP (http://example.com) -> SAFE (<= 19)
  {
    id: 12,
    name: "Normal Plain HTTP (http://example.com) -> SAFE (<= 19)",
    run: () => {
      const res = calculateRiskScore({
        normalizedUrl: "http://example.com/",
        domain: "example.com",
        ssl: httpSsl(),
        safeBrowsing: cleanSafeBrowsing(),
        virusTotal: cleanVT(),
        urlhaus: cleanUrlhaus(),
      });
      const passed = res.score !== null && res.score <= 19 && res.level === "SAFE";
      return { passed, score: res.score, level: res.level, details: `Score=${res.score}, Level=${res.level}` };
    },
  },

  // 13. PHASE 20 — 100/100 DETERMINISTIC FIXTURE TEST
  // Safe Browsing = 100, VirusTotal = 100, URLhaus = 100, URL Intelligence = 100, SSL/TLS = 100
  // Existing risk engine must calculate exactly 100/100 CRITICAL without hardcoding
  {
    id: 13,
    name: "Phase 20 Fixture: All 5 Factors = 100 -> Engine calculates 100/100 CRITICAL",
    run: () => {
      // Construct input that yields 100 for each factor:
      // Safe Browsing: MALWARE -> 100
      // URLhaus: match -> 100
      // VirusTotal: 25/70 -> 100
      // URL Intel: raw IP (25) + punycode (25) + excessive length (15) + 3 keywords (20) + @ symbol (20) = 105 -> capped 100
      // SSL: expired (60) + invalid (70) -> capped 100
      const domain = "192.0.2.1";
      const syntheticUrl = `http://192.0.2.1/verify/login/banking/account/update/confirm/wallet?email=admin@target.com&tags=test-one-two-three&padding=${"a".repeat(200)}`;

      const res = calculateRiskScore({
        normalizedUrl: syntheticUrl,
        domain,
        ssl: {
          enabled: true,
          valid: false,
          status: "invalid",
          validDaysRemaining: -10,
        },
        urlIntelligence: {
          status: "CHECKED",
          score: 100,
          level: "CRITICAL",
          indicators: [
            { name: "Synthetic Fixture", score: 100, reason: "Phase 20 test fixture" },
          ],
          reasons: ["Synthetic Fixture: Phase 20 test fixture"],
          evidence: {},
        },
        safeBrowsing: malwareSafeBrowsing(),
        virusTotal: {
          checked: true,
          available: true,
          malicious: true,
          suspicious: false,
          harmless: 45,
          maliciousCount: 25,
          suspiciousCount: 0,
          undetectedCount: 0,
          totalEngines: 70,
          detectionRatio: "25 / 70",
        },
        urlhaus: malwareUrlhaus(),
      });

      const passed = res.score === 100 && res.level === "CRITICAL";
      return {
        passed,
        score: res.score,
        level: res.level,
        details: `Calculated Score=${res.score}/100, Level=${res.level}`,
      };
    },
  },

  // 14. Additive Property Verification: sum of factor contributions == final score
  {
    id: 14,
    name: "Mathematical Additivity: sum of displayed contributions equals final score",
    run: () => {
      const res = calculateRiskScore({
        normalizedUrl: "http://192.0.2.1/login/verify",
        domain: "192.0.2.1",
        ssl: httpSsl(),
        safeBrowsing: cleanSafeBrowsing(),
        virusTotal: unavailVT(),
        urlhaus: cleanUrlhaus(),
      });

      const sumContrib = res.factors.reduce((sum, f) => sum + f.contribution, 0);
      const diff = Math.abs(sumContrib - (res.score ?? 0));
      const passed = res.score !== null && diff <= 0.1; // allows only normal rounding
      return {
        passed,
        score: res.score,
        level: res.level,
        details: `Sum(contributions)=${sumContrib.toFixed(2)}, FinalScore=${res.score}, Diff=${diff.toFixed(4)}`,
      };
    },
  },
];

async function main() {
  console.log("\n=======================================================");
  console.log("   DETERMINISTIC RISK ENGINE V2 VERIFICATION SUITE");
  console.log("=======================================================\n");

  let passCount = 0;
  for (const t of tests) {
    try {
      const result = t.run();
      if (result.passed) {
        passCount++;
        console.log(`[PASS] Test ${t.id}: ${t.name}`);
        console.log(`       Details: ${result.details}\n`);
      } else {
        console.log(`[FAIL] Test ${t.id}: ${t.name}`);
        console.log(`       Details: ${result.details}\n`);
      }
    } catch (err: any) {
      console.log(`[ERROR] Test ${t.id}: ${t.name}`);
      console.log(`       Exception: ${err.message}\n`);
    }
  }

  console.log("-------------------------------------------------------");
  console.log(`Results: ${passCount}/${tests.length} tests passed.`);
  console.log("=======================================================\n");

  if (passCount !== tests.length) {
    process.exit(1);
  }
}

main();
