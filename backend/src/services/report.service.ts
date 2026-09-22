// ============================================================================
// Incident Report Service — Phase 8
// Manages creation, retrieval, updates, and lifecycle transitions for formal
// incident reports with frozen security snapshots and strict data ownership.
// ============================================================================

import { Types } from "mongoose";
import {
  IncidentReport,
  IIncidentReport,
  IIncidentReportSnapshot,
  IncidentType,
  INCIDENT_TYPES,
  ReportStatus,
  REPORT_STATUSES,
} from "../models/IncidentReport";
import { Scan } from "../models/Scan";
import { generateIncidentReportPdf } from "./report-pdf.service";

export interface CreateReportDTO {
  scanId: string;
  incidentType: IncidentType;
  title: string;
  description: string;
  incidentDate?: string | Date;
  source?: string;
  affectedAccount?: string;
  userNotes?: string;
  status?: ReportStatus;
}

export interface UpdateReportDTO {
  incidentType?: IncidentType;
  title?: string;
  description?: string;
  incidentDate?: string | Date;
  source?: string;
  affectedAccount?: string;
  userNotes?: string;
  status?: ReportStatus;
}

export interface GetReportsOptions {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
}

/**
 * Generates a unique, human-readable report identifier (e.g. CG-2026-A1B2C3).
 */
export function generateUniqueReportId(): string {
  const currentYear = new Date().getFullYear();
  const randomHex = Math.random().toString(16).substring(2, 8).toUpperCase();
  const timestampPart = Date.now().toString(36).substring(3, 7).toUpperCase();
  return `CG-${currentYear}-${randomHex}${timestampPart}`.substring(0, 15);
}

/**
 * Creates a formal Incident Report from an existing user scan.
 * Verifies scan ownership and takes an immutable snapshot of all threat findings.
 */
