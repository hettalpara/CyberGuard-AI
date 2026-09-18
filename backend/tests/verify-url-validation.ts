import { validateAndNormalizeUrl } from "../src/utils/url.util";

interface TestCase {
  url: string;
  expectedValid: boolean;
  expectedNormalized?: string;
  expectedDomain?: string;
  expectedErrorContains?: string;
}

const testCases: TestCase[] = [
  // --- Valid URLs ---
  {
    url: "https://example.com",
    expectedValid: true,
    expectedNormalized: "https://example.com",
    expectedDomain: "example.com",
  },
  {
    url: "http://example.com",
    expectedValid: true,
    expectedNormalized: "http://example.com",
    expectedDomain: "example.com",
  },
  {
    url: "http://a.b.c.example.com/login",
    expectedValid: true,
    expectedNormalized: "http://a.b.c.example.com/login",
    expectedDomain: "a.b.c.example.com",
  },
  {
    url: "http://xn--paypa1-9za.example/login",
    expectedValid: true,
    expectedNormalized: "http://xn--paypa1-9za.example/login",
    expectedDomain: "xn--paypa1-9za.example",
  },

  // --- Rejected URLs ---
  {
    url: "javascript:alert(1)",
    expectedValid: false,
    expectedErrorContains: "Disallowed URL scheme",
  },
  {
    url: "data:text/html,test",
    expectedValid: false,
    expectedErrorContains: "Disallowed URL scheme",
  },
  {
    url: "malformed://",
    expectedValid: false,
    expectedErrorContains: "Only HTTP and HTTPS protocols are supported",
  },
  {
    url: "http://",
    expectedValid: false,
    expectedErrorContains: "Invalid or malformed URL structure",
  },
  {
    url: "https://",
    expectedValid: false,
    expectedErrorContains: "Invalid or malformed URL structure",
  },

  // --- Additional Security Guards ---
  {
    url: "http://127.0.0.1/admin",
    expectedValid: false,
    expectedErrorContains: "Access to private or local network addresses is prohibited",
  },
  {
    url: "http://localhost:5000",
    expectedValid: false,
    expectedErrorContains: "Access to private or local network addresses is prohibited",
  },
];

console.log("==================================================");
console.log("CYBERGUARD AI — URL VALIDATION TEST SUITE");
console.log("==================================================\n");

let passedCount = 0;
let failedCount = 0;

for (let i = 0; i < testCases.length; i++) {
  const tc = testCases[i];
  const result = validateAndNormalizeUrl(tc.url);

  let passed = true;
  let reason = "";

  if (result.isValid !== tc.expectedValid) {
    passed = false;
    reason += `isValid mismatch: got ${result.isValid}, expected ${tc.expectedValid}. `;
  }

  if (tc.expectedValid) {
    if (tc.expectedNormalized && result.normalizedUrl !== tc.expectedNormalized) {
      passed = false;
      reason += `normalizedUrl mismatch: got "${result.normalizedUrl}", expected "${tc.expectedNormalized}". `;
    }
    if (tc.expectedDomain && result.domain !== tc.expectedDomain) {
      passed = false;
      reason += `domain mismatch: got "${result.domain}", expected "${tc.expectedDomain}". `;
    }
  } else {
    if (tc.expectedErrorContains && (!result.error || !result.error.includes(tc.expectedErrorContains))) {
      passed = false;
      reason += `error mismatch: got "${result.error}", expected to contain "${tc.expectedErrorContains}". `;
    }
  }

  const statusSymbol = passed ? "✅ PASS" : "❌ FAIL";
  console.log(`${statusSymbol} [${i + 1}] "${tc.url}"`);
  if (!passed) {
    console.log(`       Failure: ${reason}`);
    failedCount++;
  } else {
    if (result.isValid) {
      console.log(`       Normalized: ${result.normalizedUrl} (Domain: ${result.domain})`);
    } else {
      console.log(`       Rejected as expected: "${result.error}"`);
    }
    passedCount++;
  }
}

console.log("\n==================================================");
console.log(`TOTAL TESTS: ${testCases.length} | PASSED: ${passedCount} | FAILED: ${failedCount}`);
console.log(`OVERALL STATUS: ${failedCount === 0 ? "ALL TESTS PASSED! 🚀" : "SOME TESTS FAILED ❌"}`);
console.log("==================================================\n");

if (failedCount > 0) {
  process.exit(1);
}
