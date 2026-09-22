import { Router, Response, NextFunction } from "express";
import { Types } from "mongoose";
import { Scan } from "../models/Scan";
import { authMiddleware, AuthRequest } from "../middleware";
import { performUrlAnalysis } from "../services/analyzer.service";
import { analyzeEmail } from "../services/email-analyzer.service";
import { analyzePhone } from "../services/phone-analyzer.service";

const router = Router();

// ============================================================================
// Rate Limiter for Analyzer Scans (Max 10 requests per minute per user)
// ============================================================================
interface RateLimitEntry {
  count: number;
  resetAt: number;
}
const rateLimitMap = new Map<string, RateLimitEntry>();

function scanRateLimiter(req: AuthRequest, res: Response, next: NextFunction): void {
  const userId = req.user?.id;
  if (!userId) {
    next();
    return;
  }

  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute window
  const maxRequests = 10;

  const current = rateLimitMap.get(userId);
  if (!current || now > current.resetAt) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + windowMs });
    next();
    return;
  }

  if (current.count >= maxRequests) {
    res.status(429).json({
      success: false,
      message: "Too many scan requests. Please wait a minute before analyzing another URL.",
    });
    return;
  }

  current.count += 1;
  next();
}

// ============================================================================
// POST /api/analyzer/scan (Protected)
// ============================================================================
router.post("/scan", authMiddleware, scanRateLimiter, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || !req.user.id) {
      res.status(401).json({
        success: false,
        message: "Authentication token required",
      });
      return;
    }

    const { url } = req.body;
    if (!url || typeof url !== "string" || url.trim() === "") {
      res.status(400).json({
        success: false,
        message: "URL is required and cannot be empty",
      });
      return;
    }

    const scanDoc = await performUrlAnalysis({
      rawUrl: url,
      userId: req.user.id,
    });

    res.status(200).json({
      success: true,
      scan: scanDoc,
      reportId: scanDoc.reportId,
    });
  } catch (error: any) {
    const errorMsg = error instanceof Error ? error.message : "Internal error during URL analysis";
    const isValidationErr =
      errorMsg.includes("Invalid") ||
      errorMsg.includes("prohibited") ||
      errorMsg.includes("Disallowed") ||
      errorMsg.includes("required");

    res.status(isValidationErr ? 400 : 500).json({
      success: false,
      message: errorMsg,
    });
  }
});

// ============================================================================
// POST /api/analyzer/email (Protected, Rate-Limited)
// ============================================================================
router.post("/email", authMiddleware, scanRateLimiter, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || !req.user.id) {
      res.status(401).json({
        success: false,
        message: "Authentication token required",
      });
      return;
    }

    const { email, headers } = req.body;

    if (!email || typeof email !== "string" || email.trim() === "") {
      res.status(400).json({
        success: false,
        message: "Email address is required and cannot be empty",
      });
      return;
    }

    if (email.length > 320) {
      res.status(400).json({
        success: false,
        message: "Email address exceeds maximum permitted length (320 characters)",
      });
      return;
    }

    if (headers !== undefined && typeof headers !== "string") {
      res.status(400).json({
        success: false,
        message: "Headers must be a string",
      });
      return;
    }

    if (headers && headers.length > 100 * 1024) {
      res.status(400).json({
        success: false,
        message: "Headers exceed maximum permitted length (100KB)",
      });
      return;
    }

    const result = await analyzeEmail({
      email: email.trim(),
      headers: headers ? headers.trim() : undefined,
    });

    res.status(200).json({
      success: true,
      emailAnalysis: result,
      data: result,
    });
  } catch (error: any) {
    const errorMsg = error instanceof Error ? error.message : "Internal error during email analysis";
    const isValidationErr =
      errorMsg.includes("Invalid") ||
      errorMsg.includes("required") ||
      errorMsg.includes("exceeds");

    res.status(isValidationErr ? 400 : 500).json({
      success: false,
      message: errorMsg,
    });
  }
});

// ============================================================================
// POST /api/analyzer/phone (Protected, Rate-Limited)
// ============================================================================
router.post("/phone", authMiddleware, scanRateLimiter, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || !req.user.id) {
      res.status(401).json({
        success: false,
        message: "Authentication token required",
      });
      return;
    }

    const { phone, countryHint } = req.body;

    if (!phone || typeof phone !== "string" || phone.trim() === "") {
      res.status(400).json({
        success: false,
        message: "Phone number is required and cannot be empty",
      });
      return;
    }

    if (phone.length > 30) {
      res.status(400).json({
        success: false,
        message: "Phone number exceeds maximum permitted length (30 characters)",
      });
      return;
    }

    if (countryHint !== undefined && typeof countryHint !== "string") {
      res.status(400).json({
        success: false,
        message: "countryHint must be a string",
      });
      return;
    }

    const result = await analyzePhone({
      phone: phone.trim(),
      countryHint: countryHint ? countryHint.trim() : undefined,
    });

    res.status(200).json({
      success: true,
      phoneAnalysis: result,
      data: result,
    });
  } catch (error: any) {
    const errorMsg = error instanceof Error ? error.message : "Internal error during phone analysis";
    const isValidationErr =
      errorMsg.includes("Invalid") ||
      errorMsg.includes("required") ||
      errorMsg.includes("exceeds");

    res.status(isValidationErr ? 400 : 500).json({
      success: false,
      message: errorMsg,
    });
  }
});

