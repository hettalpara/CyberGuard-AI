import { apiClient } from "@/lib/api-client";

export interface ScanUrlPayload {
  url: string;
}

export interface RiskFactorData {
  name: string;
  score: number | null;
  weight: number;
  contribution: number;
  impact: string;
  status: string;
  reason: string;
  available: boolean;
  details?: Record<string, unknown>;
}

export interface AIAnalysisData {
  available: boolean;
  summary: string;
  threatType?: string;
  severity?: string;
  explanation?: string;
  keyIndicators?: string[];
  recommendedActions?: string[];
  confidenceNote?: string;
  generatedAt?: string;
  model?: string;
  error?: string;
}

export interface SecurityFindingData {
  source: string;
  finding: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFO";
  explanation: string;
  evidence?: string | Record<string, unknown>;
  isConfirmedThreat?: boolean;
}

export interface ScanResultData {
  id: string;
  url: string;
  normalizedUrl: string;
  domain: string;
  riskScore: number | null;
  riskLevel: string;
  confidence: number;
  riskCalculationVersion?: string;
  analysisStatus?: string;
  findings?: SecurityFindingData[];
  risk?: {
    score: number | null;
    level: string;
    reasons: string[];
    confidence: number;
    factors: RiskFactorData[];
    findings?: SecurityFindingData[];
  };
  ssl: {
    enabled: boolean;
    valid: boolean;
    status: string;
    issuer?: string;
    validDaysRemaining?: number;
  };
  sslAnalysis?: {
    status: string;
    protocol: string;
    score: number | null;
    level: string | null;
    certificate?: Record<string, unknown>;
    reason?: string;
    checkedAt?: string;
  };
  urlIntelligence?: {
    status: string;
    score: number | null;
    level: string;
    indicators: Array<{ name: string; score: number; reason: string }>;
    reasons: string[];
    evidence?: Record<string, unknown>;
  };
  safeBrowsing?: {
    checked: boolean;
    available: boolean;
    status: string;
    threatDetected: boolean;
    threatTypes?: string[];
    score?: number | null;
    reason?: string;
    error?: string;
    checkedAt?: string;
  };
  urlhaus?: {
    available: boolean;
    status: string;
    match: boolean;
    threatType?: string;
    tags?: string[];
    confidence?: number;
    reason?: string;
    error?: string;
    checkedAt?: string;
  };
  virusTotal: {
    checked: boolean;
    available?: boolean;
    malicious: boolean;
    suspicious: boolean;
    harmless?: number;
    maliciousCount?: number;
    suspiciousCount?: number;
    undetectedCount?: number;
    totalEngines?: number;
    detectionRatio?: string;
    enginesFlagged?: number;
    permalink?: string | null;
    status?: string;
    error?: string;
  };
  riskFactors?: RiskFactorData[];
  aiAnalysis?: AIAnalysisData;
  summary: string;
  aiExplanation?: string;
  recommendedActions?: string[];
  scannedAt: string;
  reportId?: string;
  createdAt?: string;
}

export interface ScanResponse {
  success: boolean;
  scan: ScanResultData;
  reportId?: string;
  message?: string;
}

export interface ScanHistoryResponse {
  success: boolean;
  data: ScanResultData[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface DashboardStats {
  totalScans: number;
  safeScans: number;
  suspiciousScans: number;
  dangerousScans: number;
  threatScans: number;
  highRiskScans: number;
  criticalScans: number;
  lowRiskScans: number;
  moderateRiskScans: number;
  cleanRatio: number;
  threatRatio: number;
  avgRiskScore: number;
}

export interface DashboardStatsResponse {
  success: boolean;
  stats: DashboardStats;
}

export interface EmailAnalysisPayload {
  email: string;
  headers?: string;
}

export interface EmailAuthCheckData {
  status: "PASS" | "FAIL" | "MISSING" | "UNKNOWN";
  record?: string;
  details: string;
  mechanism?: string;
}

export interface EmailHeaderMismatchData {
  type: string;
  description: string;
  severity: "LOW" | "MEDIUM" | "HIGH";
}

export interface EmailHeaderAnalysisData {
  from?: string;
  fromDomain?: string;
  replyTo?: string;
  replyToDomain?: string;
  returnPath?: string;
  returnPathDomain?: string;
  subject?: string;
  messageId?: string;
  date?: string;
  mismatches: EmailHeaderMismatchData[];
  headersPresent: string[];
}

export interface EmailAnalysisResult {
  input: string;
  email: string;
  localPart: string;
  domain: string;
  isValidFormat: boolean;
  validationStatus: "VALID" | "INVALID";
  validationError?: string;
  spf: EmailAuthCheckData;
  dkim: EmailAuthCheckData;
  dmarc: EmailAuthCheckData;
  headers?: EmailHeaderAnalysisData;
  domainInfo: {
    domain: string;
    hasMx: boolean;
    isPunycode: boolean;
    isFreeProvider: boolean;
    isDisposable: boolean;
  };
  findings: string[];
  warnings: string[];
  riskScore: number;
  riskLevel: "SAFE" | "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
  confidence: number;
  summary: string;
  analyzedAt: string;
}

export interface PhoneAnalysisPayload {
  phone: string;
  countryHint?: string;
}

export interface PhoneReputationData {
  status: "AVAILABLE" | "UNKNOWN" | "UNAVAILABLE";
  available: boolean;
  spamScore?: number;
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
  riskScore: number;
  riskLevel: "SAFE" | "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
  confidence: number;
  summary: string;
  analyzedAt: string;
}

export interface EmailAnalysisResponse {
  success: boolean;
  emailAnalysis: EmailAnalysisResult;
  data: EmailAnalysisResult;
}

export interface PhoneAnalysisResponse {
  success: boolean;
  phoneAnalysis: PhoneAnalysisResult;
  data: PhoneAnalysisResult;
}

export const analyzerService = {
  scanUrl: (data: ScanUrlPayload) =>
    apiClient.post<ScanResponse>("/analyzer/scan", data),

  analyzeEmail: (data: EmailAnalysisPayload) =>
    apiClient.post<EmailAnalysisResponse>("/analyzer/email", data),

  analyzePhone: (data: PhoneAnalysisPayload) =>
    apiClient.post<PhoneAnalysisResponse>("/analyzer/phone", data),

  getScanHistory: (params?: { page?: number; limit?: number }) =>
    apiClient.get<ScanHistoryResponse>("/analyzer/history", { params }),

  getScanById: (id: string) =>
    apiClient.get<ScanResponse>(`/analyzer/${id}`),

  getDashboardStats: () =>
    apiClient.get<DashboardStatsResponse>("/analyzer/stats"),
};
