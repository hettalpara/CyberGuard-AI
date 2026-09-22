import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import tls from "node:tls";
import { EventEmitter } from "node:events";
import { analyzeSslUrl } from "../src/services/ssl-analysis.service";
import { analyzeSsl } from "../src/services/ssl.service";

describe("SSL / TLS Analysis Services", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("analyzeSslUrl (ssl-analysis.service.ts)", () => {
    it("handles plain HTTP URLs correctly without initiating TLS handshake", async () => {
      const connectSpy = vi.spyOn(tls, "connect");
      const result = await analyzeSslUrl("http://insecure-example.org/path");

      expect(result.status).toBe("CHECKED");
      expect(result.protocol).toBe("HTTP");
      expect(result.score).toBe(40);
      expect(result.level).toBe("MODERATE");
      expect(result.reason).toContain("plain HTTP without SSL/TLS");
      expect(connectSpy).not.toHaveBeenCalled();
    });

    it("evaluates a valid HTTPS certificate with score 0 (SAFE)", async () => {
      const futureDate = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toUTCString();
      const mockCert = {
        subject: { CN: "example.com", O: "Example Corp" },
        issuer: { O: "DigiCert Global Root CA", CN: "DigiCert" },
        valid_from: new Date().toUTCString(),
        valid_to: futureDate,
      };

      vi.spyOn(tls, "checkServerIdentity").mockReturnValue(undefined);

      vi.spyOn(tls, "connect").mockImplementation((_opts: any, cb?: any) => {
        const emitter = new EventEmitter() as any;
        emitter.destroy = vi.fn();
        emitter.authorized = true;
        emitter.authorizationError = null;
        emitter.getPeerCertificate = vi.fn().mockReturnValue(mockCert);

        setTimeout(() => {
          if (cb) cb();
        }, 1);

        return emitter;
      });

      const result = await analyzeSslUrl("https://example.com");

      expect(result.status).toBe("CHECKED");
      expect(result.protocol).toBe("HTTPS");
      expect(result.score).toBe(0);
      expect(result.level).toBe("SAFE");
      expect(result.certificate.authorized).toBe(true);
      expect(result.reason).toContain("Valid HTTPS certificate");
    });

    it("detects expired certificates and assigns HIGH risk score 60", async () => {
      const pastDate = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toUTCString();
      const mockCert = {
        subject: { CN: "expired.example.com" },
        issuer: { O: "Let's Encrypt" },
        valid_from: "Jan 1 2020",
        valid_to: pastDate,
      };

      vi.spyOn(tls, "checkServerIdentity").mockReturnValue(undefined);

      vi.spyOn(tls, "connect").mockImplementation((_opts: any, cb?: any) => {
        const emitter = new EventEmitter() as any;
        emitter.destroy = vi.fn();
        emitter.authorized = true;
        emitter.authorizationError = null;
        emitter.getPeerCertificate = vi.fn().mockReturnValue(mockCert);

        setTimeout(() => {
          if (cb) cb();
        }, 1);

        return emitter;
      });

      const result = await analyzeSslUrl("https://expired.example.com");

      expect(result.status).toBe("CHECKED");
      expect(result.score).toBe(60);
      expect(result.level).toBe("HIGH");
      expect(result.reason).toContain("expired");
    });

    it("detects hostname mismatch and assigns HIGH risk score 80", async () => {
      const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toUTCString();
      const mockCert = {
        subject: { CN: "different-domain.com" },
        issuer: { O: "TrustCA" },
        valid_from: "Jan 1 2025",
        valid_to: futureDate,
      };

      vi.spyOn(tls, "checkServerIdentity").mockReturnValue(
        new Error("Hostname/IP does not match certificate's altnames")
      );

      vi.spyOn(tls, "connect").mockImplementation((_opts: any, cb?: any) => {
        const emitter = new EventEmitter() as any;
        emitter.destroy = vi.fn();
        emitter.authorized = true;
        emitter.authorizationError = null;
        emitter.getPeerCertificate = vi.fn().mockReturnValue(mockCert);

        setTimeout(() => {
          if (cb) cb();
        }, 1);

        return emitter;
      });

      const result = await analyzeSslUrl("https://spoofed.example.com");

      expect(result.status).toBe("CHECKED");
      expect(result.score).toBe(80);
      expect(result.level).toBe("HIGH");
      expect(result.reason).toContain("hostname mismatch");
    });

    it("detects untrusted / self-signed certificate and assigns HIGH risk score 70", async () => {
      const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toUTCString();
      const mockCert = {
        subject: { CN: "selfsigned.local" },
        issuer: { CN: "selfsigned.local" },
        valid_from: "Jan 1 2025",
        valid_to: futureDate,
      };

      vi.spyOn(tls, "checkServerIdentity").mockReturnValue(undefined);

      vi.spyOn(tls, "connect").mockImplementation((_opts: any, cb?: any) => {
        const emitter = new EventEmitter() as any;
        emitter.destroy = vi.fn();
        emitter.authorized = false;
        emitter.authorizationError = "SELF_SIGNED_CERT_IN_CHAIN";
        emitter.getPeerCertificate = vi.fn().mockReturnValue(mockCert);

        setTimeout(() => {
          if (cb) cb();
        }, 1);

        return emitter;
      });

      const result = await analyzeSslUrl("https://selfsigned.local");

      expect(result.status).toBe("CHECKED");
      expect(result.score).toBe(70);
      expect(result.level).toBe("HIGH");
      expect(result.reason).toContain("verification failed");
    });

    it("handles connection failure by setting status to UNAVAILABLE", async () => {
      vi.spyOn(tls, "connect").mockImplementation(() => {
        const emitter = new EventEmitter() as any;
        emitter.destroy = vi.fn();

        setTimeout(() => {
          emitter.emit("error", new Error("ECONNREFUSED"));
        }, 1);

        return emitter;
      });

      const result = await analyzeSslUrl("https://unreachable.test");

      expect(result.status).toBe("UNAVAILABLE");
      expect(result.score).toBeNull();
      expect(result.reason).toContain("TLS connection failed");
    });

    it("handles socket timeout by setting status to UNAVAILABLE", async () => {
      vi.spyOn(tls, "connect").mockImplementation(() => {
        const emitter = new EventEmitter() as any;
        emitter.destroy = vi.fn();

        setTimeout(() => {
          emitter.emit("timeout");
        }, 1);

        return emitter;
      });

      const result = await analyzeSslUrl("https://slow.test", 100);

      expect(result.status).toBe("UNAVAILABLE");
      expect(result.score).toBeNull();
      expect(result.reason).toContain("timed out");
    });
  });

  describe("analyzeSsl (ssl.service.ts legacy wrapper)", () => {
    it("returns disabled for HTTP-only URLs", async () => {
      const result = await analyzeSsl("example.com", false);
      expect(result.enabled).toBe(false);
      expect(result.valid).toBe(false);
      expect(result.status).toBe("unavailable");
      expect(result.issuer).toContain("HTTP Only");
    });

    it("analyzes valid TLS connection and returns remaining days", async () => {
      const futureDate = new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toUTCString();
      const mockCert = {
        issuer: { O: "Cloudflare Inc" },
        valid_to: futureDate,
      };

      vi.spyOn(tls, "connect").mockImplementation((_opts: any, cb?: any) => {
        const emitter = new EventEmitter() as any;
        emitter.destroy = vi.fn();
        emitter.authorized = true;
        emitter.authorizationError = null;
        emitter.getPeerCertificate = vi.fn().mockReturnValue(mockCert);
        emitter.getProtocol = vi.fn().mockReturnValue("TLSv1.3");

        setTimeout(() => {
          if (cb) cb();
        }, 1);

        return emitter;
      });

      const result = await analyzeSsl("secure.example.com", true);

      expect(result.enabled).toBe(true);
      expect(result.valid).toBe(true);
      expect(result.status).toBe("valid");
      expect(result.issuer).toBe("Cloudflare Inc");
      expect(result.validDaysRemaining).toBeGreaterThanOrEqual(44);
      expect(result.protocol).toBe("TLSv1.3");
    });
  });
});