// ============================================================================
// GET /api/analyzer/stats (Protected, Authenticated User Metrics)
// ============================================================================
router.get("/stats", authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || !req.user.id || !Types.ObjectId.isValid(req.user.id)) {
      res.status(401).json({
        success: false,
        message: "Authentication token required",
      });
      return;
    }

    const userObjectId = new Types.ObjectId(req.user.id);

    const [
      totalScans,
      safeScans,
      lowRiskScans,
      moderateRiskScans,
      highRiskScans,
      criticalScans,
      avgScoreResult,
    ] = await Promise.all([
      Scan.countDocuments({ userId: userObjectId }),
      Scan.countDocuments({ userId: userObjectId, riskLevel: "SAFE" }),
      Scan.countDocuments({ userId: userObjectId, riskLevel: "LOW" }),
      Scan.countDocuments({ userId: userObjectId, riskLevel: { $in: ["MODERATE", "MEDIUM"] } }),
      Scan.countDocuments({ userId: userObjectId, riskLevel: "HIGH" }),
      Scan.countDocuments({ userId: userObjectId, riskLevel: "CRITICAL" }),
      Scan.aggregate([
        { $match: { userId: userObjectId, riskScore: { $ne: null } } },
        { $group: { _id: null, avgScore: { $avg: "$riskScore" } } },
      ]),
    ]);

    const suspiciousScans = lowRiskScans + moderateRiskScans;
    const dangerousScans = highRiskScans + criticalScans;
    const threatScans = suspiciousScans + dangerousScans;
    const cleanRatio = totalScans > 0 ? Number(((safeScans / totalScans) * 100).toFixed(1)) : 0;
    const threatRatio = totalScans > 0 ? Number(((threatScans / totalScans) * 100).toFixed(1)) : 0;
    const avgRiskScore = avgScoreResult.length > 0 ? Math.round(avgScoreResult[0].avgScore) : 0;

    res.status(200).json({
      success: true,
      stats: {
        totalScans,
        safeScans,
        suspiciousScans,
        dangerousScans,
        threatScans,
        highRiskScans,
        criticalScans,
        lowRiskScans,
        moderateRiskScans,
        cleanRatio,
        threatRatio,
        avgRiskScore,
      },
    });
  } catch (error) {
    console.error("Get analyzer stats error:", error instanceof Error ? error.message : error);
    res.status(500).json({
      success: false,
      message: "Internal server error calculating security statistics",
    });
  }
});

// ============================================================================
// GET /api/analyzer/history (Protected, Paginated)
// ============================================================================
router.get("/history", authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || !req.user.id || !Types.ObjectId.isValid(req.user.id)) {
      res.status(401).json({
        success: false,
        message: "Authentication token required",
      });
      return;
    }

    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 10));
    const skip = (page - 1) * limit;

    const query = { userId: new Types.ObjectId(req.user.id) };

    const [scans, total] = await Promise.all([
      Scan.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Scan.countDocuments(query),
    ]);

    const pages = Math.ceil(total / limit) || 1;

    res.status(200).json({
      success: true,
      data: scans,
      pagination: {
        page,
        limit,
        total,
        pages,
      },
    });
  } catch (error) {
    console.error("Get scan history error:", error instanceof Error ? error.message : error);
    res.status(500).json({
      success: false,
      message: "Internal server error retrieving scan history",
    });
  }
});

// ============================================================================
// GET /api/analyzer/:id (Protected, User Isolation)
// ============================================================================
router.get("/:id", authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || !req.user.id) {
      res.status(401).json({
        success: false,
        message: "Authentication token required",
      });
      return;
    }

    const scanId = String(req.params.id || "");
    if (!Types.ObjectId.isValid(scanId)) {
      res.status(404).json({
        success: false,
        message: "Scan not found",
      });
      return;
    }

    const scan = await Scan.findOne({
      _id: new Types.ObjectId(scanId),
      userId: new Types.ObjectId(req.user.id),
    });

    if (!scan) {
      res.status(404).json({
        success: false,
        message: "Scan not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      scan,
    });
  } catch (error) {
    console.error("Get scan by ID error:", error instanceof Error ? error.message : error);
    res.status(500).json({
      success: false,
      message: "Internal server error retrieving scan",
    });
  }
});

export default router;