export async function createIncidentReport(
  userId: string,
  dto: CreateReportDTO
): Promise<IIncidentReport> {
  if (!userId || !Types.ObjectId.isValid(userId)) {
    throw new Error("Invalid or missing user ID");
  }

  if (!dto.scanId || !Types.ObjectId.isValid(dto.scanId)) {
    throw new Error("Invalid or missing scan ID");
  }

  if (!dto.incidentType || !INCIDENT_TYPES.includes(dto.incidentType)) {
    throw new Error(
      `Invalid incident type. Allowed values: ${INCIDENT_TYPES.join(", ")}`
    );
  }

  if (!dto.title || typeof dto.title !== "string" || dto.title.trim() === "") {
    throw new Error("Title is required");
  }
  if (dto.title.length > 200) {
    throw new Error("Title cannot exceed 200 characters");
  }

  if (!dto.description || typeof dto.description !== "string" || dto.description.trim() === "") {
    throw new Error("Description is required");
  }
  if (dto.description.length > 5000) {
    throw new Error("Description cannot exceed 5000 characters");
  }

  if (dto.source && dto.source.length > 500) {
    throw new Error("Source cannot exceed 500 characters");
  }

  if (dto.affectedAccount && dto.affectedAccount.length > 320) {
    throw new Error("Affected account cannot exceed 320 characters");
  }

  if (dto.userNotes && dto.userNotes.length > 5000) {
    throw new Error("User notes cannot exceed 5000 characters");
  }

  // 1. Verify scan exists and belongs strictly to the authenticated user
  const scan = await Scan.findOne({
    _id: new Types.ObjectId(dto.scanId),
    userId: new Types.ObjectId(userId),
  });

  if (!scan) {
    // Return 404 message to prevent revealing existence of scans across users
    throw new Error("Scan not found");
  }

  // 2. Prevent duplicates: If a report already exists for this scanId and user, update it
  const existingForScan = await IncidentReport.findOne({
    scanId: scan._id,
    userId: new Types.ObjectId(userId),
  });

  if (existingForScan) {
    existingForScan.incidentType = dto.incidentType;
    existingForScan.title = dto.title.trim();
    existingForScan.description = dto.description.trim();
    if (dto.incidentDate) existingForScan.incidentDate = new Date(dto.incidentDate);
    if (dto.source !== undefined) existingForScan.source = dto.source.trim();
    if (dto.affectedAccount !== undefined) existingForScan.affectedAccount = dto.affectedAccount.trim();
    if (dto.userNotes !== undefined) existingForScan.userNotes = dto.userNotes.trim();
    if (dto.status && REPORT_STATUSES.includes(dto.status)) {
      existingForScan.status = dto.status;
      if (dto.status === "FINAL" && !existingForScan.generatedAt) {
        existingForScan.generatedAt = new Date();
      }
    }
    await existingForScan.save();
    return existingForScan;
  }

  // 3. Generate unique reportId
  let reportId = generateUniqueReportId();
  let existing = await IncidentReport.findOne({ reportId });
  while (existing) {
    reportId = generateUniqueReportId();
    existing = await IncidentReport.findOne({ reportId });
  }

  // 4. Create immutable security snapshot from the verified scan
  const snapshot = {
    url: scan.url,
    normalizedUrl: scan.normalizedUrl,
    domain: scan.domain,
    riskScore: scan.riskScore !== undefined ? scan.riskScore : scan.risk?.score ?? null,
    riskLevel: scan.riskLevel || scan.risk?.level || "SAFE",
    confidence: scan.confidence ?? 85,
    riskCalculationVersion: scan.riskCalculationVersion,
    analysisStatus: scan.analysisStatus,
    safeBrowsing: scan.safeBrowsing,
    virusTotal: scan.virusTotal,
    urlhaus: scan.urlhaus,
    urlIntelligence: scan.urlIntelligence,
    sslAnalysis: scan.sslAnalysis,
    ssl: scan.ssl,
    aiAnalysis: scan.aiAnalysis,
    riskFactors: scan.riskFactors || scan.risk?.factors || [],
    findings: (scan as any).findings || scan.risk?.findings || [],
    summary: scan.summary || scan.aiExplanation || "",
    scannedAt: scan.scannedAt || scan.createdAt || new Date(),
  };

  const status: ReportStatus = dto.status && REPORT_STATUSES.includes(dto.status) ? dto.status : "DRAFT";

  const report = await IncidentReport.create({
    reportId,
    userId: new Types.ObjectId(userId),
    scanId: scan._id,
    incidentType: dto.incidentType,
    title: dto.title.trim(),
    description: dto.description.trim(),
    incidentDate: dto.incidentDate ? new Date(dto.incidentDate) : new Date(),
    source: dto.source ? dto.source.trim() : "",
    affectedAccount: dto.affectedAccount ? dto.affectedAccount.trim() : "",
    userNotes: dto.userNotes ? dto.userNotes.trim() : "",
    status,
    snapshot,
    generatedAt: status === "FINAL" ? new Date() : undefined,
  });

  return report;
}

/**
 * Automatically creates an official Incident Report from a completed Scan.
 * Ensures data integrity, accurate security snapshot, and strict user ownership.
 * Prevents duplicate reports for the same scan.
 */
