// ============================================================================
// Email Threat Analyzer Service
// Analyzes email addresses and RFC 2822 headers for spoofing, authentication
// postures (SPF, DKIM, DMARC), domain legitimacy, and phishing indicators.
// ============================================================================

import dns from "node:dns/promises";

export type AuthStatus = "PASS" | "FAIL" | "MISSING" | "UNKNOWN";

export interface EmailHeaderMismatch {
  type: string;
  description: string;
  severity: "LOW" | "MEDIUM" | "HIGH";
}

export interface EmailHeaderAnalysis {
  from?: string;
  fromDomain?: string;
  replyTo?: string;
  replyToDomain?: string;
  returnPath?: string;
  returnPathDomain?: string;
  subject?: string;
  messageId?: string;
  date?: string;
  mismatches: EmailHeaderMismatch[];
  headersPresent: string[];
}

export interface EmailAuthCheck {
  status: AuthStatus;
  record?: string;
  details: string;
  mechanism?: string;
}

export interface EmailAnalysisResult {
  input: string;
  email: string;
  localPart: string;
  domain: string;
  isValidFormat: boolean;
  validationStatus: "VALID" | "INVALID";
  validationError?: string;
  spf: EmailAuthCheck;
  dkim: EmailAuthCheck;
  dmarc: EmailAuthCheck;
  headers?: EmailHeaderAnalysis;
  domainInfo: {
    domain: string;
    hasMx: boolean;
    isPunycode: boolean;
    isFreeProvider: boolean;
    isDisposable: boolean;
  };
  findings: string[];
  warnings: string[];
  riskScore: number; // 0 - 100
  riskLevel: "SAFE" | "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
  confidence: number; // 0 - 100
  summary: string;
  analyzedAt: string;
}

export interface DnsResolver {
  resolveTxt: (hostname: string) => Promise<string[][]>;
  resolveMx?: (hostname: string) => Promise<Array<{ exchange: string; priority: number }>>;
}

export interface AnalyzeEmailOptions {
  email: string;
  headers?: string;
  dnsResolver?: DnsResolver;
}

// Common free email providers
const FREE_EMAIL_PROVIDERS = new Set([
  "gmail.com",
  "googlemail.com",
  "yahoo.com",
  "yahoo.co.uk",
  "hotmail.com",
  "outlook.com",
  "live.com",
  "msn.com",
  "aol.com",
  "icloud.com",
  "me.com",
  "mail.com",
  "proton.me",
  "protonmail.com",
  "zoho.com",
  "yandex.com",
  "gmx.com",
]);

// Common temporary/disposable email providers
const DISPOSABLE_EMAIL_PROVIDERS = new Set([
  "mailinator.com",
  "tempmail.com",
  "10minutemail.com",
  "guerrillamail.com",
  "sharklasers.com",
  "throwawaymail.com",
  "dispostable.com",
  "trashmail.com",
  "yopmail.com",
]);

// Brand keywords often spoofed in local-parts of free webmail accounts
const INSTITUTION_KEYWORDS = [
  "support",
  "security",
  "billing",
  "account",
  "verify",
  "verification",
  "update",
  "service",
  "paypal",
  "apple",
  "microsoft",
  "amazon",
  "netflix",
  "bank",
  "chase",
  "wellsfargo",
  "citibank",
  "irs",
];

// RFC 5322 simplified email regex validation
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

/**
 * Extracts raw email address from potential display name format (e.g. "John Doe <john@example.com>")
 */
export function extractEmailAddress(raw: string): string {
  const angleMatch = raw.match(/<([^>]+)>/);
  if (angleMatch && angleMatch[1]) {
    return angleMatch[1].trim();
  }
  return raw.trim();
}

/**
 * Parses raw RFC 2822 email headers into a normalized key-value map.
 * Handles multiline folded headers.
 */
