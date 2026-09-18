// ============================================================================
// Gemini Service
// Exposes the dedicated analyzeSecurityResult(scanData) function conforming
// to Phase 6 requirements. Delegates to AI Analysis service.
// ============================================================================

import { SecurityAnalysisInput, AIAnalysisResult } from "./ai/ai.interface";
import { generateSecurityExplanation } from "./ai-analysis.service";

/**
 * Receives structured security scan results from the Risk Engine
 * and returns the Gemini AI security explanation.
 *
 * NOTE: Gemini does NOT calculate or modify risk scores or risk levels.
 */
export async function analyzeSecurityResult(
  scanData: SecurityAnalysisInput
): Promise<AIAnalysisResult> {
  return generateSecurityExplanation(scanData);
}

export * from "./ai/ai.interface";
export * from "./ai/gemini.provider";
