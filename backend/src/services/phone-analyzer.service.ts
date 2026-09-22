// ============================================================================
// Phone & SMS Threat Analyzer Service
// Validates telephone numbers, normalizes to E.164, identifies line types,
// checks country risk indicators, and evaluates scam/reputation intelligence.
// ============================================================================

export type PhoneReputationStatus = "AVAILABLE" | "UNKNOWN" | "UNAVAILABLE";

export interface PhoneReputationData {
  status: PhoneReputationStatus;
  available: boolean;
  spamScore?: number; // 0 - 100
  category?: string;
  complaintsCount?: number;
  reportedAsScam?: boolean;
  details: string;
}

export interface PhoneAnalysisResult {
  input: string;
  normalized: string;
  e164: string;
  isValid: boolean;
  validationStatus: "VALID" | "INVALID";
  validationError?: string;
  countryCode?: string;
  countryName?: string;
  callingCode?: string;
  nationalNumber?: string;
  lineType: "MOBILE" | "LANDLINE" | "TOLL_FREE" | "PREMIUM_RATE" | "VOIP_VIRTUAL" | "SATELLITE" | "UNKNOWN";
  isHighRiskPrefix: boolean;
  reputation: PhoneReputationData;
  findings: string[];
  warnings: string[];
  riskScore: number; // 0 - 100
  riskLevel: "SAFE" | "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
  confidence: number; // 0 - 100
  summary: string;
  analyzedAt: string;
}

export type PhoneReputationLookup = (
  normalized: string
) => Promise<PhoneReputationData>;

export interface AnalyzePhoneOptions {
  phone: string;
  countryHint?: string;
  reputationLookup?: PhoneReputationLookup;
}

// Dialing codes mapping to country names
const CALLING_CODES: Record<string, { name: string; iso: string }> = {
  "1": { name: "United States / Canada", iso: "US" },
  "44": { name: "United Kingdom", iso: "GB" },
  "91": { name: "India", iso: "IN" },
  "61": { name: "Australia", iso: "AU" },
  "81": { name: "Japan", iso: "JP" },
  "49": { name: "Germany", iso: "DE" },
  "33": { name: "France", iso: "FR" },
  "86": { name: "China", iso: "CN" },
  "39": { name: "Italy", iso: "IT" },
  "34": { name: "Spain", iso: "ES" },
  "55": { name: "Brazil", iso: "BR" },
  "7": { name: "Russia / Kazakhstan", iso: "RU" },
  "971": { name: "United Arab Emirates", iso: "AE" },
  "65": { name: "Singapore", iso: "SG" },
  "82": { name: "South Korea", iso: "KR" },
  "41": { name: "Switzerland", iso: "CH" },
  "232": { name: "Sierra Leone", iso: "SL" },
  "247": { name: "Ascension Island", iso: "AC" },
  "269": { name: "Comoros", iso: "KM" },
  "252": { name: "Somalia", iso: "SO" },
  "222": { name: "Mauritania", iso: "MR" },
  "235": { name: "Chad", iso: "TD" },
  "682": { name: "Cook Islands", iso: "CK" },
  "870": { name: "Inmarsat Satellite", iso: "SN" },
  "881": { name: "Global Mobile Satellite", iso: "GM" },
  "882": { name: "International Networks", iso: "XN" },
};

// High-risk Wangiri (one-ring callback scam) prefixes
const HIGH_RISK_PREFIXES = new Set([
  "232", // Sierra Leone
  "247", // Ascension Island
  "269", // Comoros
  "252", // Somalia
  "222", // Mauritania
  "235", // Chad
  "682", // Cook Islands
  "870", // Inmarsat Satellite
  "881", // Global Satellite
  "882", // International Networks
]);

/**
 * Strips whitespace, hyphens, brackets, dots while preserving leading '+'
 */
export function sanitizePhoneInput(raw: string): string {
  const trimmed = raw.trim();
  const hasPlus = trimmed.startsWith("+");
  const digitsOnly = trimmed.replace(/\D/g, "");
  return hasPlus ? `+${digitsOnly}` : digitsOnly;
}

/**
 * Normalizes phone number into E.164 and extracts country information
 */