export function parseEmailHeaders(rawHeaders: string): Map<string, string> {
  const headerMap = new Map<string, string>();
  const lines = rawHeaders.split(/\r?\n/);
  let currentKey = "";
  let currentValue = "";

  for (const line of lines) {
    if (/^\s+/.test(line)) {
      // Continuation line (folding)
      if (currentKey) {
        currentValue += " " + line.trim();
        headerMap.set(currentKey, currentValue);
      }
    } else {
      const colonIdx = line.indexOf(":");
      if (colonIdx > 0) {
        currentKey = line.slice(0, colonIdx).trim().toLowerCase();
        currentValue = line.slice(colonIdx + 1).trim();
        headerMap.set(currentKey, currentValue);
      }
    }
  }

  return headerMap;
}

/**
 * Evaluates SPF records via DNS TXT lookup.
 */
async function checkSpf(
  domain: string,
  resolver: DnsResolver,
  headerSpf?: string
): Promise<EmailAuthCheck> {
  // If headers contain explicit SPF results
  if (headerSpf) {
    const lower = headerSpf.toLowerCase();
    if (lower.includes("pass")) {
      return {
        status: "PASS",
        details: "SPF verified as PASS in email Authentication-Results / Received-SPF headers.",
      };
    }
    if (lower.includes("fail") || lower.includes("softfail")) {
      return {
        status: "FAIL",
        details: "SPF check failed in email headers: sending host is not permitted by domain.",
      };
    }
  }

  try {
    const txtRecords = await resolver.resolveTxt(domain);
    const flattened = txtRecords.map((r) => r.join(""));
    const spfRecord = flattened.find((r) => r.toLowerCase().startsWith("v=spf1"));

    if (!spfRecord) {
      return {
        status: "MISSING",
        details:
          "No SPF (Sender Policy Framework) record found for domain. This leaves the domain vulnerable to unauthorized spoofing, but does not inherently mean this email is malicious.",
      };
    }

    const lowerRecord = spfRecord.toLowerCase();
    const hasStrictFail = lowerRecord.includes("-all");
    const hasSoftFail = lowerRecord.includes("~all");
    const hasNeutralOrPass = lowerRecord.includes("?all") || lowerRecord.includes("+all");

    let mechanism = "all";
    if (hasStrictFail) mechanism = "-all (HardFail)";
    else if (hasSoftFail) mechanism = "~all (SoftFail)";
    else if (hasNeutralOrPass) mechanism = "?all (Neutral/PassAll)";

    return {
      status: "PASS",
      record: spfRecord,
      mechanism,
      details: `Valid SPF record found (${mechanism}). Designated mail servers are authorized to send email for ${domain}.`,
    };
  } catch (err: any) {
    const code = err?.code || "";
    if (code === "ENOTFOUND" || code === "ENODATA" || code === "NODATA") {
      return {
        status: "MISSING",
        details:
          "No SPF TXT record returned for this domain. Anti-spoofing protection is not published.",
      };
    }
    return {
      status: "UNKNOWN",
      details: `Unable to query DNS for SPF records (${err?.message || "DNS timeout"}).`,
    };
  }
}

/**
 * Evaluates DMARC records via DNS TXT lookup at _dmarc.<domain>.
 */
async function checkDmarc(domain: string, resolver: DnsResolver): Promise<EmailAuthCheck> {
  const dmarcHostname = `_dmarc.${domain}`;
  try {
    const txtRecords = await resolver.resolveTxt(dmarcHostname);
    const flattened = txtRecords.map((r) => r.join(""));
    const dmarcRecord = flattened.find((r) => r.toLowerCase().startsWith("v=dmarc1"));

    if (!dmarcRecord) {
      return {
        status: "MISSING",
        details:
          "No DMARC record found at _dmarc." +
          domain +
          ". The domain owner has not published a DMARC policy. This represents a security gap, but is not conclusive proof of malicious intent.",
      };
    }

    // Extract policy
    const policyMatch = dmarcRecord.match(/p=([^;\s]+)/i);
    const policy = policyMatch ? policyMatch[1].toLowerCase() : "unknown";

    return {
      status: "PASS",
      record: dmarcRecord,
      mechanism: `p=${policy}`,
      details: `Valid DMARC policy found (policy: p=${policy}). Receiver handling is instructed for unauthenticated messages.`,
    };
  } catch (err: any) {
    const code = err?.code || "";
    if (code === "ENOTFOUND" || code === "ENODATA" || code === "NODATA") {
      return {
        status: "MISSING",
        details: `No DMARC record found for ${domain}. Protection against domain impersonation is missing.`,
      };
    }
    return {
      status: "UNKNOWN",
      details: `Unable to query DMARC DNS record (${err?.message || "DNS error"}).`,
    };
  }
}

