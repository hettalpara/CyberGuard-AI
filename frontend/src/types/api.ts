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
  threatType?: string;
  safeBrowsingMatch: boolean;
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
  contextUrl?: string;
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