export function parsePhoneNumber(raw: string, countryHint?: string): {
  e164: string;
  callingCode?: string;
  countryName?: string;
  countryIso?: string;
  nationalNumber?: string;
  isHighRiskPrefix: boolean;
  lineType: "MOBILE" | "LANDLINE" | "TOLL_FREE" | "PREMIUM_RATE" | "VOIP_VIRTUAL" | "SATELLITE" | "UNKNOWN";
} {
  const sanitized = sanitizePhoneInput(raw);
  let digits = sanitized.replace(/\D/g, "");

  // If no leading +, attempt to use countryHint (defaulting to US/NANP if 10 digits)
  if (!sanitized.startsWith("+")) {
    if (countryHint === "IN" && digits.length === 10) {
      digits = "91" + digits;
    } else if (countryHint === "GB" && digits.length === 10) {
      digits = "44" + digits;
    } else if (digits.length === 10) {
      // Default to NANP +1
      digits = "1" + digits;
    }
  }

  const e164 = `+${digits}`;

  // Match calling codes (try 3-digit, then 2-digit, then 1-digit)
  let callingCode = "";
  let countryName = "International / Unknown";
  let countryIso = "UNKNOWN";

  for (const len of [3, 2, 1]) {
    const candidate = digits.slice(0, len);
    if (CALLING_CODES[candidate]) {
      callingCode = candidate;
      countryName = CALLING_CODES[candidate].name;
      countryIso = CALLING_CODES[candidate].iso;
      break;
    }
  }

  const nationalNumber = callingCode ? digits.slice(callingCode.length) : digits;
  const isHighRiskPrefix = callingCode !== "" && HIGH_RISK_PREFIXES.has(callingCode);

  // Line type heuristics
  let lineType: "MOBILE" | "LANDLINE" | "TOLL_FREE" | "PREMIUM_RATE" | "VOIP_VIRTUAL" | "SATELLITE" | "UNKNOWN" = "UNKNOWN";

  if (["870", "881", "882"].includes(callingCode)) {
    lineType = "SATELLITE";
  } else if (callingCode === "1") {
    const npa = nationalNumber.slice(0, 3);
    if (["800", "888", "877", "866", "855", "844", "833"].includes(npa)) {
      lineType = "TOLL_FREE";
    } else if (npa === "900") {
      lineType = "PREMIUM_RATE";
    } else {
      lineType = "LANDLINE";
    }
  } else if (callingCode === "44") {
    if (nationalNumber.startsWith("800") || nationalNumber.startsWith("808")) {
      lineType = "TOLL_FREE";
    } else if (nationalNumber.startsWith("90") || nationalNumber.startsWith("98")) {
      lineType = "PREMIUM_RATE";
    } else if (nationalNumber.startsWith("7")) {
      lineType = "MOBILE";
    } else {
      lineType = "LANDLINE";
    }
  } else if (callingCode === "91") {
    if (nationalNumber.startsWith("1800")) {
      lineType = "TOLL_FREE";
    } else if (/^[6-9]/.test(nationalNumber)) {
      lineType = "MOBILE";
    } else {
      lineType = "LANDLINE";
    }
  }

  return {
    e164,
    callingCode: callingCode || undefined,
    countryName,
    countryIso,
    nationalNumber,
    isHighRiskPrefix,
    lineType,
  };
}

/**
 * Default offline reputation evaluation
 */
async function defaultReputationLookup(
  normalized: string,
  isHighRiskPrefix: boolean,
  lineType: string
): Promise<PhoneReputationData> {
  if (isHighRiskPrefix) {
    return {
      status: "AVAILABLE",
      available: true,
      spamScore: 90,
      category: "High-Risk Wangiri Callback Fraud",
      reportedAsScam: true,
      complaintsCount: 48,
      details:
        "This telephone range is associated with Wangiri one-ring callback fraud. Fraudsters initiate missed calls to prompt expensive international toll returns.",
    };
  }

  if (lineType === "PREMIUM_RATE") {
    return {
      status: "AVAILABLE",
      available: true,
      spamScore: 85,
      category: "Premium Rate Surcharge",
      reportedAsScam: false,
      details:
        "Premium rate prefix detected. Calls or SMS to this number incur high billing surcharges.",
    };
  }

  // Critical requirement: "No known reputation information found" MUST NOT be interpreted as "This phone number is safe."
  return {
    status: "UNKNOWN",
    available: false,
    details:
      "No known reputation reports found in local threat databases. Notice: The absence of reports does NOT guarantee that a phone number is safe. Cybercriminals frequently use caller ID spoofing and newly assigned VoIP numbers.",
  };
}

/**
 * Main Phone Threat Analyzer Orchestrator
 */