/**
 * Checks DKIM from headers or marks missing/unknown.
 */
function checkDkim(headers?: Map<string, string>): EmailAuthCheck {
  if (!headers || headers.size === 0) {
    return {
      status: "UNKNOWN",
      details:
        "DKIM cryptographic verification requires raw email headers containing DKIM-Signature or Authentication-Results.",
    };
  }

  const authResults = headers.get("authentication-results") || "";
  const dkimSig = headers.get("dkim-signature");

  if (authResults) {
    const lowerAuth = authResults.toLowerCase();
    if (lowerAuth.includes("dkim=pass")) {
      return {
        status: "PASS",
        details: "DKIM signature validated successfully in message Authentication-Results.",
      };
    }
    if (lowerAuth.includes("dkim=fail")) {
      return {
        status: "FAIL",
        details: "DKIM signature verification failed. Message body or headers may have been tampered with in transit.",
      };
    }
  }

  if (dkimSig) {
    return {
      status: "PASS",
      record: dkimSig.slice(0, 80) + "...",
      details: "DKIM-Signature header is present on the message, indicating cryptographic sender signing.",
    };
  }

  return {
    status: "MISSING",
    details: "No DKIM signature or DKIM authentication results found in email headers.",
  };
}

/**
 * Inspects parsed headers for mismatches and anomalies.
 */
function analyzeHeaders(headers: Map<string, string>): EmailHeaderAnalysis {
  const mismatches: EmailHeaderMismatch[] = [];
  const from = headers.get("from");
  const replyTo = headers.get("reply-to");
  const returnPath = headers.get("return-path");
  const subject = headers.get("subject");
  const messageId = headers.get("message-id");
  const date = headers.get("date");

  const fromEmail = from ? extractEmailAddress(from) : "";
  const replyToEmail = replyTo ? extractEmailAddress(replyTo) : "";
  const returnPathEmail = returnPath ? extractEmailAddress(returnPath) : "";

  const fromDomain = fromEmail.split("@")[1]?.toLowerCase();
  const replyToDomain = replyToEmail.split("@")[1]?.toLowerCase();
  const returnPathDomain = returnPathEmail.split("@")[1]?.toLowerCase();

  // 1. From vs Reply-To mismatch
  if (fromDomain && replyToDomain && fromDomain !== replyToDomain) {
    mismatches.push({
      type: "FROM_REPLYTO_MISMATCH",
      description: `Sender From domain (${fromDomain}) does not match Reply-To domain (${replyToDomain}). Replies will be sent to a different address.`,
      severity: "HIGH",
    });
  }

  // 2. From vs Return-Path mismatch
  if (fromDomain && returnPathDomain && fromDomain !== returnPathDomain) {
    // Only flag if not on common ESP bounce domains (e.g. sendgrid, mailchimp)
    const isEspBounce = returnPathDomain.includes("sendgrid") || returnPathDomain.includes("mailchimp") || returnPathDomain.includes("amazonses");
    mismatches.push({
      type: "FROM_RETURNPATH_MISMATCH",
      description: `Return-Path envelope domain (${returnPathDomain}) differs from From header domain (${fromDomain}).${isEspBounce ? " (Common with bulk mailing providers)." : ""}`,
      severity: isEspBounce ? "LOW" : "MEDIUM",
    });
  }

  // 3. Message-ID format check
  if (messageId && !messageId.includes("@")) {
    mismatches.push({
      type: "ANOMALOUS_MESSAGE_ID",
      description: "Message-ID header does not conform to RFC standards (missing domain component).",
      severity: "LOW",
    });
  }

  return {
    from,
    fromDomain,
    replyTo,
    replyToDomain,
    returnPath,
    returnPathDomain,
    subject,
    messageId,
    date,
    mismatches,
    headersPresent: Array.from(headers.keys()),
  };
}

