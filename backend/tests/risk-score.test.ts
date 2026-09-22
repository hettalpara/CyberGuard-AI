import { describe, it, expect } from "vitest";
import {
  calculateRiskScore,
  getRiskLevel,
  FACTOR_WEIGHTS,
  checkShortCircuitOverrides,
  calculateWeightedRisk,
} from "../src/services/risk-score.service";
import { SslAnalysisResult } from "../src/services/ssl.service";
import { VirusTotalResult } from "../src/services/virustotal.service";
import { SafeBrowsingResult } from "../src/services/safe-browsing.service";
import { UrlhausResult } from "../src/services/threat-intelligence/urlhaus.service";

describe("Evidence-Based Risk Scoring Engine", () => {
  // Standard clean mocks
  const cleanSsl: SslAnalysisResult = {
    enabled: true,
    valid: true,
    status: "valid",
    issuer: "DigiCert Global Root G2",
    validDaysRemaining: 240,
  };

  const cleanSafeBrowsing: SafeBrowsingResult = {
    checked: true,
    available: true,
    status: "CHECKED_NO_THREAT",
    threatDetected: false,
    threatTypes: [],
    score: 0,
    provider: "GOOGLE_SAFE_BROWSING",
    reason: "No threats detected by Google Safe Browsing",
    checkedAt: new Date().toISOString(),
  };

  const cleanVT: VirusTotalResult = {
    checked: true,
    available: true,
    malicious: false,
    suspicious: false,
    harmless: 70,
    maliciousCount: 0,
    suspiciousCount: 0,
    undetectedCount: 2,
    totalEngines: 72,
    detectionRatio: "0/72",
    enginesFlagged: 0,
    permalink: null,
    status: "clean",
  };

  const cleanUrlhaus: UrlhausResult = {
    available: true,
    status: "CHECKED_NO_MATCH",
    match: false,
    provider: "URLHAUS",
    reason: "No active malware distribution detected by URLhaus",
    checkedAt: new Date().toISOString(),
  };

  // 1. Completely clean URL
  it("1. Completely clean URL: calculates SAFE baseline (0-19) with high confidence and no threat findings", () => {
    const result = calculateRiskScore({
      normalizedUrl: "https://example.com",
      domain: "example.com",
      ssl: cleanSsl,
      safeBrowsing: cleanSafeBrowsing,
      virusTotal: cleanVT,
      urlhaus: cleanUrlhaus,
    });

    expect(result.score).toBeLessThanOrEqual(19);
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.level).toBe("SAFE");
    expect(result.confidence).toBeGreaterThanOrEqual(80);
    expect(result.findings.some((f) => f.isConfirmedThreat)).toBe(false);
  });

  // 2. Slightly suspicious URL
  it("2. Slightly suspicious URL: computes LOW risk (20-39) for minor structural anomalies like long URL and unencrypted HTTP", () => {
    const longUrl = "http://example.com/" + "path/".repeat(20);
    const result = calculateRiskScore({
      normalizedUrl: longUrl,
      domain: "example.com",
      ssl: { enabled: false, valid: false, status: "unavailable" },
      safeBrowsing: cleanSafeBrowsing,
      virusTotal: cleanVT,
      urlhaus: cleanUrlhaus,
    });

    expect(result.score).toBeGreaterThanOrEqual(20);
    expect(result.score).toBeLessThanOrEqual(39);
    expect(result.level).toBe("LOW");
  });

  // 3. Highly suspicious URL
  it("3. Highly suspicious URL: computes MODERATE or HIGH risk for numeric IP destination with sensitive path", () => {
    const result = calculateRiskScore({
      normalizedUrl: "http://192.0.2.1/login/banking/verify",
      domain: "192.0.2.1",
      ssl: { enabled: false, valid: false, status: "unavailable" },
      safeBrowsing: cleanSafeBrowsing,
      virusTotal: cleanVT,
      urlhaus: cleanUrlhaus,
    });

    expect(result.score).toBeGreaterThanOrEqual(40);
    expect(result.level === "MODERATE" || result.level === "HIGH").toBe(true);
    expect(result.findings.some((f) => f.finding.includes("RAW_IP"))).toBe(true);
  });

  // 4. Confirmed phishing
  it("4. Confirmed phishing: triggers CRITICAL (80+) when Google Safe Browsing confirms phishing", () => {
    const phishingSB: SafeBrowsingResult = {
      ...cleanSafeBrowsing,
      status: "THREAT_DETECTED",
      threatDetected: true,
      threatTypes: ["SOCIAL_ENGINEERING"],
      score: 90,
      reason: "Google Safe Browsing identified this URL as a phishing / social engineering threat.",
    };

    const result = calculateRiskScore({
      normalizedUrl: "https://secure-login-apple.com/verify",
      domain: "secure-login-apple.com",
      ssl: cleanSsl,
      safeBrowsing: phishingSB,
      virusTotal: cleanVT,
      urlhaus: cleanUrlhaus,
    });

    expect(result.score).toBeGreaterThanOrEqual(80);
    expect(result.level).toBe("CRITICAL");
    expect(result.findings.some((f) => f.finding === "CONFIRMED_PHISHING")).toBe(true);
  });

  // 5. Confirmed malware
  it("5. Confirmed malware: triggers CRITICAL (80+) when Google Safe Browsing confirms malware distribution", () => {
    const malwareSB: SafeBrowsingResult = {
      ...cleanSafeBrowsing,
      status: "THREAT_DETECTED",
      threatDetected: true,
      threatTypes: ["MALWARE"],
      score: 100,
      reason: "Google Safe Browsing identified this URL as malware.",
    };

    const result = calculateRiskScore({
      normalizedUrl: "https://trojan-payload.biz/installer.exe",
      domain: "trojan-payload.biz",
      ssl: cleanSsl,
      safeBrowsing: malwareSB,
      virusTotal: cleanVT,
      urlhaus: cleanUrlhaus,
    });

    expect(result.score).toBeGreaterThanOrEqual(80);
    expect(result.level).toBe("CRITICAL");
    expect(result.findings.some((f) => f.finding === "CONFIRMED_MALWARE")).toBe(true);
  });

  // 6. URLhaus malicious match
  it("6. URLhaus malicious match: triggers CRITICAL (80+) when active malware payload is verified in URLhaus", () => {
    const malwareUrlhaus: UrlhausResult = {
      available: true,
      status: "MALWARE_URL_DETECTED",
      match: true,
      threatType: "malware_download",
      tags: ["Mozi", "elf"],
      provider: "URLHAUS",
      reason: "Active malware payload verified on URLhaus",
      checkedAt: new Date().toISOString(),
    };

    const result = calculateRiskScore({
      normalizedUrl: "http://malware-source.biz/bin",
      domain: "malware-source.biz",
      ssl: { enabled: false, valid: false, status: "unavailable" },
      safeBrowsing: cleanSafeBrowsing,
      virusTotal: cleanVT,
      urlhaus: malwareUrlhaus,
    });

    expect(result.score).toBeGreaterThanOrEqual(80);
    expect(result.level).toBe("CRITICAL");
    expect(result.findings.some((f) => f.finding === "ACTIVE_MALWARE_PAYLOAD")).toBe(true);
  });

  // 7. Multiple VirusTotal detections
  it("7. Multiple VirusTotal detections: identifies broad vendor consensus with high risk floor", () => {
    const maliciousVT: VirusTotalResult = {
      ...cleanVT,
      malicious: true,
      maliciousCount: 14,
      suspiciousCount: 3,
      totalEngines: 72,
      detectionRatio: "14/72",
      status: "threat_found",
    };

    const result = calculateRiskScore({
      normalizedUrl: "https://suspicious-download.net/payload.exe",
      domain: "suspicious-download.net",
      ssl: cleanSsl,
      safeBrowsing: cleanSafeBrowsing,
      virusTotal: maliciousVT,
      urlhaus: cleanUrlhaus,
    });

    expect(result.score).toBeGreaterThanOrEqual(80);
    expect(result.level).toBe("CRITICAL");
    expect(result.findings.some((f) => f.source === "VirusTotal" && f.severity === "CRITICAL")).toBe(true);
  });

  // 8. Multiple independent malicious sources
  it("8. Multiple independent malicious sources: escalates to 95+ when 3 independent threat feeds concur", () => {
    const phishingSB: SafeBrowsingResult = {
      ...cleanSafeBrowsing,
      status: "THREAT_DETECTED",
      threatDetected: true,
      threatTypes: ["SOCIAL_ENGINEERING"],
      score: 90,
      reason: "Safe Browsing phishing match",
    };

    const maliciousUrlhaus: UrlhausResult = {
      available: true,
      status: "MALWARE_URL_DETECTED",
      match: true,
      threatType: "malware_download",
      provider: "URLHAUS",
      reason: "URLhaus malware match",
      checkedAt: new Date().toISOString(),
    };

    const maliciousVT: VirusTotalResult = {
      ...cleanVT,
      malicious: true,
      maliciousCount: 22,
      totalEngines: 72,
      detectionRatio: "22/72",
      status: "threat_found",
    };

    const result = calculateRiskScore({
      normalizedUrl: "https://verified-multi-threat.com/attack",
      domain: "verified-multi-threat.com",
      ssl: cleanSsl,
      safeBrowsing: phishingSB,
      virusTotal: maliciousVT,
      urlhaus: maliciousUrlhaus,
    });

    expect(result.score).toBeGreaterThanOrEqual(95);
    expect(result.level).toBe("CRITICAL");
  });

  // 9. SSL issue only
  it("9. SSL issue only: produces MODERATE risk (40-59) without falsely classifying clean site as critical malware", () => {
    const expiredSsl: SslAnalysisResult = {
      enabled: true,
      valid: false,
      status: "expired",
      issuer: "Let's Encrypt",
      validDaysRemaining: -15,
    };

    const result = calculateRiskScore({
      normalizedUrl: "https://expired-personal-blog.org",
      domain: "expired-personal-blog.org",
      ssl: expiredSsl,
      safeBrowsing: cleanSafeBrowsing,
      virusTotal: cleanVT,
      urlhaus: cleanUrlhaus,
    });

    expect(result.score).toBeGreaterThanOrEqual(40);
    expect(result.score).toBeLessThanOrEqual(59);
    expect(result.level).toBe("MODERATE");
  });

  // 10. Valid SSL + malicious threat intelligence
  it("10. Valid SSL + malicious threat intelligence: verified phishing dominates valid SSL certificate", () => {
    const phishingSB: SafeBrowsingResult = {
      ...cleanSafeBrowsing,
      status: "THREAT_DETECTED",
      threatDetected: true,
      threatTypes: ["SOCIAL_ENGINEERING"],
      score: 90,
      reason: "Phishing attack targeting bank",
    };

    const result = calculateRiskScore({
      normalizedUrl: "https://chase-security-update.com/login",
      domain: "chase-security-update.com",
      ssl: cleanSsl, // Valid trusted DigiCert SSL
      safeBrowsing: phishingSB,
      virusTotal: cleanVT,
      urlhaus: cleanUrlhaus,
    });

    // Valid HTTPS must NEVER negate confirmed phishing
    expect(result.score).toBeGreaterThanOrEqual(80);
    expect(result.level).toBe("CRITICAL");
  });

  // 11. Unknown VirusTotal
  it("11. Unknown VirusTotal: does not mark clean URL as malicious or reduce score to 0; reduces confidence", () => {
    const unavailableVT: VirusTotalResult = {
      checked: false,
      available: false,
      malicious: false,
      suspicious: false,
      maliciousCount: 0,
      suspiciousCount: 0,
      undetectedCount: 0,
      totalEngines: 0,
      status: "unavailable",
      error: "Rate limit exceeded",
    };

    const result = calculateRiskScore({
      normalizedUrl: "https://example.com",
      domain: "example.com",
      ssl: cleanSsl,
      safeBrowsing: cleanSafeBrowsing,
      virusTotal: unavailableVT,
      urlhaus: cleanUrlhaus,
    });

    expect(result.level).toBe("SAFE");
    // Confidence reduced because VirusTotal was unavailable (-20%)
    expect(result.confidence).toBeLessThanOrEqual(80);
  });

  // 12. Unknown Safe Browsing
  it("12. Unknown Safe Browsing: reflects unavailable status with a 25% confidence deduction", () => {
    const unavailableSB: SafeBrowsingResult = {
      ...cleanSafeBrowsing,
      available: false,
      status: "UNAVAILABLE",
      reason: "API key not configured",
    };

    const result = calculateRiskScore({
      normalizedUrl: "https://example.com",
      domain: "example.com",
      ssl: cleanSsl,
      safeBrowsing: unavailableSB,
      virusTotal: cleanVT,
      urlhaus: cleanUrlhaus,
    });

    expect(result.confidence).toBeLessThanOrEqual(75);
    expect(result.findings.some((f) => f.finding === "SAFE_BROWSING_UNAVAILABLE")).toBe(true);
  });

  // 13. Unknown URLhaus
  it("13. Unknown URLhaus: reflects unavailable status with a 15% confidence deduction", () => {
    const unavailableUrlhaus: UrlhausResult = {
      available: false,
      status: "UNAVAILABLE",
      match: false,
      provider: "URLHAUS",
      reason: "Timeout reaching abuse.ch",
      checkedAt: new Date().toISOString(),
    };

    const result = calculateRiskScore({
      normalizedUrl: "https://example.com",
      domain: "example.com",
      ssl: cleanSsl,
      safeBrowsing: cleanSafeBrowsing,
      virusTotal: cleanVT,
      urlhaus: unavailableUrlhaus,
    });

    expect(result.confidence).toBeLessThanOrEqual(85);
    expect(result.findings.some((f) => f.finding === "URLHAUS_UNAVAILABLE")).toBe(true);
  });

  // 14. Multiple unavailable services
  it("14. Multiple unavailable services: flags analysis as LIMITED with low confidence (<= 40%)", () => {
    const unavailableSB: SafeBrowsingResult = {
      ...cleanSafeBrowsing,
      available: false,
      status: "UNAVAILABLE",
      reason: "Downstream network error",
    };
    const unavailableVT: VirusTotalResult = {
      checked: false,
      available: false,
      malicious: false,
      suspicious: false,
      maliciousCount: 0,
      suspiciousCount: 0,
      undetectedCount: 0,
      totalEngines: 0,
      status: "unavailable",
    };
    const unavailableUrlhaus: UrlhausResult = {
      available: false,
      status: "UNAVAILABLE",
      match: false,
      provider: "URLHAUS",
      reason: "Downstream network error",
      checkedAt: new Date().toISOString(),
    };

    const result = calculateRiskScore({
      normalizedUrl: "https://example.com",
      domain: "example.com",
      ssl: cleanSsl,
      safeBrowsing: unavailableSB,
      virusTotal: unavailableVT,
      urlhaus: unavailableUrlhaus,
    });

    expect(result.analysisStatus).toBe("LIMITED");
    expect(result.confidence).toBeLessThanOrEqual(40);
  });

  // 15. Conflicting evidence
  it("15. Conflicting evidence: handles clean external feeds combined with suspicious local heuristics properly", () => {
    // External feeds report clean, but URL contains credential obfuscation '@'
    const result = calculateRiskScore({
      normalizedUrl: "https://legit-site.com@attacker-controlled.net/login",
      domain: "attacker-controlled.net",
      ssl: cleanSsl,
      safeBrowsing: cleanSafeBrowsing,
      virusTotal: cleanVT,
      urlhaus: cleanUrlhaus,
    });

    // Should recognize credential obfuscation as HIGH severity, not zero
    expect(result.score).toBeGreaterThanOrEqual(60);
    expect(result.level).toBe("HIGH");
    expect(result.findings.some((f) => f.finding === "URL_CREDENTIAL_OBFUSCATION")).toBe(true);
  });

  // 16. Duplicate evidence
  it("16. Duplicate evidence: applies diminishing returns so 50 VT engines are treated as single consensus", () => {
    const massVT: VirusTotalResult = {
      ...cleanVT,
      malicious: true,
      maliciousCount: 50,
      totalEngines: 70,
      detectionRatio: "50/70",
      status: "threat_found",
    };

    const result = calculateRiskScore({
      normalizedUrl: "https://malware-sample.com",
      domain: "malware-sample.com",
      ssl: cleanSsl,
      safeBrowsing: cleanSafeBrowsing,
      virusTotal: massVT,
      urlhaus: cleanUrlhaus,
    });

    expect(result.score).toBeLessThanOrEqual(100);
    expect(result.score).toBeGreaterThanOrEqual(80);
    // Findings array has exactly 1 consolidated finding for VirusTotal, not 50
    const vtFindings = result.findings.filter((f) => f.source === "VirusTotal");
    expect(vtFindings.length).toBe(1);
  });

  // 17. Score minimum
  it("17. Score minimum: ensures risk score is always clamped >= 0", () => {
    const result = calculateRiskScore({
      normalizedUrl: "https://trusted-domain.com",
      domain: "trusted-domain.com",
      ssl: cleanSsl,
      safeBrowsing: cleanSafeBrowsing,
      virusTotal: cleanVT,
      urlhaus: cleanUrlhaus,
    });

    expect(result.score).toBeGreaterThanOrEqual(0);
  });

  // 18. Score maximum
  it("18. Score maximum: ensures risk score never exceeds 100 under all threats simultaneously", () => {
    const result = calculateRiskScore({
      normalizedUrl: "http://192.0.2.1@evil.com/malware.exe",
      domain: "evil.com",
      ssl: { enabled: false, valid: false, status: "invalid" },
      safeBrowsing: { checked: true, available: true, status: "THREAT_DETECTED", threatDetected: true, threatTypes: ["MALWARE"], score: 100, reason: "Confirmed malware" } as any,
      virusTotal: { checked: true, available: true, malicious: true, suspicious: true, maliciousCount: 65, suspiciousCount: 5, totalEngines: 70, detectionRatio: "65/70", status: "clean" },
      urlhaus: { available: true, status: "MALWARE_URL_DETECTED", match: true, reason: "Active payload" } as any,
    });

    expect(result.score).toBeLessThanOrEqual(100);
    expect(result.score).toBe(99);
    expect(result.level).toBe("CRITICAL");
    expect(result.overrideTriggered).toBe(true);
    expect(result.calculationMethod).toBe("SHORT_CIRCUIT_OVERRIDE");
  });

  // 19. Risk level boundaries
  it("19. Risk level boundaries: matches authoritative 0-19 SAFE, 20-39 LOW, 40-59 MODERATE, 60-79 HIGH, 80-100 CRITICAL", () => {
    expect(getRiskLevel(0)).toBe("SAFE");
    expect(getRiskLevel(19)).toBe("SAFE");
    expect(getRiskLevel(20)).toBe("LOW");
    expect(getRiskLevel(39)).toBe("LOW");
    expect(getRiskLevel(40)).toBe("MODERATE");
    expect(getRiskLevel(59)).toBe("MODERATE");
    expect(getRiskLevel(60)).toBe("HIGH");
    expect(getRiskLevel(79)).toBe("HIGH");
    expect(getRiskLevel(80)).toBe("CRITICAL");
    expect(getRiskLevel(100)).toBe("CRITICAL");
  });

  // 20. Deterministic repeated calculation
  it("20. Deterministic repeated calculation: returns identical score and findings across repeated executions", () => {
    const params = {
      normalizedUrl: "https://suspicious-test.xyz/verify",
      domain: "suspicious-test.xyz",
      ssl: cleanSsl,
      safeBrowsing: cleanSafeBrowsing,
      virusTotal: { ...cleanVT, malicious: true, maliciousCount: 3, detectionRatio: "3/72" },
      urlhaus: cleanUrlhaus,
    };

    const run1 = calculateRiskScore(params);
    const run2 = calculateRiskScore(params);
    const run3 = calculateRiskScore(params);

    expect(run1.score).toBe(run2.score);
    expect(run2.score).toBe(run3.score);
    expect(run1.level).toBe(run2.level);
    expect(run1.confidence).toBe(run2.confidence);
    expect(run1.reasons).toEqual(run2.reasons);
    expect(run1.findings).toEqual(run2.findings);
  });

  it("exports backward compatible FACTOR_WEIGHTS array", () => {
    expect(FACTOR_WEIGHTS).toHaveLength(5);
  });
});

