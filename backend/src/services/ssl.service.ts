import tls from "node:tls";

export interface SslAnalysisResult {
  enabled: boolean;
  valid: boolean;
  status: "valid" | "invalid" | "expired" | "self_signed" | "unavailable";
  issuer?: string;
  validDaysRemaining?: number;
  protocol?: string;
}

export async function analyzeSsl(hostname: string, isHttps: boolean): Promise<SslAnalysisResult> {
  if (!isHttps) {
    return {
      enabled: false,
      valid: false,
      status: "unavailable",
      issuer: "No SSL (HTTP Only)",
      validDaysRemaining: 0,
    };
  }

  return new Promise<SslAnalysisResult>((resolve) => {
    let isSettled = false;
    const safeResolve = (res: SslAnalysisResult) => {
      if (!isSettled) {
        isSettled = true;
        clearTimeout(timer);
        resolve(res);
      }
    };

    let socket: tls.TLSSocket;

    const timer = setTimeout(() => {
      try {
        if (socket) socket.destroy();
      } catch {
        // ignore
      }
      safeResolve({
        enabled: isHttps,
        valid: false,
        status: "unavailable",
        issuer: "SSL check timed out after 5000ms",
      });
    }, 5000);

    try {
      socket = tls.connect(
        {
          host: hostname,
          port: 443,
          servername: hostname,
          rejectUnauthorized: false,
          timeout: 5000,
        },
        () => {
          try {
            const cert = socket.getPeerCertificate();
            const authorized = socket.authorized;
            const authorizationError = socket.authorizationError;

            if (!cert || Object.keys(cert).length === 0) {
              socket.destroy();
              return safeResolve({
                enabled: true,
                valid: false,
                status: "unavailable",
                issuer: "Unable to retrieve certificate details",
              });
            }

            let issuerName = "Unknown CA";
            if (cert.issuer) {
              const rawIssuer = cert.issuer.O || cert.issuer.CN || cert.issuer.OU;
              if (Array.isArray(rawIssuer)) {
                issuerName = rawIssuer.join(" ");
              } else if (rawIssuer) {
                issuerName = String(rawIssuer);
              } else {
                issuerName = "Certificate Authority";
              }
            }

            let validDaysRemaining = 0;
            let isExpired = false;

            if (cert.valid_to) {
              const expiryDate = new Date(cert.valid_to);
              const now = new Date();
              const diffMs = expiryDate.getTime() - now.getTime();
              validDaysRemaining = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
              if (diffMs <= 0) {
                isExpired = true;
              }
            }

            let status: "valid" | "invalid" | "expired" | "self_signed" | "unavailable" = "valid";
            if (isExpired) {
              status = "expired";
            } else if (!authorized) {
              const errStr = authorizationError ? String(authorizationError) : "";
              if (errStr.includes("SELF_SIGNED") || errStr.includes("self signed")) {
                status = "self_signed";
              } else {
                status = "invalid";
              }
            }

            socket.destroy();
            return safeResolve({
              enabled: true,
              valid: authorized && !isExpired,
              status,
              issuer: issuerName,
              validDaysRemaining,
              protocol: socket.getProtocol() || "TLS",
            });
          } catch {
            socket.destroy();
            return safeResolve({
              enabled: true,
              valid: false,
              status: "unavailable",
              issuer: "Certificate inspection error",
            });
          }
        }
      );

      socket.on("timeout", () => {
        socket.destroy();
        return safeResolve({
          enabled: true,
          valid: false,
          status: "unavailable",
          issuer: "Connection timed out",
        });
      });

      socket.on("error", (err) => {
        socket.destroy();
        return safeResolve({
          enabled: isHttps,
          valid: false,
          status: "invalid",
          issuer: err.message || "SSL Handshake Failed",
        });
      });
    } catch {
      safeResolve({
        enabled: isHttps,
        valid: false,
        status: "unavailable",
        issuer: "SSL connection initialization error",
      });
    }
  });
}