/**
 * Main Email Threat Analyzer Orchestrator
 */
export async function analyzeEmail(options: AnalyzeEmailOptions): Promise<EmailAnalysisResult> {
  const { email: rawEmail, headers: rawHeaders, dnsResolver } = options;
  const resolver: DnsResolver = dnsResolver || {
    resolveTxt: (host: string) => dns.resolveTxt(host),
    resolveMx: (host: string) => dns.resolveMx(host),
  };

  // 1. Input Validation
  if (!rawEmail || typeof rawEmail !== "string" || rawEmail.trim() === "") {
    throw new Error("Email address is required and cannot be empty");
  }

  if (rawEmail.length > 320) {
    throw new Error("Email address exceeds maximum permitted length (320 characters)");
  }

  if (rawHeaders && rawHeaders.length > 100 * 1024) {
    throw new Error("Headers exceed maximum permitted length (100KB)");
  }

  const cleanEmail = extractEmailAddress(rawEmail);
  const isValidFormat = EMAIL_REGEX.test(cleanEmail);

  if (!isValidFormat) {
    throw new Error(`Invalid email address format: "${cleanEmail}"`);
  }

  const [localPart, domain] = cleanEmail.split("@");
  const lowerDomain = domain.toLowerCase();

  // 2. Parse headers if provided
  let headerAnalysis: EmailHeaderAnalysis | undefined;
  let parsedHeaders: Map<string, string> | undefined;

  if (rawHeaders && rawHeaders.trim() !== "") {
    parsedHeaders = parseEmailHeaders(rawHeaders);
    headerAnalysis = analyzeHeaders(parsedHeaders);
  }

  // 3. Domain checks
  const isPunycode = lowerDomain.startsWith("xn--") || /[^\u0000-\u007F]/.test(lowerDomain);
  const isFreeProvider = FREE_EMAIL_PROVIDERS.has(lowerDomain);
  const isDisposable = DISPOSABLE_EMAIL_PROVIDERS.has(lowerDomain);

  let hasMx = false;
  try {
    if (resolver.resolveMx) {
      const mxRecords = await resolver.resolveMx(lowerDomain);
      hasMx = mxRecords && mxRecords.length > 0;
    } else {
      hasMx = true;
    }
  } catch {
    hasMx = false;
  }

  // 4. Authentication checks (SPF, DKIM, DMARC)
  const headerSpf = parsedHeaders?.get("received-spf") || parsedHeaders?.get("authentication-results");
  const spf = await checkSpf(lowerDomain, resolver, headerSpf);
  const dkim = checkDkim(parsedHeaders);
  const dmarc = await checkDmarc(lowerDomain, resolver);

  // 5. Synthesize findings, warnings, and risk score
  const findings: string[] = [];
  const warnings: string[] = [];
  let score = 0;

  // Domain checks
  if (isPunycode) {
    score += 40;
    warnings.push("Domain uses Punycode or non-ASCII characters, frequently employed in homograph spoofing attacks.");
  }

  if (isDisposable) {
    score += 35;
    warnings.push("Email belongs to a temporary or disposable email service.");
  }

  if (!hasMx) {
    score += 25;
    warnings.push("Domain has no valid MX (Mail Exchanger) records published in DNS.");
  }

  // Free provider pretending to be a bank/institution
  if (isFreeProvider) {
    findings.push(`Domain (${lowerDomain}) is a recognized free public email provider.`);
    const lowerLocal = localPart.toLowerCase();
    const hasBrandKeyword = INSTITUTION_KEYWORDS.some((kw) => lowerLocal.includes(kw));
    if (hasBrandKeyword) {
      score += 45;
      warnings.push(`Sender username "${localPart}" contains corporate or financial keywords on a free webmail domain, indicating potential social engineering.`);
    }
  }

  // Header mismatches
  if (headerAnalysis && headerAnalysis.mismatches.length > 0) {
    for (const m of headerAnalysis.mismatches) {
      if (m.severity === "HIGH") score += 35;
      else if (m.severity === "MEDIUM") score += 15;
      else score += 5;
      warnings.push(m.description);
    }
  }

  // Authentication: SPF, DKIM, DMARC
  // NOTE: Per requirement: Do NOT say an email is malicious only because SPF/DKIM/DMARC is missing.
  // Missing records are reported as security weaknesses with mild penalty.
  if (spf.status === "FAIL") {
    score += 30;
    warnings.push("SPF authentication FAILED for the sender domain.");
  } else if (spf.status === "MISSING") {
    score += 10;
    warnings.push("SPF record is MISSING on the sender domain (weakness: domain lacks sender authorization).");
  } else if (spf.status === "PASS") {
    findings.push("SPF authentication PASSED.");
  }

  if (dkim.status === "FAIL") {
    score += 30;
    warnings.push("DKIM cryptographic signature check FAILED.");
  } else if (dkim.status === "MISSING") {
    score += 5;
    findings.push("DKIM signature is MISSING in headers.");
  } else if (dkim.status === "PASS") {
    findings.push("DKIM cryptographic signature PASSED.");
  }

  if (dmarc.status === "FAIL") {
    score += 30;
    warnings.push("DMARC alignment or policy evaluation FAILED.");
  } else if (dmarc.status === "MISSING") {
    score += 10;
    warnings.push("DMARC record is MISSING on the sender domain (weakness: no domain spoofing protection policy).");
  } else if (dmarc.status === "PASS") {
    findings.push("DMARC policy alignment PASSED.");
  }

  // Cap score between 0 and 100
  const normalizedScore = Math.min(100, Math.max(0, score));

  // Determine risk level
  let riskLevel: "SAFE" | "LOW" | "MODERATE" | "HIGH" | "CRITICAL" = "SAFE";
  if (normalizedScore >= 80) riskLevel = "CRITICAL";
  else if (normalizedScore >= 60) riskLevel = "HIGH";
  else if (normalizedScore >= 35) riskLevel = "MODERATE";
  else if (normalizedScore >= 15) riskLevel = "LOW";
  else riskLevel = "SAFE";

  // Calculate confidence based on available data
  let confidence = 70;
  if (rawHeaders) confidence += 20;
  if (spf.status !== "UNKNOWN" && dmarc.status !== "UNKNOWN") confidence += 10;
  confidence = Math.min(100, confidence);

  // Generate summary
  let summary = "";
  if (riskLevel === "CRITICAL" || riskLevel === "HIGH") {
    summary = `High threat email indicators detected for ${cleanEmail}. Noticeable authentication failures, deceptive identity, or header mismatches found.`;
  } else if (riskLevel === "MODERATE") {
    summary = `Moderate risk identified for ${cleanEmail}. The email domain exhibits security posture gaps (such as missing SPF/DMARC) or questionable sender patterns.`;
  } else if (riskLevel === "LOW") {
    summary = `Low risk. ${cleanEmail} is formatted correctly with mild security gaps, but no active spoofing or malicious indicators.`;
  } else {
    summary = `${cleanEmail} verified with strong security posture and valid sender authentication records.`;
  }

  return {
    input: rawEmail,
    email: cleanEmail,
    localPart,
    domain: lowerDomain,
    isValidFormat: true,
    validationStatus: "VALID",
    spf,
    dkim,
    dmarc,
    headers: headerAnalysis,
    domainInfo: {
      domain: lowerDomain,
      hasMx,
      isPunycode,
      isFreeProvider,
      isDisposable,
    },
    findings,
    warnings,
    riskScore: normalizedScore,
    riskLevel,
    confidence,
    summary,
    analyzedAt: new Date().toISOString(),
  };
}
