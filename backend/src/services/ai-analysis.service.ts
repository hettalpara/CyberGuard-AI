// ============================================================================
// AI Analysis Service
// Orchestration layer between CyberGuard Analyzer/Assistant and AI providers.
// Ensures URL privacy, validates responses, and guarantees that Risk Engine
// results are never altered.
// ============================================================================

import {
  IAIProvider,
  SecurityAnalysisInput,
  AIAnalysisResult,
  AssistantChatInput,
  AssistantChatResult,
} from "./ai/ai.interface";
import { defaultGeminiProvider } from "./ai/gemini.provider";

// Pluggable provider architecture
let activeProvider: IAIProvider = defaultGeminiProvider;

export function setAIProvider(provider: IAIProvider): void {
  activeProvider = provider;
}

export function getActiveAIProvider(): IAIProvider {
  return activeProvider;
}

/**
 * Sanitizes URLs to remove sensitive parameters (tokens, passwords, session IDs)
 * before sending to external AI models.
 */
export function sanitizeUrlForAI(rawUrl: string): string {
  try {
    const urlObj = new URL(rawUrl.startsWith("http") ? rawUrl : `https://${rawUrl}`);
    const sensitiveKeys = [
      "password",
      "token",
      "access_token",
      "secret",
      "session",
      "sessionid",
      "sess",
      "jwt",
      "apikey",
      "api_key",
      "key",
      "credential",
      "credentials",
      "auth",
      "pwd",
      "code",
      "bearer",
    ];

    const searchParams = new URLSearchParams(urlObj.search);
    let mutated = false;

    for (const key of Array.from(searchParams.keys())) {
      if (sensitiveKeys.some((s) => key.toLowerCase().includes(s))) {
        searchParams.set(key, "[REDACTED]");
        mutated = true;
      }
    }

    if (mutated) {
      urlObj.search = searchParams.toString();
      return urlObj.toString().replace(/%5BREDACTED%5D/gi, "[REDACTED]");
    }
    return rawUrl;
  } catch {
    // If URL parsing fails, return raw string without error
    return rawUrl;
  }
}

/**
 * Main entry point for generating AI security explanations from structured scan data.
 * Crucial: Does NOT calculate or alter risk score.
 */
export async function generateSecurityExplanation(
  input: SecurityAnalysisInput
): Promise<AIAnalysisResult> {
  const sanitizedUrl = sanitizeUrlForAI(input.url);

  const safeInput: SecurityAnalysisInput = {
    ...input,
    url: sanitizedUrl,
  };

  try {
    const result = await activeProvider.generateSecurityExplanation(safeInput);

    // Ensure severity never overwrites riskLevel
    if (result.available) {
      result.severity = input.riskLevel; // Lock severity to official riskLevel
    }

    return result;
  } catch (error: any) {
    console.warn(`[AI_ANALYSIS_SERVICE] Provider failed: ${error?.message || error}`);
    return {
      available: false,
      summary: "The security analysis was completed, but the AI explanation is temporarily unavailable.",
      error: "AI analysis could not be generated.",
    };
  }
}

/**
 * Main entry point for interactive defensive assistant chat.
 */
export async function chatWithSecurityAssistant(
  input: AssistantChatInput
): Promise<AssistantChatResult> {
  try {
    return await activeProvider.chatAssistant(input);
  } catch (error: any) {
    console.warn(`[AI_ASSISTANT_SERVICE] Assistant chat failed: ${error?.message || error}`);
    return {
      reply:
        "I encountered an unexpected error generating advice. For immediate cybersecurity assistance: 1) Disconnect suspicious devices from the internet. 2) Rotate your passwords. 3) Report financial cyber fraud to national helpline 1930.",
    };
  }
}
