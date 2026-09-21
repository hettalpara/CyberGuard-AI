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
  risk?: {
    score: number | null;
    level: string;
    reasons: string[];
    confidence: number;
    factors: RiskFactorData[];
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
  createdAt?: string;
}

export interface ScanResponse {
  success: boolean;
  scan: ScanResultData;
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

export const analyzerService = {
  scanUrl: (data: ScanUrlPayload) =>
    apiClient.post<ScanResponse>("/analyzer/scan", data),

  getScanHistory: (params?: { page?: number; limit?: number }) =>
    apiClient.get<ScanHistoryResponse>("/analyzer/history", { params }),

  getScanById: (id: string) =>
    apiClient.get<ScanResponse>(`/analyzer/${id}`),

  getDashboardStats: () =>
    apiClient.get<DashboardStatsResponse>("/analyzer/stats"),
};
