// ============================================================================
// Incident Report Routes — Phase 8
// Endpoints for report creation, retrieval, updates, deletion, and PDF streaming.
// All endpoints are strictly authenticated and scoped to the logged-in user.
// ============================================================================

import { Router, Response } from "express";
import { authMiddleware, AuthRequest } from "../middleware";
import {
  createIncidentReport,
  getUserReports,
  getReportById,
  updateIncidentReport,
  deleteIncidentReport,
  generateReportPdfBuffer,
} from "../services/report.service";

const router = Router();

// ============================================================================
// POST /api/reports (Create new report from scan)
// ============================================================================
router.post("/", authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || !req.user.id) {
      res.status(401).json({ success: false, message: "Authentication required" });
      return;
    }

    const report = await createIncidentReport(req.user.id, req.body);
    res.status(201).json({
      success: true,
      message: "Incident report created successfully",
      report,
    });
  } catch (error: any) {
    const errorMsg = error instanceof Error ? error.message : "Failed to create incident report";
    const isNotFound = errorMsg.includes("Scan not found");
    const isValidationErr =
      errorMsg.includes("required") ||
      errorMsg.includes("Invalid") ||
      errorMsg.includes("exceed");

    res.status(isNotFound ? 404 : isValidationErr ? 400 : 500).json({
      success: false,
      message: errorMsg,
    });
  }
});

// ============================================================================
// GET /api/reports (List user's reports with pagination)
// ============================================================================
router.get("/", authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || !req.user.id) {
      res.status(401).json({ success: false, message: "Authentication required" });
      return;
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const status = req.query.status as string;
    const search = req.query.search as string;

    const result = await getUserReports(req.user.id, { page, limit, status, search });
    res.status(200).json({
      success: true,
      data: result.reports,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        pages: result.pages,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Failed to retrieve incident reports",
    });
  }
});

// ============================================================================
// GET /api/reports/:id (Get single report)
// ============================================================================
router.get("/:id", authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || !req.user.id) {
      res.status(401).json({ success: false, message: "Authentication required" });
      return;
    }

    const report = await getReportById(req.user.id, String(req.params.id));
    if (!report) {
      res.status(404).json({ success: false, message: "Report not found" });
      return;
    }

    res.status(200).json({
      success: true,
      report,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Failed to retrieve incident report",
    });
  }
});

// ============================================================================
// PATCH /api/reports/:id (Update editable report fields)
// ============================================================================
router.patch("/:id", authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || !req.user.id) {
      res.status(401).json({ success: false, message: "Authentication required" });
      return;
    }

    const report = await updateIncidentReport(req.user.id, String(req.params.id), req.body);
    res.status(200).json({
      success: true,
      message: "Report updated successfully",
      report,
    });
  } catch (error: any) {
    const errorMsg = error instanceof Error ? error.message : "Failed to update incident report";
    const isNotFound = errorMsg.includes("not found");
    const isValidationErr =
      errorMsg.includes("required") ||
      errorMsg.includes("Invalid") ||
      errorMsg.includes("empty") ||
      errorMsg.includes("exceed");

    res.status(isNotFound ? 404 : isValidationErr ? 400 : 500).json({
      success: false,
      message: errorMsg,
    });
  }
});

// ============================================================================
// DELETE /api/reports/:id (Delete report)
// ============================================================================
router.delete("/:id", authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || !req.user.id) {
      res.status(401).json({ success: false, message: "Authentication required" });
      return;
    }

    await deleteIncidentReport(req.user.id, String(req.params.id));
    res.status(200).json({
      success: true,
      message: "Report deleted successfully",
    });
  } catch (error: any) {
    const errorMsg = error instanceof Error ? error.message : "Failed to delete incident report";
    const isNotFound = errorMsg.includes("not found");

    res.status(isNotFound ? 404 : 500).json({
      success: false,
      message: errorMsg,
    });
  }
});

// ============================================================================
// GET /api/reports/:id/pdf (Download backend-generated PDF)
// ============================================================================
router.get("/:id/pdf", authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || !req.user.id) {
      res.status(401).json({ success: false, message: "Authentication required" });
      return;
    }

    const { buffer, report } = await generateReportPdfBuffer(req.user.id, String(req.params.id));

    const safeFilename = `CyberGuard-Incident-Report-${report.reportId}.pdf`;
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${safeFilename}"`);
    res.setHeader("Content-Length", buffer.length);

    res.status(200).send(buffer);
  } catch (error: any) {
    const errorMsg = error instanceof Error ? error.message : "Failed to generate report PDF";
    const isNotFound = errorMsg.includes("not found");

    res.status(isNotFound ? 404 : 500).json({
      success: false,
      message: errorMsg,
    });
  }
});

export default router;