describe("Short-Circuit Override Rules and Two-Stage Risk Engine", () => {
  const cleanSsl: SslAnalysisResult = {
    enabled: true,
    valid: true,
    status: "valid",
    issuer: "DigiCert Global Root G2",
    validDaysRemaining: 240,
  };

  const cleanSafeBrowsing: SafeBrowsingResult = {
    checked: true,
    available: true,
    status: "CHECKED_NO_THREAT",
    threatDetected: false,
    threatTypes: [],
    score: 0,
    provider: "GOOGLE_SAFE_BROWSING",
    reason: "No threats detected by Google Safe Browsing",
    checkedAt: new Date().toISOString(),
  };

  const cleanVT: VirusTotalResult = {
    checked: true,
    available: true,
    malicious: false,
    suspicious: false,
    harmless: 70,
    maliciousCount: 0,
    suspiciousCount: 0,
    undetectedCount: 2,
    totalEngines: 72,
    detectionRatio: "0/72",
    enginesFlagged: 0,
    permalink: null,
    status: "clean",
  };

  const cleanUrlhaus: UrlhausResult = {
    available: true,
    status: "CHECKED_NO_MATCH",
    match: false,
    provider: "URLHAUS",
    reason: "No active malware distribution detected by URLhaus",
    checkedAt: new Date().toISOString(),
  };

  // 1. Google malicious override
  it("1. Google malicious override: triggers score 99, CRITICAL, overrideTriggered = true, calculationMethod = SHORT_CIRCUIT_OVERRIDE", () => {
    const maliciousSB: SafeBrowsingResult = {
      ...cleanSafeBrowsing,
      status: "THREAT_DETECTED",
      threatDetected: true,
      threatTypes: ["SOCIAL_ENGINEERING"],
      score: 90,
      reason: "Google Safe Browsing detected a phishing threat.",
    };

    const result = calculateRiskScore({
      normalizedUrl: "https://phishing-login.example.com",
      domain: "phishing-login.example.com",
      ssl: cleanSsl,
      safeBrowsing: maliciousSB,
      virusTotal: cleanVT,
      urlhaus: cleanUrlhaus,
    });

    expect(result.score).toBe(99);
    expect(result.level).toBe("CRITICAL");
    expect(result.overrideTriggered).toBe(true);
    expect(result.overrideType).toBe("GOOGLE_MALICIOUS");
    expect(result.overrideReason).toContain("Google Safe Browsing detected a malicious threat.");
    expect(result.calculationMethod).toBe("SHORT_CIRCUIT_OVERRIDE");
  });

  // 2. URLhaus online override
  it("2. URLhaus online override: triggers score 99, CRITICAL, overrideTriggered = true, calculationMethod = SHORT_CIRCUIT_OVERRIDE", () => {
    const onlineUrlhaus: UrlhausResult = {
      available: true,
      status: "MALWARE_URL_DETECTED",
      match: true,
      threatType: "malware_download",
      provider: "URLHAUS",
      reason: "Active payload online",
      checkedAt: new Date().toISOString(),
    };

    const result = calculateRiskScore({
      normalizedUrl: "http://malware-drop.biz/payload.bin",
      domain: "malware-drop.biz",
      ssl: cleanSsl,
      safeBrowsing: cleanSafeBrowsing,
      virusTotal: cleanVT,
      urlhaus: onlineUrlhaus,
    });

    expect(result.score).toBe(99);
    expect(result.level).toBe("CRITICAL");
    expect(result.overrideTriggered).toBe(true);
    expect(result.overrideType).toBe("URLHAUS_ONLINE");
    expect(result.overrideReason).toContain("URLhaus identified the URL as an active malicious URL.");
    expect(result.calculationMethod).toBe("SHORT_CIRCUIT_OVERRIDE");
  });

  // 3. VirusTotal 4 detections override
  it("3. VirusTotal 4 detections override: triggers score 95, CRITICAL, overrideTriggered = true, calculationMethod = SHORT_CIRCUIT_OVERRIDE", () => {
    const vt4: VirusTotalResult = {
      ...cleanVT,
      malicious: true,
      maliciousCount: 4,
      detectionRatio: "4/70",
      status: "threat_found",
    };

    const result = calculateRiskScore({
      normalizedUrl: "https://suspicious-domain.com",
      domain: "suspicious-domain.com",
      ssl: cleanSsl,
      safeBrowsing: cleanSafeBrowsing,
      virusTotal: vt4,
      urlhaus: cleanUrlhaus,
    });

    expect(result.score).toBe(95);
    expect(result.level).toBe("CRITICAL");
    expect(result.overrideTriggered).toBe(true);
    expect(result.overrideType).toBe("VIRUSTOTAL_DETECTIONS");
    expect(result.overrideReason).toContain("VirusTotal reported four or more security detections.");
    expect(result.calculationMethod).toBe("SHORT_CIRCUIT_OVERRIDE");
  });

  // 4. Multiple overrides priority and reason combination
  it("4. Multiple overrides: does not downgrade 99 to 95 and mentions multiple critical signals", () => {
    const maliciousSB: SafeBrowsingResult = {
      ...cleanSafeBrowsing,
      status: "THREAT_DETECTED",
      threatDetected: true,
      threatTypes: ["MALWARE"],
    };
    const onlineUrlhaus: UrlhausResult = {
      available: true,
      status: "MALWARE_URL_DETECTED",
      match: true,
      threatType: "malware_download",
      provider: "URLHAUS",
      reason: "Active payload online",
      checkedAt: new Date().toISOString(),
    };
    const vt10: VirusTotalResult = {
      ...cleanVT,
      malicious: true,
      maliciousCount: 10,
      detectionRatio: "10/70",
    };

    // Google + URLhaus
    const resGoogleUrlhaus = calculateRiskScore({
      normalizedUrl: "https://danger.com",
      domain: "danger.com",
      ssl: cleanSsl,
      safeBrowsing: maliciousSB,
      virusTotal: cleanVT,
      urlhaus: onlineUrlhaus,
    });
    expect(resGoogleUrlhaus.score).toBe(99);
    expect(resGoogleUrlhaus.level).toBe("CRITICAL");
    expect(resGoogleUrlhaus.overrideType).toBe("GOOGLE_MALICIOUS");
    expect(resGoogleUrlhaus.overrideReason).toContain("Google Safe Browsing");
    expect(resGoogleUrlhaus.overrideReason).toContain("URLhaus");

    // Google + VT >= 4
    const resGoogleVt = calculateRiskScore({
      normalizedUrl: "https://danger.com",
      domain: "danger.com",
      ssl: cleanSsl,
      safeBrowsing: maliciousSB,
      virusTotal: vt10,
      urlhaus: cleanUrlhaus,
    });
    expect(resGoogleVt.score).toBe(99);
    expect(resGoogleVt.overrideType).toBe("GOOGLE_MALICIOUS");
    expect(resGoogleVt.overrideReason).toContain("Google Safe Browsing");
    expect(resGoogleVt.overrideReason).toContain("VirusTotal");

    // URLhaus + VT >= 4
    const resUrlhausVt = calculateRiskScore({
      normalizedUrl: "https://danger.com",
      domain: "danger.com",
      ssl: cleanSsl,
      safeBrowsing: cleanSafeBrowsing,
      virusTotal: vt10,
      urlhaus: onlineUrlhaus,
    });
    expect(resUrlhausVt.score).toBe(99);
    expect(resUrlhausVt.overrideType).toBe("URLHAUS_ONLINE");
    expect(resUrlhausVt.overrideReason).toContain("URLhaus");
    expect(resUrlhausVt.overrideReason).toContain("VirusTotal");
  });

  // 5. No override -> weighted calculation
  it("5. No override -> weighted calculation: executes weighted engine when no override is triggered", () => {
    const result = calculateRiskScore({
      normalizedUrl: "https://clean-verified-bank.com",
      domain: "clean-verified-bank.com",
      ssl: cleanSsl,
      safeBrowsing: cleanSafeBrowsing,
      virusTotal: cleanVT,
      urlhaus: cleanUrlhaus,
    });

    expect(result.overrideTriggered).toBe(false);
    expect(result.overrideReason).toBeNull();
    expect(result.overrideType).toBeNull();
    expect(result.calculationMethod).toBe("WEIGHTED_CALCULATION");
    expect(result.score).toBeLessThanOrEqual(19);
    expect(result.level).toBe("SAFE");
  });

  // 6. Google unavailable does not trigger override
  it("6. Google unavailable: does NOT trigger override", () => {
    const unavailSB: SafeBrowsingResult = {
      ...cleanSafeBrowsing,
      available: false,
      status: "UNAVAILABLE",
    };

    const override = checkShortCircuitOverrides({ safeBrowsing: unavailSB, urlhaus: cleanUrlhaus, virusTotal: cleanVT });
    expect(override.triggered).toBe(false);
  });

  // 7. URLhaus unavailable does not trigger override
  it("7. URLhaus unavailable: does NOT trigger override for UNAVAILABLE, ERROR, or CHECKED_NO_MATCH", () => {
    const unavailUh: UrlhausResult = {
      available: false,
      status: "UNAVAILABLE",
      match: false,
      provider: "URLHAUS",
      reason: "Timeout",
      checkedAt: new Date().toISOString(),
    };
    const errorUh: UrlhausResult = {
      available: false,
      status: "ERROR",
      match: false,
      provider: "URLHAUS",
      reason: "Error",
      checkedAt: new Date().toISOString(),
    };

    expect(checkShortCircuitOverrides({ urlhaus: unavailUh }).triggered).toBe(false);
    expect(checkShortCircuitOverrides({ urlhaus: errorUh }).triggered).toBe(false);
    expect(checkShortCircuitOverrides({ urlhaus: cleanUrlhaus }).triggered).toBe(false);
  });

  // 8. VirusTotal unavailable does not trigger override
  it("8. VirusTotal unavailable: does NOT trigger override", () => {
    const unavailVT: VirusTotalResult = {
      checked: false,
      available: false,
      malicious: false,
      suspicious: false,
      maliciousCount: 0,
      suspiciousCount: 0,
      undetectedCount: 0,
      totalEngines: 0,
      status: "unavailable",
    };

    expect(checkShortCircuitOverrides({ virusTotal: unavailVT }).triggered).toBe(false);
  });

  // 9. VirusTotal 3 detections -> NO override
  it("9. VirusTotal 3 detections: does NOT trigger override (runs normal weighted calculation)", () => {
    const vt3: VirusTotalResult = {
      ...cleanVT,
      malicious: true,
      maliciousCount: 3,
      detectionRatio: "3/70",
    };

    const result = calculateRiskScore({
      normalizedUrl: "https://moderate-risk-site.org",
      domain: "moderate-risk-site.org",
      ssl: cleanSsl,
      safeBrowsing: cleanSafeBrowsing,
      virusTotal: vt3,
      urlhaus: cleanUrlhaus,
    });

    expect(result.overrideTriggered).toBe(false);
    expect(result.calculationMethod).toBe("WEIGHTED_CALCULATION");
    expect(result.level).toBe("MODERATE");
  });

  // 10. VirusTotal 4 detections -> override
  it("10. VirusTotal 4 detections: triggers override with score 95", () => {
    const vt4: VirusTotalResult = {
      ...cleanVT,
      malicious: true,
      maliciousCount: 4,
      detectionRatio: "4/70",
    };

    const override = checkShortCircuitOverrides({ virusTotal: vt4 });
    expect(override.triggered).toBe(true);
    expect(override.score).toBe(95);
    expect(override.level).toBe("CRITICAL");
    expect(override.overrideType).toBe("VIRUSTOTAL_DETECTIONS");
  });

  // 11–18. Risk boundaries
  it("11. Risk boundary 19 -> SAFE", () => {
    expect(getRiskLevel(19)).toBe("SAFE");
  });

  it("12. Risk boundary 20 -> LOW", () => {
    expect(getRiskLevel(20)).toBe("LOW");
  });

  it("13. Risk boundary 39 -> LOW", () => {
    expect(getRiskLevel(39)).toBe("LOW");
  });

  it("14. Risk boundary 40 -> MODERATE", () => {
    expect(getRiskLevel(40)).toBe("MODERATE");
  });

  it("15. Risk boundary 59 -> MODERATE", () => {
    expect(getRiskLevel(59)).toBe("MODERATE");
  });

  it("16. Risk boundary 60 -> HIGH", () => {
    expect(getRiskLevel(60)).toBe("HIGH");
  });

  it("17. Risk boundary 79 -> HIGH", () => {
    expect(getRiskLevel(79)).toBe("HIGH");
  });

  it("18. Risk boundary 80 -> CRITICAL", () => {
    expect(getRiskLevel(80)).toBe("CRITICAL");
  });

  // 19. Override score 95 -> CRITICAL
  it("19. Override score 95 -> CRITICAL", () => {
    expect(getRiskLevel(95)).toBe("CRITICAL");
  });

  // 20. Override score 99 -> CRITICAL
  it("20. Override score 99 -> CRITICAL", () => {
    expect(getRiskLevel(99)).toBe("CRITICAL");
  });

  // ============================================================================
  // Section 14 User Test Cases
  // ============================================================================

  it("TEST CASE 1: Google malicious only -> 99, CRITICAL, overrideTriggered = true, SHORT_CIRCUIT_OVERRIDE", () => {
    const res = calculateRiskScore({
      normalizedUrl: "https://evil.com",
      domain: "evil.com",
      ssl: cleanSsl,
      safeBrowsing: { ...cleanSafeBrowsing, status: "THREAT_DETECTED", threatDetected: true, threatTypes: ["MALWARE"] },
      virusTotal: { ...cleanVT, maliciousCount: 0 },
      urlhaus: { ...cleanUrlhaus, status: "CHECKED_NO_MATCH", match: false },
    });

    expect(res.score).toBe(99);
    expect(res.level).toBe("CRITICAL");
    expect(res.overrideTriggered).toBe(true);
    expect(res.calculationMethod).toBe("SHORT_CIRCUIT_OVERRIDE");
  });

  it("TEST CASE 2: URLhaus online -> 99, CRITICAL, overrideTriggered = true, SHORT_CIRCUIT_OVERRIDE", () => {
    const res = calculateRiskScore({
      normalizedUrl: "https://evil.com",
      domain: "evil.com",
      ssl: cleanSsl,
      safeBrowsing: cleanSafeBrowsing,
      virusTotal: { ...cleanVT, maliciousCount: 1 },
      urlhaus: { ...cleanUrlhaus, status: "MALWARE_URL_DETECTED", match: true },
    });

    expect(res.score).toBe(99);
    expect(res.level).toBe("CRITICAL");
    expect(res.overrideTriggered).toBe(true);
    expect(res.calculationMethod).toBe("SHORT_CIRCUIT_OVERRIDE");
  });

  it("TEST CASE 3: VirusTotal 4 detections -> 95, CRITICAL, overrideTriggered = true, SHORT_CIRCUIT_OVERRIDE", () => {
    const res = calculateRiskScore({
      normalizedUrl: "https://evil.com",
      domain: "evil.com",
      ssl: cleanSsl,
      safeBrowsing: cleanSafeBrowsing,
      urlhaus: cleanUrlhaus,
      virusTotal: { ...cleanVT, malicious: true, maliciousCount: 4, detectionRatio: "4/70" },
    });

    expect(res.score).toBe(95);
    expect(res.level).toBe("CRITICAL");
    expect(res.overrideTriggered).toBe(true);
    expect(res.calculationMethod).toBe("SHORT_CIRCUIT_OVERRIDE");
  });

  it("TEST CASE 4: VirusTotal 2 detections, no override -> normal weighted calculation", () => {
    const res = calculateRiskScore({
      normalizedUrl: "https://somewhat-suspicious.com",
      domain: "somewhat-suspicious.com",
      ssl: cleanSsl,
      safeBrowsing: cleanSafeBrowsing,
      urlhaus: cleanUrlhaus,
      virusTotal: { ...cleanVT, malicious: true, maliciousCount: 2, detectionRatio: "2/70" },
    });

    expect(res.overrideTriggered).toBe(false);
    expect(res.calculationMethod).toBe("WEIGHTED_CALCULATION");
    expect(res.level).toBe("MODERATE");
  });

  it("TEST CASE 5: External providers UNAVAILABLE -> NO override, confidence handling without false malicious", () => {
    const unavailSB: SafeBrowsingResult = { ...cleanSafeBrowsing, available: false, status: "UNAVAILABLE" };
    const unavailUh: UrlhausResult = { ...cleanUrlhaus, available: false, status: "UNAVAILABLE" };
    const unavailVT: VirusTotalResult = { ...cleanVT, available: false, status: "unavailable" };

    const res = calculateRiskScore({
      normalizedUrl: "https://internal-portal.com",
      domain: "internal-portal.com",
      ssl: cleanSsl,
      safeBrowsing: unavailSB,
      urlhaus: unavailUh,
      virusTotal: unavailVT,
    });

    expect(res.overrideTriggered).toBe(false);
    expect(res.calculationMethod).toBe("WEIGHTED_CALCULATION");
    expect(res.level).toBe("SAFE");
    expect(res.analysisStatus).toBe("LIMITED");
    expect(res.confidence).toBeLessThanOrEqual(45);
  });
});
