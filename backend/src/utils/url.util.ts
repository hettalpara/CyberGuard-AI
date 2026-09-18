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

  // Check for bare scheme without host (e.g. http:// or https://)
  if (/^https?:\/\/\s*$/i.test(trimmed)) {
    return { isValid: false, error: "Invalid or malformed URL structure" };
  }

  // Check for other explicit schemes (e.g. malformed://)
  const schemeMatch = trimmed.match(/^([a-zA-Z][a-zA-Z0-9+.-]*):/);
  if (schemeMatch) {
    const scheme = schemeMatch[1].toLowerCase();
    if (scheme !== "http" && scheme !== "https") {
      return { isValid: false, error: "Only HTTP and HTTPS protocols are supported" };
    }
  }

  // Prepend https:// if no protocol is given
  if (!/^https?:\/\//i.test(trimmed)) {
    trimmed = `https://${trimmed}`;
  }

  let protocol = "";
  let hostname = "";
  let port = "";
  let pathname = "/";
  let search = "";
  let hash = "";

  try {
    const parsed = new URL(trimmed);
    protocol = parsed.protocol;
    hostname = parsed.hostname.toLowerCase();
    port = parsed.port;
    pathname = parsed.pathname;
    search = parsed.search;
    hash = parsed.hash;
  } catch {
    // Robust fallback for punycode / IDN domains that Node's strict WHATWG URL parser rejects
    const urlRegex = /^(https?):\/\/([^/?#:]+)(?::(\d+))?(\/[^?#]*)?(\?[^#]*)?(#.*)?$/i;
    const match = trimmed.match(urlRegex);
    if (!match) {
      return { isValid: false, error: "Invalid or malformed URL structure" };
    }
    protocol = match[1].toLowerCase() + ":";
    hostname = match[2].toLowerCase();
    port = match[3] || "";
    pathname = match[4] || "/";
    search = match[5] || "";
    hash = match[6] || "";
  }

  // Ensure protocol is strictly http or https
  if (protocol !== "http:" && protocol !== "https:") {
    return { isValid: false, error: "Only HTTP and HTTPS protocols are supported" };
  }

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

  // Validate hostname labels (supports alphanumeric, hyphens, and xn-- punycode IDN labels)
  const labels = hostname.split(".");
  const labelRegex = /^(?:xn--[a-zA-Z0-9-_]+|[a-zA-Z0-9](?:[a-zA-Z0-9-_]*[a-zA-Z0-9])?)$/i;
  for (const label of labels) {
    if (!label || label.length > 63 || !labelRegex.test(label)) {
      return { isValid: false, error: "Invalid domain name in URL" };
    }
  }

  // Extract domain (root domain / hostname)
  const domain = hostname.startsWith("www.") ? hostname.slice(4) : hostname;

  // Remove default port
  if ((protocol === "http:" && port === "80") || (protocol === "https:" && port === "443")) {
    port = "";
  }

  const hostWithPort = port ? `${hostname}:${port}` : hostname;
  let normalizedUrl = `${protocol}//${hostWithPort}${pathname}${search}${hash}`;
  // If normalized URL ends with trailing slash on bare domain, trim trailing slash
  if (pathname === "/" && !search && !hash) {
    normalizedUrl = `${protocol}//${hostWithPort}`;
  }

  return {
    isValid: true,
    normalizedUrl,
    domain,
    hostname,
    protocol,
  };
}
