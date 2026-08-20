import { URL } from "node:url";

export interface UrlValidationResult {
  isValid: boolean;
  error?: string;
  normalizedUrl?: string;
  domain?: string;
  hostname?: string;
  protocol?: string;
}

// Private / internal IP ranges and hostname patterns for SSRF prevention
const PRIVATE_IP_PATTERNS = [
  /^localhost$/i,
  /^127\.\d{1,3}\.\d{1,3}\.\d{1,3}$/,
  /^0\.0\.0\.0$/,
  /^::1$/,
  /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/,
  /^192\.168\.\d{1,3}\.\d{1,3}$/,
  /^172\.(1[6-9]|2[0-9]|3[0-1])\.\d{1,3}\.\d{1,3}$/,
  /^169\.254\.\d{1,3}\.\d{1,3}$/, // Link-local / Cloud Metadata
  /^fc00:/i,
  /^fe80:/i,
  /\.local$/i,
  /\.internal$/i,
  /\.lan$/i,
];

const DISALLOWED_SCHEMES = ["javascript:", "data:", "file:", "ftp:", "blob:", "vbscript:", "mailto:"];

export function validateAndNormalizeUrl(rawUrl: string): UrlValidationResult {
  if (!rawUrl || typeof rawUrl !== "string" || rawUrl.trim() === "") {
    return { isValid: false, error: "URL is required and cannot be empty" };
  }

  let trimmed = rawUrl.trim();

  // Check for disallowed protocols
  const lowerTrimmed = trimmed.toLowerCase();
  for (const scheme of DISALLOWED_SCHEMES) {
    if (lowerTrimmed.startsWith(scheme)) {
      return { isValid: false, error: `Disallowed URL scheme: ${scheme}` };
    }
  }

  // Prepend https:// if no protocol is given
  if (!/^https?:\/\//i.test(trimmed)) {
    trimmed = `https://${trimmed}`;
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return { isValid: false, error: "Invalid or malformed URL structure" };
  }

  // Ensure protocol is strictly http or https
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return { isValid: false, error: "Only HTTP and HTTPS protocols are supported" };
  }

  const hostname = parsed.hostname.toLowerCase();

  // SSRF Protection: Check against private IPs & localhost
  for (const pattern of PRIVATE_IP_PATTERNS) {
    if (pattern.test(hostname)) {
      return { isValid: false, error: "Access to private or local network addresses is prohibited" };
    }
  }

  // Ensure hostname contains at least a valid dot (e.g. domain.tld) or valid public name
  if (!hostname.includes(".") && hostname !== "localhost") {
    return { isValid: false, error: "Invalid domain name in URL" };
  }

  // Extract domain (root domain / hostname)
  const domain = hostname.startsWith("www.") ? hostname.slice(4) : hostname;

  // Build normalized URL
  // Remove default port
  if ((parsed.protocol === "http:" && parsed.port === "80") || (parsed.protocol === "https:" && parsed.port === "443")) {
    parsed.port = "";
  }

  let normalizedUrl = parsed.toString();
  // If normalized URL ends with trailing slash on bare domain (e.g. https://example.com/), trim the trailing slash
  if (parsed.pathname === "/" && !parsed.search && !parsed.hash) {
    normalizedUrl = `${parsed.protocol}//${parsed.host}`;
  }

  return {
    isValid: true,
    normalizedUrl,
    domain,
    hostname,
    protocol: parsed.protocol,
  };
}
