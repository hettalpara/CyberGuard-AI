import { describe, it, expect } from "vitest";
import {
  analyzeUrlIntelligence,
  getRiskLevel,
} from "../src/services/url-intelligence.service";

describe("URL Intelligence Service (Local Heuristic Engine)", () => {
  describe("getRiskLevel score mapping", () => {
    it("maps scores to correct risk levels", () => {
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
  });

  describe("analyzeUrlIntelligence", () => {
    it("returns SAFE and score 0 for standard benign HTTPS URL", () => {
      const result = analyzeUrlIntelligence("https://www.google.com");
      expect(result.status).toBe("CHECKED");
      expect(result.score).toBe(0);
      expect(result.level).toBe("SAFE");
      expect(result.indicators).toHaveLength(0);
      expect(result.evidence.isRawIp).toBe(false);
      expect(result.evidence.hasPunycode).toBe(false);
      expect(result.reasons[0]).toContain("standard conventions");
    });

    it("detects raw IPv4 address and assigns risk score +25", () => {
      const result = analyzeUrlIntelligence("http://192.168.1.100/index.html");
      expect(result.status).toBe("CHECKED");
      expect(result.score).toBeGreaterThanOrEqual(25);
      expect(result.evidence.isRawIp).toBe(true);
      const ipIndicator = result.indicators.find((i) => i.name === "Raw IP Address");
      expect(ipIndicator).toBeDefined();
      expect(ipIndicator?.score).toBe(25);
    });

    it("detects raw IPv6 address and assigns risk score +25", () => {
      const result = analyzeUrlIntelligence("http://[2001:db8::1]/path");
      expect(result.status).toBe("CHECKED");
      expect(result.evidence.isRawIp).toBe(true);
      const ipIndicator = result.indicators.find((i) => i.name === "Raw IP Address");
      expect(ipIndicator).toBeDefined();
    });

    it("detects Punycode (IDN homograph spoofing) and assigns risk score +20", () => {
      const result = analyzeUrlIntelligence("https://xn--pple-43d.com/login");
      expect(result.status).toBe("CHECKED");
      expect(result.evidence.hasPunycode).toBe(true);
      const punyIndicator = result.indicators.find((i) => i.name === "Punycode Encoding");
      expect(punyIndicator).toBeDefined();
      expect(punyIndicator?.score).toBe(20);
    });

    it("detects excessive subdomain levels (>= 3 levels)", () => {
      const result = analyzeUrlIntelligence("https://sub4.sub3.sub2.sub1.example.com");
      expect(result.status).toBe("CHECKED");
      expect(result.evidence.subdomainLevels).toBeGreaterThanOrEqual(3);
      const subIndicator = result.indicators.find((i) => i.name === "Excessive Subdomains");
      expect(subIndicator).toBeDefined();
      expect(subIndicator?.score).toBe(10);
    });

    it("detects long URL (> 150 characters)", () => {
      const padding = "a".repeat(160);
      const result = analyzeUrlIntelligence(`https://example.com/${padding}`);
      expect(result.status).toBe("CHECKED");
      const lenIndicator = result.indicators.find((i) => i.name === "Long URL");
      expect(lenIndicator).toBeDefined();
      expect(lenIndicator?.score).toBe(10);
    });

    it("detects excessive URL length (> 250 characters)", () => {
      const padding = "b".repeat(260);
      const result = analyzeUrlIntelligence(`https://example.com/${padding}`);
      expect(result.status).toBe("CHECKED");
      const lenIndicator = result.indicators.find((i) => i.name === "Excessive URL Length");
      expect(lenIndicator).toBeDefined();
      expect(lenIndicator?.score).toBe(15);
    });

    it("detects suspicious percent encoding (%2F, %3D, %40, %25)", () => {
      const result = analyzeUrlIntelligence("https://example.com/path?data=%2F%3D%40%25");
      expect(result.status).toBe("CHECKED");
      const encodingIndicator = result.indicators.find((i) => i.name === "Suspicious Percent Encoding");
      expect(encodingIndicator).toBeDefined();
      expect(encodingIndicator?.score).toBe(10);
    });

    it("detects suspicious URL structures: @ symbol in URL", () => {
      const result = analyzeUrlIntelligence("https://legit-site.com@attacker.com/login");
      expect(result.status).toBe("CHECKED");
      const structIndicator = result.indicators.find((i) => i.name === "Suspicious URL Structure");
      expect(structIndicator).toBeDefined();
      expect(structIndicator?.reason).toContain("@");
    });

    it("detects suspicious URL structures: consecutive dots in path (e.g. filename..ext or domain)", () => {
      const result = analyzeUrlIntelligence("https://example.com/path..traversal");
      expect(result.status).toBe("CHECKED");
      const structIndicator = result.indicators.find((i) => i.name === "Suspicious URL Structure");
      expect(structIndicator).toBeDefined();
      expect(structIndicator?.reason).toContain("consecutive dots");
    });

    it("detects excessive query parameters (>= 6)", () => {
      const result = analyzeUrlIntelligence("https://example.com/test?a=1&b=2&c=3&d=4&e=5&f=6&g=7");
      expect(result.status).toBe("CHECKED");
      const structIndicator = result.indicators.find((i) => i.name === "Suspicious URL Structure");
      expect(structIndicator).toBeDefined();
      expect(structIndicator?.reason).toContain("excessive query parameters");
    });

    it("does NOT penalize sensitive keywords on legitimate/normal URLs without structural suspicion", () => {
      const result = analyzeUrlIntelligence("https://example.com/login");
      expect(result.status).toBe("CHECKED");
      // Keyword alone should not flag
      const kwIndicator = result.indicators.find((i) => i.name === "Suspicious Path/Query Keywords");
      expect(kwIndicator).toBeUndefined();
      expect(result.score).toBe(0);
    });

    it("penalizes sensitive keywords when combined with structural suspicion (e.g. raw IP)", () => {
      const result = analyzeUrlIntelligence("http://192.168.1.1/login");
      expect(result.status).toBe("CHECKED");
      const kwIndicator = result.indicators.find((i) => i.name === "Suspicious Path/Query Keywords");
      expect(kwIndicator).toBeDefined();
      expect(kwIndicator?.score).toBe(5);
    });

    it("handles non-standard URLs without throwing uncaught exceptions", () => {
      const result = analyzeUrlIntelligence("http://invalid_domain!@#$");
      expect(result).toBeDefined();
      expect(["CHECKED", "ERROR"]).toContain(result.status);
    });
  });
});
