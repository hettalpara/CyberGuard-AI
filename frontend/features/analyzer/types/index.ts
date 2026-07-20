// Analyzer feature types
export type ThreatLevel = "safe" | "low" | "medium" | "high" | "critical";

export interface UrlScanResult {
  id: string;
  url: string;
  threatLevel: ThreatLevel;
  score: number;
  isPhishing: boolean;
  isMalware: boolean;
  sslValid: boolean;
  domainAge: string;
  scanDate: string;
  details: ThreatDetail[];
}

export interface ThreatDetail {
  category: string;
  description: string;
  severity: ThreatLevel;
  recommendation: string;
}

export interface ScanRequest {
  url: string;
  deepScan?: boolean;
}