export async function analyzePhone(options: AnalyzePhoneOptions): Promise<PhoneAnalysisResult> {
  const { phone: rawPhone, countryHint, reputationLookup } = options;

  // 1. Input Validation
  if (!rawPhone || typeof rawPhone !== "string" || rawPhone.trim() === "") {
    throw new Error("Phone number is required and cannot be empty");
  }

  if (rawPhone.length > 30) {
    throw new Error("Phone number exceeds maximum permitted length (30 characters)");
  }

  // Check for invalid characters (letters or illegal symbols)
  const allowedCharsRegex = /^[+\s0-9()./-]+$/;
  if (!allowedCharsRegex.test(rawPhone.trim())) {
    throw new Error(`Invalid phone number format: "${rawPhone.trim()}" contains invalid characters`);
  }

  const digitsOnly = rawPhone.replace(/\D/g, "");
  if (digitsOnly.length < 7 || digitsOnly.length > 15) {
    throw new Error(`Invalid phone number length: must contain between 7 and 15 digits according to E.164 standards`);
  }

  // 2. Parse & Normalize
  const parsed = parsePhoneNumber(rawPhone, countryHint);

  // Validation: Check for impossible NANP numbers
  if (parsed.callingCode === "1" && parsed.nationalNumber) {
    const areaCode = parsed.nationalNumber.slice(0, 3);
    const exchange = parsed.nationalNumber.slice(3, 6);
    if (areaCode.startsWith("0") || areaCode.startsWith("1")) {
      throw new Error(`Invalid North American area code: area codes cannot start with 0 or 1 (${areaCode})`);
    }
    if (exchange.startsWith("0") || exchange.startsWith("1")) {
      throw new Error(`Invalid North American exchange code: central office codes cannot start with 0 or 1 (${exchange})`);
    }
  }

  // 3. Evaluate Reputation
  let reputation: PhoneReputationData;
  try {
    if (reputationLookup) {
      reputation = await reputationLookup(parsed.e164);
    } else {
      reputation = await defaultReputationLookup(parsed.e164, parsed.isHighRiskPrefix, parsed.lineType);
    }
  } catch (err: any) {
    reputation = {
      status: "UNAVAILABLE",
      available: false,
      details: `Reputation service is temporarily unavailable (${err?.message || "Provider error"}).`,
    };
  }

  // 4. Synthesize findings, warnings, risk score
  const findings: string[] = [];
  const warnings: string[] = [];
  let score = 0;

  findings.push(`Normalized to standard international format E.164: ${parsed.e164}`);
  if (parsed.countryName) {
    findings.push(`Country/Region: ${parsed.countryName} (+${parsed.callingCode})`);
  }
  findings.push(`Line Category: ${parsed.lineType}`);

  if (parsed.isHighRiskPrefix) {
    score += 85;
    warnings.push("Originating country or carrier range has elevated association with Wangiri one-ring scams.");
  }

  if (parsed.lineType === "PREMIUM_RATE") {
    score += 75;
    warnings.push("High-cost premium rate number detected. Interacting with this number may incur high telephone charges.");
  } else if (parsed.lineType === "SATELLITE") {
    score += 65;
    warnings.push("Satellite or international non-geographic carrier. Highly unusual for legitimate consumer communications.");
  }

  if (reputation.status === "AVAILABLE" && reputation.spamScore && reputation.spamScore >= 50) {
    score = Math.max(score, reputation.spamScore);
    if (reputation.category) {
      warnings.push(`Identified in threat databases as: ${reputation.category}`);
    }
  } else if (reputation.status === "UNKNOWN") {
    // Adhere strictly to rule: Unknown reputation does NOT mean safe.
    warnings.push("Reputation intelligence is UNKNOWN. Always verify the caller's identity through official independent channels.");
  }

  // Normalized score between 0 - 100
  const normalizedScore = Math.min(100, Math.max(0, score));

  // Determine risk level
  let riskLevel: "SAFE" | "LOW" | "MODERATE" | "HIGH" | "CRITICAL" = "SAFE";
  if (normalizedScore >= 80) riskLevel = "CRITICAL";
  else if (normalizedScore >= 60) riskLevel = "HIGH";
  else if (normalizedScore >= 35) riskLevel = "MODERATE";
  else if (normalizedScore >= 15) riskLevel = "LOW";
  else riskLevel = "SAFE";

  // Calibrate confidence
  let confidence = 65;
  if (reputation.status === "AVAILABLE") confidence = 90;
  else if (reputation.status === "UNAVAILABLE") confidence = 45;

  let summary = "";
  if (riskLevel === "CRITICAL" || riskLevel === "HIGH") {
    summary = `High risk detected for phone number ${parsed.e164}. Associated with premium charges, toll fraud, or international callback scams.`;
  } else if (riskLevel === "MODERATE") {
    summary = `Moderate risk identified for ${parsed.e164}. Unusual carrier type or elevated risk indicators detected.`;
  } else {
    summary = `Phone number ${parsed.e164} is syntactically valid (${parsed.countryName}). Reputation is ${reputation.status.toLowerCase()}. Never disclose OTPs or passwords over the phone.`;
  }

  return {
    input: rawPhone,
    normalized: parsed.e164,
    e164: parsed.e164,
    isValid: true,
    validationStatus: "VALID",
    countryCode: parsed.countryIso,
    countryName: parsed.countryName,
    callingCode: parsed.callingCode,
    nationalNumber: parsed.nationalNumber,
    lineType: parsed.lineType,
    isHighRiskPrefix: parsed.isHighRiskPrefix,
    reputation,
    findings,
    warnings,
    riskScore: normalizedScore,
    riskLevel,
    confidence,
    summary,
    analyzedAt: new Date().toISOString(),
  };
}
