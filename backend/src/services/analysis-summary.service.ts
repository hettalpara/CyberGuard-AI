import { RiskEvaluation } from "./risk-score.service";
import { SslAnalysisResult } from "./ssl.service";
import { SafeBrowsingResult } from "./safe-browsing.service";
import { VirusTotalResult } from "./virustotal.service";

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
  safeBrowsing: SafeBrowsingResult;
  virusTotal: VirusTotalResult;
}): SummaryEvaluation {
  const { url, domain, risk, ssl, safeBrowsing, virusTotal } = params;

  let summary = "";
  let aiExplanation = "";
  const recommendedActions: string[] = [];

  const flaggedEngines = (virusTotal.maliciousCount || 0) + (virusTotal.suspiciousCount || 0);

  if (risk.riskLevel === "DANGEROUS") {
    summary = `High-risk indicators detected for ${domain}. Multiple security checks flagged this URL.`;
    aiExplanation = `Warning: This URL exhibits severe threat indicators characteristic of phishing, malware, or credential harvesting campaigns. ${
      safeBrowsing.threatDetected ? `Google Safe Browsing explicitly flagged this URL as ${safeBrowsing.threatType}. ` : ""
    }${
      flaggedEngines > 0 ? `${flaggedEngines} security vendors on VirusTotal classified this link as malicious or suspicious. ` : ""
    }Do NOT enter sensitive credentials, personal details, or OTPs on this website.`;

    recommendedActions.push("Do NOT open the link, download files, or submit login credentials.");
    recommendedActions.push("Immediately change passwords if you previously interacted with this portal.");
    recommendedActions.push("Report the incident to the official national cyber crime portal (cybercrime.gov.in) or CERT-In.");
    recommendedActions.push("Enable Multi-Factor Authentication (MFA / 2FA) across all critical accounts.");
  } else if (risk.riskLevel === "SUSPICIOUS") {
    summary = `Suspicious indicators identified for ${domain}. Exercise heightened caution.`;
    aiExplanation = `Caution: Security analysis identified potential anomalies associated with this URL. ${
      !ssl.valid ? "The website lacks a verified SSL certificate or uses an insecure configuration. " : ""
    }${
      flaggedEngines > 0 ? `${flaggedEngines} security engine(s) flagged this link on VirusTotal. ` : ""
    }Verify the authenticity of the sender or organization before interacting with this page.`;

    recommendedActions.push("Inspect the address bar carefully to confirm the exact spelling of the domain.");
    recommendedActions.push("Avoid downloading unverified attachments or providing financial information.");
    recommendedActions.push("Cross-check with the official organization through their verified support channels.");
  } else {
    summary = `No major threat indicators were detected for ${domain} across available security checks.`;
    aiExplanation = `Safe Domain: The analyzed URL appears consistent with legitimate web services. The domain possesses a valid SSL configuration. Zero threat matches were reported across Google Safe Browsing and VirusTotal intelligence feeds.`;

    recommendedActions.push("Domain verified clean across checked security databases.");
    recommendedActions.push("Always verify HTTPS lock and browser address bar before entering passwords.");
  }

  return {
    summary,
    aiExplanation,
    recommendedActions,
  };
}