export async function createAutomaticIncidentReportForScan(
  scan: any,
  userId: string
): Promise<IIncidentReport> {
  if (!userId || !Types.ObjectId.isValid(userId)) {
    throw new Error("Invalid or missing user ID");
  }

  if (!scan || !scan._id) {
    throw new Error("Invalid or missing scan object");
  }

  const userObjectId = new Types.ObjectId(userId);

  // 1. Prevent duplicate reports for the same scan
  const existingReport = await IncidentReport.findOne({
    scanId: scan._id,
    userId: userObjectId,
  });

  if (existingReport) {
    return existingReport;
  }

  // 2. Derive incident type based on actual security findings
  let incidentType: IncidentType = "Suspicious URL";
  const hasMalware =
    scan.safeBrowsing?.threatTypes?.includes("MALWARE") ||
    scan.urlhaus?.match ||
    Boolean(scan.urlhaus?.threatType?.toLowerCase().includes("malware")) ||
    (Array.isArray(scan.findings) && scan.findings.some((f: any) => f.finding?.includes("MALWARE")));

  const hasPhishing =
    scan.safeBrowsing?.threatTypes?.includes("SOCIAL_ENGINEERING") ||
    (Array.isArray(scan.findings) && scan.findings.some((f: any) => f.finding?.includes("PHISHING")));

  if (hasMalware) {
    incidentType = "Malware";
  } else if (hasPhishing) {
    incidentType = "Phishing";
  } else if (scan.riskLevel === "CRITICAL" || scan.riskLevel === "HIGH") {
    incidentType = "Suspicious URL";
  }

  // 3. Format title and description
  const targetHost = scan.domain || scan.normalizedUrl || "Target";
  const title = `Automated Security Scan: ${targetHost}`.substring(0, 200);

  const scoreText = scan.riskScore !== null && scan.riskScore !== undefined ? `${scan.riskScore}/100` : "Inconclusive";
  const summaryText = scan.summary || scan.aiExplanation || "Automated multi-engine threat intelligence triage completed.";
  const description = `${summaryText} Official Risk Classification: ${scan.riskLevel || "SAFE"} (${scoreText}).`.substring(0, 5000);

  // 4. Generate unique reportId
  let reportId = generateUniqueReportId();
  let collision = await IncidentReport.findOne({ reportId });
  while (collision) {
    reportId = generateUniqueReportId();
    collision = await IncidentReport.findOne({ reportId });
  }

  // 5. Build immutable security snapshot
  const snapshot: IIncidentReportSnapshot = {
    url: scan.url,
    normalizedUrl: scan.normalizedUrl,
    domain: scan.domain,
    riskScore: scan.riskScore !== undefined ? scan.riskScore : scan.risk?.score ?? null,
    riskLevel: scan.riskLevel || scan.risk?.level || "SAFE",
    confidence: scan.confidence ?? 85,
    riskCalculationVersion: scan.riskCalculationVersion || "2.0",
    analysisStatus: scan.analysisStatus || "COMPLETE",
    safeBrowsing: scan.safeBrowsing,
    virusTotal: scan.virusTotal,
    urlhaus: scan.urlhaus,
    urlIntelligence: scan.urlIntelligence,
    sslAnalysis: scan.sslAnalysis,
    ssl: scan.ssl,
    aiAnalysis: scan.aiAnalysis,
    riskFactors: scan.riskFactors || scan.risk?.factors || [],
    findings: scan.findings || scan.risk?.findings || [],
    summary: scan.summary || scan.aiExplanation || "",
    scannedAt: scan.scannedAt || scan.createdAt || new Date(),
  };

  // 6. Create report document with FINAL status
  const report = await IncidentReport.create({
    reportId,
    userId: userObjectId,
    scanId: scan._id,
    incidentType,
    title,
    description,
    incidentDate: scan.scannedAt || new Date(),
    source: scan.url,
    affectedAccount: "",
    userNotes: "Automatically generated by CyberGuard AI following URL security analysis.",
    status: "FINAL",
    snapshot,
    generatedAt: new Date(),
  });

  // 7. Update Scan with generated reportId
  try {
    await Scan.updateOne({ _id: scan._id }, { $set: { reportId: report.reportId } });
  } catch {
    // Non-fatal
  }

  return report;
}

/**
 * Returns paginated reports strictly for the authenticated user.
 */
