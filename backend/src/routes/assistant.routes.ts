// ============================================================================
// Assistant Routes
// Authenticated cybersecurity assistant endpoints for incident response,
// threat interpretation, recovery steps, and defensive guidance.
// ============================================================================

import { Router, Response, NextFunction } from "express";
import { authMiddleware, AuthRequest } from "../middleware";
import { processAssistantChat } from "../services/assistant.service";

const router = Router();

// ============================================================================
// Rate Limiter for Assistant Chat (Max 20 requests per minute per user)
// ============================================================================
interface RateLimitEntry {
  count: number;
  resetAt: number;
}
export const assistantRateLimitMap = new Map<string, RateLimitEntry>();

export function assistantRateLimiter(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  const userId = req.user?.id;
  if (!userId) {
    next();
    return;
  }

  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute window
  const maxRequests = 20;

  const current = assistantRateLimitMap.get(userId);
  if (!current || now > current.resetAt) {
    assistantRateLimitMap.set(userId, { count: 1, resetAt: now + windowMs });
    next();
    return;
  }

  if (current.count >= maxRequests) {
    res.status(429).json({
      success: false,
      message: "Too many assistant requests. Please wait a moment and try again.",
    });
    return;
  }

  current.count += 1;
  next();
}

// ============================================================================
// POST /api/assistant/chat (Protected, Rate-Limited)
// ============================================================================
router.post(
  "/chat",
  authMiddleware,
  assistantRateLimiter,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      if (!req.user || !req.user.id) {
        res.status(401).json({
          success: false,
          message: "Authentication token required",
        });
        return;
      }

      const { message, scanId, contextUrl, conversationHistory } = req.body;

      const result = await processAssistantChat({
        message,
        userId: req.user.id,
        scanId,
        contextUrl,
        conversationHistory,
      });

      if (!result.success) {
        res.status(result.status).json({
          success: false,
          message: result.message,
          errorCode: result.errorCode,
        });
        return;
      }

      res.status(result.status).json({
        success: true,
        message: result.message,
        data: result.data,
        context: result.context,
      });
    } catch (error: any) {
      console.error("[ASSISTANT_ROUTE_ERROR]:", error?.message || error);
      res.status(500).json({
        success: false,
        message: "Internal server error communicating with AI Assistant",
      });
    }
  }
);

// ============================================================================
// GET /api/assistant/sessions (Protected)
// ============================================================================
router.get(
  "/sessions",
  authMiddleware,
  async (_req: AuthRequest, res: Response): Promise<void> => {
    res.status(200).json({
      success: true,
      data: [],
    });
  }
);

export default router;
