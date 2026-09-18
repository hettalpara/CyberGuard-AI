import tls from "node:tls";
import { URL } from "node:url";

export type SslStatus = "CHECKED" | "UNAVAILABLE" | "ERROR";
export type SslProtocol = "HTTP" | "HTTPS";
export type SslRiskLevel = "SAFE" | "LOW" | "MODERATE" | "HIGH" | "CRITICAL" | null;

export interface SslCertificateInfo {
  subject?: Record<string, unknown>;
  issuer?: Record<string, unknown>;
  validFrom?: string;
  validTo?: string;
  authorized?: boolean;
  [key: string]: unknown;
}

export interface SslAnalysisOutput {
  status: SslStatus;
  protocol: SslProtocol;
  score: number | null;
  level: SslRiskLevel;
  certificate: SslCertificateInfo;
  reason: string;
  checkedAt: string;
}

const DEFAULT_TIMEOUT_MS = 6000; // 6 seconds timeout (within 5-8s requirement)

/**
 * Analyzes SSL/TLS configuration for a normalized URL using Node.js built-ins.
 * Never calls external APIs.
 */
export async function analyzeSslUrl(
  normalizedUrl: string,
  timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<SslAnalysisOutput> {
  const checkedAt = new Date().toISOString();

  let isHttps = false;
  let hostname = "";
  let port = 443;

  try {
    const parsed = new URL(normalizedUrl.startsWith("http") ? normalizedUrl : `https://${normalizedUrl}`);
    isHttps = parsed.protocol.toLowerCase() === "https:";
    hostname = parsed.hostname;
    port = parsed.port ? parseInt(parsed.port, 10) : (isHttps ? 443 : 80);
  } catch {
    // Robust fallback for punycode / IDN domains that Node's strict WHATWG URL parser rejects
    const match = normalizedUrl.match(/^(?:(https?):\/\/)?([^/?#:]+)(?::(\d+))?/i);
    if (match && match[2]) {
      isHttps = (match[1] || "https").toLowerCase() === "https";
      hostname = match[2].toLowerCase();
      port = match[3] ? parseInt(match[3], 10) : (isHttps ? 443 : 80);
    } else {
      return {
        status: "ERROR",
        protocol: "HTTP",
        score: null,
        level: null,
        certificate: {},
        reason: "Malformed URL: Invalid URL",
        checkedAt,
      };
    }
  }

  // Plain HTTP handling
  if (!isHttps) {
    return {
      status: "CHECKED",
      protocol: "HTTP",
      score: 40,
      level: "MODERATE",
      certificate: {},
      reason: "Website uses plain HTTP without SSL/TLS encryption.",
      checkedAt,
    };
  }

  // HTTPS: Perform TLS handshake and certificate validation
  return new Promise<SslAnalysisOutput>((resolve) => {
    let isSettled = false;

    const safeResolve = (result: SslAnalysisOutput) => {
      if (!isSettled) {
        isSettled = true;
        clearTimeout(timer);
        resolve(result);
      }
    };

    let socket: tls.TLSSocket | null = null;

    const timer = setTimeout(() => {
      try {
        if (socket) {
          socket.destroy();
          socket = null;
        }
      } catch {
        // ignore teardown errors
      }
      safeResolve({
        status: "UNAVAILABLE",
        protocol: "HTTPS",
        score: null,
        level: null,
        certificate: {},
        reason: `TLS connection timed out after ${timeoutMs}ms.`,
        checkedAt: new Date().toISOString(),
      });
    }, timeoutMs);

    try {
      socket = tls.connect(
        {
          host: hostname,
          port,
          servername: hostname,
          rejectUnauthorized: false, // Inspect details even for untrusted certificates
          timeout: timeoutMs,
        },
        () => {
          if (!socket) return;
          try {
            const cert = socket.getPeerCertificate(true);
            const isAuthorized = socket.authorized;
            const authError = socket.authorizationError;

            if (!cert || Object.keys(cert).length === 0) {
              socket.destroy();
              return safeResolve({
                status: "UNAVAILABLE",
                protocol: "HTTPS",
                score: null,
                level: null,
                certificate: {},
                reason: "Server completed TLS handshake but did not present a peer certificate.",
                checkedAt: new Date().toISOString(),
              });
            }

            const certInfo: SslCertificateInfo = {
              subject: cert.subject as unknown as Record<string, unknown>,
              issuer: cert.issuer as unknown as Record<string, unknown>,
              validFrom: cert.valid_from,
              validTo: cert.valid_to,
              authorized: isAuthorized,
            };

            // 1. Check expiration
            let isExpired = false;
            if (cert.valid_to) {
              const expiryDate = new Date(cert.valid_to);
              if (Date.now() > expiryDate.getTime()) {
                isExpired = true;
              }
            }

            // 2. Check hostname mismatch
            let isHostnameMismatch = false;
            let mismatchMessage = "";
            try {
              const hostCheck = tls.checkServerIdentity(hostname, cert);
              if (hostCheck) {
                isHostnameMismatch = true;
                mismatchMessage = hostCheck.message || "Hostname does not match certificate CN/SAN";
              }
            } catch (hostErr: any) {
              isHostnameMismatch = true;
              mismatchMessage = hostErr?.message || "Hostname verification failed";
            }

            // Clean socket
            socket.destroy();
            socket = null;

            // SCORING:
            // Expired certificate: score = 60, level = HIGH
            // Hostname mismatch: score = 80, level = HIGH
            // Certificate authorization failure: score = 70, level = HIGH
            // Valid HTTPS certificate: score = 0, level = SAFE

            if (isExpired) {
              return safeResolve({
                status: "CHECKED",
                protocol: "HTTPS",
                score: 60,
                level: "HIGH",
                certificate: certInfo,
                reason: `SSL/TLS certificate expired on ${cert.valid_to || "unknown date"}.`,
                checkedAt: new Date().toISOString(),
              });
            }

            if (isHostnameMismatch) {
              return safeResolve({
                status: "CHECKED",
                protocol: "HTTPS",
                score: 80,
                level: "HIGH",
                certificate: certInfo,
                reason: `SSL/TLS certificate hostname mismatch: ${mismatchMessage}.`,
                checkedAt: new Date().toISOString(),
              });
            }

            if (!isAuthorized) {
              const errStr = authError ? String(authError) : "Untrusted Certificate Authority or self-signed";
              return safeResolve({
                status: "CHECKED",
                protocol: "HTTPS",
                score: 70,
                level: "HIGH",
                certificate: certInfo,
                reason: `SSL/TLS certificate verification failed: ${errStr}.`,
                checkedAt: new Date().toISOString(),
              });
            }

            // Certificate is valid and authorized
            const issuerName =
              (cert.issuer && (cert.issuer.O || cert.issuer.CN)) || "Trusted Certificate Authority";
            return safeResolve({
              status: "CHECKED",
              protocol: "HTTPS",
              score: 0,
              level: "SAFE",
              certificate: certInfo,
              reason: `Valid HTTPS certificate issued by ${Array.isArray(issuerName) ? issuerName.join(" ") : issuerName}.`,
              checkedAt: new Date().toISOString(),
            });
          } catch (inspectErr: any) {
            if (socket) {
              socket.destroy();
              socket = null;
            }
            return safeResolve({
              status: "ERROR",
              protocol: "HTTPS",
              score: null,
              level: null,
              certificate: {},
              reason: `Certificate inspection error: ${inspectErr?.message || inspectErr}`,
              checkedAt: new Date().toISOString(),
            });
          }
        }
      );

      socket.on("timeout", () => {
        if (socket) {
          socket.destroy();
          socket = null;
        }
        safeResolve({
          status: "UNAVAILABLE",
          protocol: "HTTPS",
          score: null,
          level: null,
          certificate: {},
          reason: `TLS connection timed out after ${timeoutMs}ms.`,
          checkedAt: new Date().toISOString(),
        });
      });

      socket.on("error", (err: any) => {
        if (socket) {
          socket.destroy();
          socket = null;
        }
        // Network failures / DNS / Connection refused are marked UNAVAILABLE
        safeResolve({
          status: "UNAVAILABLE",
          protocol: "HTTPS",
          score: null,
          level: null,
          certificate: {},
          reason: `TLS connection failed: ${err?.message || "Network unreachable"}`,
          checkedAt: new Date().toISOString(),
        });
      });
    } catch (connectErr: any) {
      safeResolve({
        status: "UNAVAILABLE",
        protocol: "HTTPS",
        score: null,
        level: null,
        certificate: {},
        reason: `TLS socket initialization error: ${connectErr?.message || connectErr}`,
        checkedAt: new Date().toISOString(),
      });
    }
  });
}
