// ============================================================================
// AI Provider & Analysis Interfaces
// Defines contracts for AI security explanations and assistant interactions.
// ============================================================================

export interface SecurityFactorSummary {
  name: string;
  score: number | null;
  impact: string;
  status: string;
  reason: string;
  weight?: number;
  contribution?: number;
}

export interface SecurityAnalysisInput {
  url: string;
  domain: string;
  riskScore: number | null;
  riskLevel: string; // "SAFE" | "LOW" | "MODERATE" | "HIGH" | "CRITICAL" | "INCONCLUSIVE"
  confidence: number;
  factors: SecurityFactorSummary[];
  overrideTriggered?: boolean;
  overrideReason?: string | null;
  overrideType?: string | null;
  calculationMethod?: string;
  securityEvidence?: {
    ssl?: {
      valid: boolean;
      status: string;
      issuer?: string;
      protocol?: string;
    };
    sslAnalysis?: {
      status?: string;
      protocol?: string;
      score?: number | null;
      level?: string | null;
      certificate?: Record<string, unknown>;
      reason?: string;
      checkedAt?: string;
    };
    urlIntelligence?: {
      status?: string;
      score?: number | null;
      level?: string;
      indicators?: Array<{ name: string; score: number; reason: string }>;
      reasons?: string[];
      evidence?: Record<string, unknown>;
    };
    safeBrowsing?: {
      checked: boolean;
      available?: boolean;
      status?: string;
      threatDetected: boolean;
      threatTypes?: string[];
      score?: number | null;
      reason?: string;
    };
    urlhaus?: {
      checked: boolean;
      available?: boolean;
      status?: string;
      match: boolean;
      threatType?: string;
      tags?: string[];
    };
    virusTotal?: {
      checked: boolean;
      available: boolean;
      maliciousCount: number;
      suspiciousCount: number;
      totalEngines: number;
      detectionRatio?: string;
    };
    riskReasons?: string[];
  };
}

export interface AIAnalysisResult {
  available: boolean;
  summary: string;
  threatType?: string;
  severity?: string; // Descriptive only; does not overwrite authoritative riskLevel
  explanation?: string;
  keyIndicators?: string[];
  recommendedActions?: string[];
  confidenceNote?: string;
  generatedAt?: Date;
  model?: string;
  error?: string;
}

export interface AssistantChatContext {
  url?: string;
  riskScore?: number | null;
  riskLevel?: string;
  confidence?: number;
  factors?: SecurityFactorSummary[];
  aiAnalysis?: Partial<AIAnalysisResult>;
}

export interface AssistantChatInput {
  message: string;
  context?: AssistantChatContext;
  conversationHistory?: Array<{
    role: "user" | "assistant";
    content: string;
  }>;
}

export interface AssistantChatResult {
  reply: string;
  isRefusal?: boolean;
  modelUsed?: string;
}

export interface IAIProvider {
  name: string;
  isConfigured(): boolean;
  generateSecurityExplanation(input: SecurityAnalysisInput): Promise<AIAnalysisResult>;
  chatAssistant(input: AssistantChatInput): Promise<AssistantChatResult>;
}
