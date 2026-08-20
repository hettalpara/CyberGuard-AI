import { apiClient } from "@/lib/api-client";

export interface ScanUrlPayload {
  url: string;
}

export interface ScanResultData {
  id: string;
  url: string;
  normalizedUrl: string;
  domain: string;
  riskScore: number;
  riskLevel: "SAFE" | "SUSPICIOUS" | "DANGEROUS" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  risk?: {
    score: number;
    level: "SAFE" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    reasons: string[];
  };
  ssl: {
    enabled: boolean;
    valid: boolean;
    status: string;
    issuer?: string;
    validDaysRemaining?: number;
  };
  safeBrowsing: {
    checked: boolean;
    threatDetected: boolean;
    threatType?: string;
    status?: string;
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

export const analyzerService = {
  scanUrl: (data: ScanUrlPayload) =>
    apiClient.post<ScanResponse>("/analyzer/scan", data),

  getScanHistory: (params?: { page?: number; limit?: number }) =>
    apiClient.get<ScanHistoryResponse>("/analyzer/history", { params }),

  getScanById: (id: string) =>
    apiClient.get<ScanResponse>(`/analyzer/${id}`),
};
