// ============================================================================
// URLhaus Malware Intelligence Verification Suite (abuse.ch)
// Tests: CHECKED_NO_MATCH, MALWARE_URL_DETECTED, UNAVAILABLE, ERROR
// ============================================================================

import { checkUrlWithUrlhaus, UrlhausResult } from "../src/services/threat-intelligence/urlhaus.service";
import { calculateUrlhausScore } from "../src/services/risk-score.service";

interface TestCase {
  id: number;
  name: string;
  run: () => Promise<{ passed: boolean; details: string }>;
}

const tests: TestCase[] = [
  // 1. Missing Auth-Key -> UNAVAILABLE
  {
    id: 1,
    name: "Missing Auth-Key -> UNAVAILABLE status, available: false",
    run: async () => {
      const res = await checkUrlWithUrlhaus("https://example.com", { authKey: "" });
      const passed = res.available === false && res.status === "UNAVAILABLE" && res.match === false;
      return {
        passed,
        details: `available=${res.available}, status=${res.status}, reason=${res.reason}`,
      };
    },
  },

  // 2. Successful clean check (no_results) -> CHECKED_NO_MATCH, score 0
  {
    id: 2,
    name: "Clean Check (query_status: no_results) -> CHECKED_NO_MATCH, score 0",
    run: async () => {
      const originalFetch = global.fetch;
      global.fetch = async () =>
        new Response(JSON.stringify({ query_status: "no_results" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });

      try {
        const res = await checkUrlWithUrlhaus("https://example.com", { authKey: "fake-auth-key" });
        const factor = calculateUrlhausScore(res);
        const passed =
          res.available === true &&
          res.status === "CHECKED_NO_MATCH" &&
          res.match === false &&
          factor.score === 0;

        return {
          passed,
          details: `status=${res.status}, match=${res.match}, factorScore=${factor.score}`,
        };
      } finally {
        global.fetch = originalFetch;
      }
    },
  },

  // 3. Known Malware URL detected (query_status: ok) -> MALWARE_URL_DETECTED, score 100
  {
    id: 3,
    name: "Malware URL Detected (query_status: ok) -> MALWARE_URL_DETECTED, score 100",
    run: async () => {
      const originalFetch = global.fetch;
      global.fetch = async () =>
        new Response(
          JSON.stringify({
            query_status: "ok",
            id: "123456",
            urlhaus_reference: "https://urlhaus.abuse.ch/url/123456/",
            url_status: "online",
            threat: "malware_download",
            tags: ["elf", "mozi"],
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );

      try {
        const res = await checkUrlWithUrlhaus("http://malware-sample.net/bin", { authKey: "fake-auth-key" });
        const factor = calculateUrlhausScore(res);
        const passed =
          res.available === true &&
          res.status === "MALWARE_URL_DETECTED" &&
          res.match === true &&
          factor.score === 100 &&
          factor.impact === "CRITICAL";

        return {
          passed,
          details: `status=${res.status}, threat=${res.threatType}, tags=${res.tags?.join(",")}, score=${factor.score}`,
        };
      } finally {
        global.fetch = originalFetch;
      }
    },
  },

  // 4. HTTP 401 Unauthorized -> ERROR status, score null
  {
    id: 4,
    name: "HTTP 401 Unauthorized -> ERROR status, available: false, score: null",
    run: async () => {
      const originalFetch = global.fetch;
      global.fetch = async () =>
        new Response(JSON.stringify({ query_status: "unauthorized" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        });

      try {
        const res = await checkUrlWithUrlhaus("https://example.com", { authKey: "invalid-key" });
        const factor = calculateUrlhausScore(res);
        const passed = res.available === false && res.status === "ERROR" && factor.score === null;
        return {
          passed,
          details: `status=${res.status}, score=${factor.score}, error=${res.error}`,
        };
      } finally {
        global.fetch = originalFetch;
      }
    },
  },

  // 5. Timeout handling -> UNAVAILABLE status, available: false
  {
    id: 5,
    name: "Request Timeout -> UNAVAILABLE status, available: false",
    run: async () => {
      const res = await checkUrlWithUrlhaus("https://example.com", {
        authKey: "fake-auth-key",
        timeoutMs: 1, // immediate timeout
      });
      const passed = res.available === false && res.status === "UNAVAILABLE";
      return {
        passed,
        details: `status=${res.status}, error=${res.error}`,
      };
    },
  },

  // 6. Malformed JSON handling -> ERROR status
  {
    id: 6,
    name: "Malformed payload -> ERROR status resilience",
    run: async () => {
      const originalFetch = global.fetch;
      global.fetch = async () =>
        new Response(JSON.stringify({ query_status: "invalid_url" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });

      try {
        const res = await checkUrlWithUrlhaus("https://bad-request", { authKey: "fake-key" });
        const factor = calculateUrlhausScore(res);
        const passed = res.available === false && res.status === "ERROR" && factor.score === null;
        return {
          passed,
          details: `status=${res.status}, score=${factor.score}`,
        };
      } finally {
        global.fetch = originalFetch;
      }
    },
  },
];

async function main() {
  console.log("\n=======================================================");
  console.log("   URLHAUS MALWARE INTELLIGENCE VERIFICATION SUITE");
  console.log("=======================================================\n");

  let passCount = 0;
  for (const t of tests) {
    try {
      const result = await t.run();
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
