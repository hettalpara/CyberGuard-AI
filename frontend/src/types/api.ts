// ============================================================================
// API Types
// Contracts for API request/response shapes used across all services.
// ============================================================================

/** Standard API success envelope */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T;
  message?: string;
  timestamp: string;
}

/** Standard API error envelope */
export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
  timestamp: string;
}

/** Paginated response wrapper */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

/** Common query parameters for list endpoints */
export interface PaginationParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  search?: string;
}

export interface ScanRequest {
  url: string;
  checkWhois?: boolean;
  checkVirusTotal?: boolean;
}

export interface UrlScanResult {
  id: string;
  url: string;
  riskScore: number;
  threatLevel: "SAFE" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  safeBrowsingMatch?: boolean;
  urlhausMatch?: boolean;
  virusTotalDetectionRatio?: string;
  domainAgeDays?: number;
  sslValid: boolean;
  summary: string;
  createdAt: string;
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: string;
  lastMessageAt: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export interface AssistantPrompt {
  sessionId?: string;
  message: string;
  scanId?: string;
  contextUrl?: string;
  conversationHistory?: Array<{
    role: "user" | "assistant";
    content: string;
  }>;
}

export interface CrimeReport {
  id: string;
  referenceNumber: string;
  scanId?: string;
  title: string;
  category: string;
  threatLevel: string;
  status: string;
  generatedAt: string;
  pdfUrl?: string;
}

export interface ReportFilter {
  category?: string;
  status?: string;
  search?: string;
}

export interface IncidentReportSnapshot {
  url: string;
  normalizedUrl: string;
  domain: string;
  riskScore: number | null;
  riskLevel: string;
  confidence: number;
  riskCalculationVersion?: string;
  analysisStatus?: string;
  safeBrowsing?: {
    checked: boolean;
    available: boolean;
    status: string;
    threatDetected: boolean;
    threatTypes: string[];
    score?: number | null;
    reason?: string;
    checkedAt?: string;
    error?: string;
  };
  virusTotal?: {
    checked: boolean;
    available: boolean;
    malicious: boolean;
    suspicious: boolean;
    harmless: number;
    maliciousCount: number;
    suspiciousCount: number;
    undetectedCount: number;
    totalEngines: number;
    detectionRatio?: string;
    status?: string;
  };
  urlhaus?: {
    available: boolean;
    status: string;
    match: boolean;
    threatType?: string;
    tags?: string[];
    reason?: string;
  };
  urlIntelligence?: {
    status: string;
    score: number | null;
    level: string;
    indicators: Array<{ name: string; score: number; reason: string }>;
    reasons: string[];
  };
  sslAnalysis?: {
    status: string;
    protocol: string;
    score: number | null;
    level: string | null;
    reason: string;
    checkedAt: string;
  };
  ssl?: {
    enabled: boolean;
    valid: boolean;
    status: string;
    issuer?: string;
    validDaysRemaining?: number;
    protocol?: string;
  };
  aiAnalysis?: {
    available: boolean;
    summary: string;
    threatType?: string;
    severity?: string;
    explanation?: string;
    keyIndicators?: string[];
    recommendedActions?: string[];
    confidenceNote?: string;
    generatedAt?: string;
  };
  riskFactors?: any[];
  summary?: string;
  scannedAt: string;
}

export type ReportStatus = "DRAFT" | "FINAL" | "ARCHIVED";

export interface IncidentReport {
  _id: string;
  reportId: string;
  userId: string;
  scanId: string;
  incidentType: string;
  title: string;
  description: string;
  incidentDate: string;
  source?: string;
  affectedAccount?: string;
  userNotes?: string;
  status: ReportStatus;
  snapshot: IncidentReportSnapshot;
  generatedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateReportInput {
  scanId: string;
  incidentType: string;
  title: string;
  description: string;
  incidentDate?: string;
  source?: string;
  affectedAccount?: string;
  userNotes?: string;
  status?: "DRAFT" | "FINAL";
}

export interface UpdateReportInput {
  incidentType?: string;
  title?: string;
  description?: string;
  incidentDate?: string;
  source?: string;
  affectedAccount?: string;
  userNotes?: string;
  status?: "DRAFT" | "FINAL" | "ARCHIVED";
}


