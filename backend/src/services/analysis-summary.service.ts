import { RiskEvaluation } from "./risk-score.service";
import { SslAnalysisResult } from "./ssl.service";
import { VirusTotalResult } from "./virustotal.service";
import { SafeBrowsingResult } from "./safe-browsing.service";
import { UrlhausResult } from "./threat-intelligence/urlhaus.service";

export interface SummaryEvaluation {
  summary: string;
  aiExplanation: string;
  recommendedActions: string[];
}

export function generateAnalysisSummary(params: {
  url: string;
  domain: string;
  risk: RiskEvaluation;
  ssl: SslAnalysisResult;
  safeBrowsing?: SafeBrowsingResult;
  virusTotal: VirusTotalResult;
  urlhaus?: UrlhausResult;
}): SummaryEvaluation {
  const { url, domain, risk, ssl, safeBrowsing, virusTotal, urlhaus } = params;

  // Handle inconclusive or limited state
  if (risk.level === "INCONCLUSIVE" || risk.analysisStatus === "INSUFFICIENT_DATA") {
    return {
      summary: "Insufficient security signals were available to determine the risk of this URL. Please try again later.",
      aiExplanation: "External threat intelligence services and local inspection checks were unavailable. Insufficient security signals were present to reliably determine risk.",
      recommendedActions: [
        "Please try analyzing this URL again in a few moments.",
        "Avoid submitting credentials or downloading files until security posture can be confirmed.",
      ],
    };
  }

  if (risk.analysisStatus === "LIMITED") {
    const limitedActions = [
      "Treat this result as a preliminary heuristic assessment.",
      "Exercise caution as external threat intelligence databases were temporarily unavailable.",
    ];
    if (risk.level === "CRITICAL" || risk.level === "HIGH") {
      limitedActions.unshift("Do NOT open the link or submit login credentials.");
    }
    return {
      summary: "External threat intelligence services were unavailable. This result is based on local URL and SSL/TLS analysis.",
      aiExplanation: `Note: External threat intelligence services were unavailable. This result is based on local URL and SSL/TLS analysis. Assessed risk tier is ${risk.level} (${risk.score ?? 0}/100).`,
      recommendedActions: limitedActions,
    };
  }

  let summary = "";
  let aiExplanation = "";
  const recommendedActions: string[] = [];

  const flaggedEngines = (virusTotal.maliciousCount || 0) + (virusTotal.suspiciousCount || 0);

  // Authoritative risk level tiers
  const isDangerous = risk.level === "CRITICAL" || risk.level === "HIGH";
  const isSuspicious = risk.level === "MODERATE" || risk.level === "LOW";

  if (isDangerous) {
    summary = `High-risk indicators detected for ${domain}. Multiple security checks flagged this URL.`;

    const threatNotes: string[] = [];
    if (safeBrowsing?.threatDetected) {
      threatNotes.push(
        `Google Safe Browsing identified this URL on an unsafe-resource list (${safeBrowsing.threatTypes.join(", ")}).`
      );
    }
    if (urlhaus?.match) {
      threatNotes.push(
        `URLhaus identified this destination as an active malware distribution source (${urlhaus.threatType || "malware"}).`
      );
    }
    if (flaggedEngines > 0) {
      threatNotes.push(
        `${flaggedEngines} security vendors on VirusTotal classified this link as malicious or suspicious.`
      );
    }

    aiExplanation = `Warning: This URL exhibits severe threat indicators characteristic of phishing, malware, or credential harvesting campaigns. ${
      threatNotes.length > 0 ? threatNotes.join(" ") + " " : ""
    }Do NOT enter sensitive credentials, personal details, or OTPs on this website.`;

    recommendedActions.push("Do NOT open the link, download files, or submit login credentials.");
    recommendedActions.push("Immediately change passwords if you previously interacted with this portal.");
    recommendedActions.push("Report the incident to the official national cyber crime portal (cybercrime.gov.in) or CERT-In.");
    recommendedActions.push("Enable Multi-Factor Authentication (MFA / 2FA) across all critical accounts.");
  } else if (isSuspicious) {
    summary = `Suspicious indicators identified for ${domain}. Exercise heightened caution.`;

    const notes: string[] = [];
    if (!ssl.valid) {
      notes.push("The website lacks a verified SSL certificate or uses plain unencrypted HTTP.");
    }
    if (flaggedEngines > 0) {
      notes.push(`${flaggedEngines} security engine(s) flagged this link on VirusTotal.`);
    }

    aiExplanation = `Caution: Security analysis identified potential anomalies associated with this URL. ${
      notes.length > 0 ? notes.join(" ") + " " : ""
    }Verify the authenticity of the sender or organization before interacting with this page.`;

    recommendedActions.push("Inspect the address bar carefully to confirm the exact spelling of the domain.");
    recommendedActions.push("Avoid downloading unverified attachments or providing financial information.");
    recommendedActions.push("Cross-check with the official organization through their verified support channels.");
  } else {
    summary = `No major threat indicators were detected for ${domain} across available security checks.`;

    const sbNote =
      safeBrowsing && safeBrowsing.available && safeBrowsing.status === "CHECKED_NO_THREAT"
        ? "Google Safe Browsing reported zero threat matches."
        : "Google Safe Browsing was not available.";

    const uhNote =
      urlhaus && urlhaus.available && urlhaus.status === "CHECKED_NO_MATCH"
        ? "URLhaus reported zero malware matches."
        : "URLhaus was not available.";

    const vtNote = virusTotal.available
      ? "VirusTotal multi-engine feeds reported zero detections."
      : "VirusTotal was not available.";

    aiExplanation = `Safe Domain: The analyzed URL appears consistent with legitimate web services. The domain possesses a valid SSL configuration. ${sbNote} ${uhNote} ${vtNote}`;

    recommendedActions.push("Domain verified clean across checked security databases.");
    recommendedActions.push("Always verify HTTPS lock and browser address bar before entering passwords.");
  }

  return {
    summary,
    aiExplanation,
    recommendedActions,
  };
}