export async function getUserReports(
  userId: string,
  options?: GetReportsOptions
): Promise<{
  reports: IIncidentReport[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}> {
  if (!userId || !Types.ObjectId.isValid(userId)) {
    throw new Error("Invalid or missing user ID");
  }

  const page = Math.max(1, options?.page || 1);
  const limit = Math.min(50, Math.max(1, options?.limit || 10));
  const skip = (page - 1) * limit;

  const query: any = { userId: new Types.ObjectId(userId) };

  if (options?.status && REPORT_STATUSES.includes(options.status as any)) {
    query.status = options.status;
  }

  if (options?.search && options.search.trim()) {
    const searchRegex = new RegExp(options.search.trim(), "i");
    query.$or = [
      { reportId: searchRegex },
      { title: searchRegex },
      { incidentType: searchRegex },
      { "snapshot.url": searchRegex },
      { "snapshot.domain": searchRegex },
    ];
  }

  const [reports, total] = await Promise.all([
    IncidentReport.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
    IncidentReport.countDocuments(query),
  ]);

  const pages = Math.ceil(total / limit) || 1;

  return {
    reports,
    total,
    page,
    limit,
    pages,
  };
}

/**
 * Finds a single report by Mongo ObjectId or human-readable reportId, scoped to user.
 */
export async function getReportById(
  userId: string,
  idOrReportId: string
): Promise<IIncidentReport | null> {
  if (!userId || !Types.ObjectId.isValid(userId)) {
    throw new Error("Invalid or missing user ID");
  }

  if (!idOrReportId || typeof idOrReportId !== "string") {
    return null;
  }

  const query: any = { userId: new Types.ObjectId(userId) };
  if (Types.ObjectId.isValid(idOrReportId)) {
    query._id = new Types.ObjectId(idOrReportId);
  } else {
    query.reportId = idOrReportId.trim().toUpperCase();
  }

  return IncidentReport.findOne(query);
}

/**
 * Updates user-editable fields on an existing report.
 * Explicitly rejects or ignores attempts to alter the frozen security snapshot or scores.
 */
export async function updateIncidentReport(
  userId: string,
  idOrReportId: string,
  dto: UpdateReportDTO
): Promise<IIncidentReport> {
  const report = await getReportById(userId, idOrReportId);
  if (!report) {
    throw new Error("Report not found");
  }

  if (dto.incidentType !== undefined) {
    if (!INCIDENT_TYPES.includes(dto.incidentType)) {
      throw new Error(`Invalid incident type. Allowed values: ${INCIDENT_TYPES.join(", ")}`);
    }
    report.incidentType = dto.incidentType;
  }

  if (dto.title !== undefined) {
    if (!dto.title.trim()) throw new Error("Title cannot be empty");
    if (dto.title.length > 200) throw new Error("Title cannot exceed 200 characters");
    report.title = dto.title.trim();
  }

  if (dto.description !== undefined) {
    if (!dto.description.trim()) throw new Error("Description cannot be empty");
    if (dto.description.length > 5000) throw new Error("Description cannot exceed 5000 characters");
    report.description = dto.description.trim();
  }

  if (dto.incidentDate !== undefined) {
    report.incidentDate = new Date(dto.incidentDate);
  }

  if (dto.source !== undefined) {
    if (dto.source.length > 500) throw new Error("Source cannot exceed 500 characters");
    report.source = dto.source.trim();
  }

  if (dto.affectedAccount !== undefined) {
    if (dto.affectedAccount.length > 320) throw new Error("Affected account cannot exceed 320 characters");
    report.affectedAccount = dto.affectedAccount.trim();
  }

  if (dto.userNotes !== undefined) {
    if (dto.userNotes.length > 5000) throw new Error("User notes cannot exceed 5000 characters");
    report.userNotes = dto.userNotes.trim();
  }

  if (dto.status !== undefined) {
    if (!REPORT_STATUSES.includes(dto.status)) {
      throw new Error(`Invalid status. Allowed values: ${REPORT_STATUSES.join(", ")}`);
    }
    report.status = dto.status;
    if (dto.status === "FINAL" && !report.generatedAt) {
      report.generatedAt = new Date();
    }
  }

  // Notice: report.snapshot is NEVER touched or overwritten here!
  await report.save();
  return report;
}

/**
 * Deletes or archives a report. The underlying scan is never deleted.
 */
export async function deleteIncidentReport(
  userId: string,
  idOrReportId: string
): Promise<boolean> {
  const report = await getReportById(userId, idOrReportId);
  if (!report) {
    throw new Error("Report not found");
  }

  await IncidentReport.deleteOne({ _id: report._id });
  return true;
}

/**
 * Generates a PDF buffer for an authenticated user's report.
 */
export async function generateReportPdfBuffer(
  userId: string,
  idOrReportId: string
): Promise<{ buffer: Buffer; report: IIncidentReport }> {
  const report = await getReportById(userId, idOrReportId);
  if (!report) {
    throw new Error("Report not found");
  }

  const buffer = await generateIncidentReportPdf(report);
  return { buffer, report };
}
