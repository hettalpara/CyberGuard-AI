// ============================================================================
// AI Cybersecurity Assistant Service
// Phase 7 — Defensive Cybersecurity Guidance, Scan Context Explanation,
// Incident Recovery, and Strict Guardrails.
// ============================================================================

import { Types } from "mongoose";
import { Scan, IScan } from "../models/Scan";
import { sanitizeUrlForAI, getActiveAIProvider } from "./ai-analysis.service";
import { AssistantChatContext, AssistantChatInput } from "./ai/ai.interface";

export interface ChatMessageItem {
  role: "user" | "assistant";
  content: string;
}

export interface ProcessChatOptions {
  message: string;
  userId: string;
  scanId?: string;
  contextUrl?: string;
  conversationHistory?: ChatMessageItem[];
}

export interface AssistantContextData {
  scanId?: string;
  url?: string;
  riskScore?: number | null;
  riskLevel?: string;
  confidence?: number;
  threatType?: string;
}

export interface ProcessChatResult {
  success: boolean;
  status: number;
  message: string;
  data?: {
    id: string;
    role: "assistant";
    content: string;
    timestamp: string;
  };
  context?: AssistantContextData;
  errorCode?: string;
}

// Regex patterns to detect offensive / harmful cybersecurity requests
const HARMFUL_PATTERNS: RegExp[] = [
  // Malware / Ransomware / Keyloggers / Trojans
  /\b(write|create|code|generate|build|make)\s+(a\s+)?(malware|ransomware|keylogger|trojan|rootkit|bootkit|stealer|spyware|worm|virus)\b/i,
  /\b(how\s+to\s+)?(create|code|deploy|distribute)\s+(a\s+)?(keylogger|ransomware|trojan|wiper)\b/i,
  // Credential theft / harvesting / phishing pages
  /\b(create|code|clone|make|build)\s+(a\s+)?(phishing\s+(page|site|website|template|email)|credential\s+(harvester|stealer))\b/i,
  /\b(steal|harvest|intercept)\s+(passwords?|credentials?|credit\s*cards?|bank\s*pins?|session\s*tokens?|cookies?)\b/i,
  // Exploits / payloads / bypasses
  /\b(create|generate|write|craft|build|make|code)\s+(an?\s+)?(exploit\s+payload|sql\s*injection\s+payload|xss\s+payload|rce\s+payload|buffer\s*overflow\s+exploit)\b/i,
  /\b(how\s+to\s+)?(build|create|write|craft|make|code)\s+(an?\s+)?(exploit|payload|backdoor)\b/i,
  /\b(hack|break\s+into|compromise|infiltrate)\s+(someone'?s?|an?\s+unauthorized|an?\s+external)\s+(account|system|server|database|network|phone|wifi)\b/i,
  // DDoS / stressers
  /\b(ddos|dos|syn\s*flood)\s+(tool|script|attack)\b/i,
  // Antivirus evasion
  /\b(evade|bypass|disable)\s+(antivirus|edr|windows\s*defender|firewall)\s+(to\s+execute|for\s+malware)\b/i,
];

/**
 * Checks if a user's prompt matches direct offensive cyber attack patterns.
 */
export function isHarmfulRequest(message: string): boolean {
  const normalized = message.trim();
  return HARMFUL_PATTERNS.some((pattern) => pattern.test(normalized));
}

/**
 * Returns a concise, professional refusal with defensive education alternative.
 */
export function getHarmfulRefusalReply(): string {
  return "I cannot assist with creating malware, keyloggers, phishing pages, credential-theft tools, or exploit payloads. I can help you understand how these threats operate, how to detect them, and how to defend against them.";
}

/**
 * Validates chat input constraints:
 * - message must be non-empty string between 1 and 4000 chars
 * - conversationHistory must be an array of at most 20 valid items
 */
export function validateChatInput(
  message: unknown,
  conversationHistory?: unknown
): { valid: boolean; error?: string; cleanMessage?: string; cleanHistory?: ChatMessageItem[] } {
  if (typeof message !== "string") {
    return { valid: false, error: "Message must be a string." };
  }

  const cleanMessage = message.trim();
  if (cleanMessage.length === 0) {
    return { valid: false, error: "Message cannot be empty." };
  }

  if (cleanMessage.length > 4000) {
    return { valid: false, error: "Message exceeds maximum allowed length of 4000 characters." };
  }

  let cleanHistory: ChatMessageItem[] | undefined = undefined;
  if (conversationHistory !== undefined) {
    if (!Array.isArray(conversationHistory)) {
      return { valid: false, error: "Conversation history must be an array." };
    }

    // Limit to the most recent 20 messages
    const recent = conversationHistory.slice(-20);
    cleanHistory = [];

    for (const item of recent) {
      if (
        typeof item === "object" &&
        item !== null &&
        (item.role === "user" || item.role === "assistant") &&
        typeof item.content === "string"
      ) {
        cleanHistory.push({
          role: item.role,
          content: item.content.slice(0, 2000).trim(),
        });
      }
    }
  }

  return { valid: true, cleanMessage, cleanHistory };
}

/**
 * Formats structured scan context into safe, defensive context for the AI model.
 */
export function formatScanContext(scan: IScan): AssistantChatContext {
  const sanitizedUrl = sanitizeUrlForAI(scan.url);

  return {
    url: sanitizedUrl,
    riskScore: scan.riskScore,
    riskLevel: scan.riskLevel,
    confidence: scan.confidence,
    factors: (scan.risk?.factors || scan.riskFactors || []).map((f: any) => ({
      name: f.name || "Factor",
      score: f.score ?? null,
      impact: f.impact || "UNKNOWN",
      status: f.status || "UNKNOWN",
      reason: f.reason || "",
      weight: f.weight,
      contribution: f.contribution,
    })),
    aiAnalysis: scan.aiAnalysis
      ? {
          available: scan.aiAnalysis.available,
          summary: scan.aiAnalysis.summary,
          threatType: scan.aiAnalysis.threatType,
          severity: scan.riskLevel, // strictly enforce authoritative risk level
          explanation: scan.aiAnalysis.explanation,
          keyIndicators: scan.aiAnalysis.keyIndicators,
          recommendedActions: scan.aiAnalysis.recommendedActions,
        }
      : undefined,
  };
}

/**
 * Main orchestration function for user assistant chat queries.
 */
export async function processAssistantChat(
  options: ProcessChatOptions
): Promise<ProcessChatResult> {
  const { message, userId, scanId, contextUrl, conversationHistory } = options;

  // 1. Input Validation
  const validation = validateChatInput(message, conversationHistory);
  if (!validation.valid || !validation.cleanMessage) {
    return {
      success: false,
      status: 400,
      message: validation.error || "Invalid chat input.",
      errorCode: "INVALID_INPUT",
    };
  }

  const cleanMessage = validation.cleanMessage;
  const cleanHistory = validation.cleanHistory;

  // 2. Harmful Request Guardrail
  if (isHarmfulRequest(cleanMessage)) {
    const refusal = getHarmfulRefusalReply();
    const responseMsg = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      role: "assistant" as const,
      content: refusal,
      timestamp: new Date().toISOString(),
    };

    return {
      success: true,
      status: 200,
      message: refusal,
      data: responseMsg,
    };
  }

  // 3. Scan Context Resolution & Ownership Enforcement
  let chatContext: AssistantChatContext | undefined = undefined;
  let contextMeta: AssistantContextData | undefined = undefined;

  if (scanId) {
    if (typeof scanId !== "string" || !Types.ObjectId.isValid(scanId)) {
      return {
        success: false,
        status: 400,
        message: "Invalid scan ID format.",
        errorCode: "INVALID_SCAN_ID",
      };
    }

    const scan = await Scan.findById(new Types.ObjectId(scanId));
    if (!scan) {
      return {
        success: false,
        status: 404,
        message: "Scan report not found.",
        errorCode: "SCAN_NOT_FOUND",
      };
    }

    // Strict ownership verification: must belong to the authenticated user
    if (scan.userId.toString() !== userId.toString()) {
      return {
        success: false,
        status: 403,
        message: "Access denied: You do not have permission to view this scan report.",
        errorCode: "FORBIDDEN_SCAN_ACCESS",
      };
    }

    chatContext = formatScanContext(scan);
    contextMeta = {
      scanId: scan._id.toString(),
      url: chatContext.url,
      riskScore: scan.riskScore,
      riskLevel: scan.riskLevel,
      confidence: scan.confidence,
      threatType: scan.aiAnalysis?.threatType || "Security Assessment",
    };
  } else if (contextUrl && typeof contextUrl === "string" && contextUrl.trim().length > 0) {
    const cleanUrl = contextUrl.trim();
    // Look up user's most recent scan for this URL
    const scan = await Scan.findOne({
      userId: new Types.ObjectId(userId),
      url: cleanUrl,
    }).sort({ createdAt: -1 });

    if (scan) {
      chatContext = formatScanContext(scan);
      contextMeta = {
        scanId: scan._id.toString(),
        url: chatContext.url,
        riskScore: scan.riskScore,
        riskLevel: scan.riskLevel,
        confidence: scan.confidence,
      };
    } else {
      chatContext = { url: sanitizeUrlForAI(cleanUrl) };
      contextMeta = { url: chatContext.url };
    }
  }

  // 4. Send request to Gemini Provider via pluggable provider
  const provider = getActiveAIProvider();
  const chatInput: AssistantChatInput = {
    message: cleanMessage,
    context: chatContext,
    conversationHistory: cleanHistory,
  };

  try {
    const result = await provider.chatAssistant(chatInput);

    const responseMsg = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      role: "assistant" as const,
      content: result.reply,
      timestamp: new Date().toISOString(),
    };

    return {
      success: true,
      status: 200,
      message: result.reply,
      data: responseMsg,
      context: contextMeta,
    };
  } catch (error: any) {
    console.warn(`[ASSISTANT_SERVICE] AI Provider error: ${error?.message || error}`);
    return {
      success: false,
      status: 503,
      message: "The AI assistant is temporarily unavailable.",
      errorCode: "AI_UNAVAILABLE",
    };
  }
}
