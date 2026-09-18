// ============================================================================
// IncidentReport Model — Phase 8
// Formal incident reporting with immutable security scan snapshots,
// user ownership, and lifecycle status tracking (DRAFT, FINAL, ARCHIVED).
// ============================================================================

import { Schema, model, Document, Types } from "mongoose";

export const INCIDENT_TYPES = [
  "Phishing",
  "Scam",
  "Suspicious URL",
  "Malware",
  "Account Compromise",
  "Online Fraud",
  "Suspicious Message",
  "Other",
] as const;

export type IncidentType = (typeof INCIDENT_TYPES)[number];

export const REPORT_STATUSES = ["DRAFT", "FINAL", "ARCHIVED"] as const;
export type ReportStatus = (typeof REPORT_STATUSES)[number];

export interface IIncidentReportSnapshot {
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
    error?: string;
  };
  urlhaus?: {
    available: boolean;
    status: string;
    match: boolean;
    threatType?: string;
    tags?: string[];
    reason?: string;
    checkedAt?: string;
    error?: string;
  };
  urlIntelligence?: {
    status: string;
    score: number | null;
    level: string;
    indicators: Array<{
      name: string;
      score: number;
      reason: string;
    }>;
    reasons: string[];
    evidence?: Record<string, unknown>;
  };
  sslAnalysis?: {
    status: string;
    protocol: string;
    score: number | null;
    level: string | null;
    certificate?: Record<string, unknown>;
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
    generatedAt?: Date;
    model?: string;
    error?: string;
  };
  riskFactors?: any[];
  summary?: string;
  scannedAt: Date;
}

export interface IIncidentReport extends Document {
  _id: Types.ObjectId;
  reportId: string;
  userId: Types.ObjectId;
  scanId: Types.ObjectId;

  incidentType: IncidentType;
  title: string;
  description: string;
  incidentDate: Date;

  source?: string;
  affectedAccount?: string;
  userNotes?: string;

  status: ReportStatus;

  snapshot: IIncidentReportSnapshot;

  generatedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const incidentReportSchema = new Schema<IIncidentReport>(
  {
    reportId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    scanId: {
      type: Schema.Types.ObjectId,
      ref: "Scan",
      required: true,
      index: true,
    },
    incidentType: {
      type: String,
      required: true,
      enum: INCIDENT_TYPES,
    },
    title: {
      type: String,
      required: true,
      maxlength: 200,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      maxlength: 5000,
      trim: true,
    },
    incidentDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    source: {
      type: String,
      maxlength: 500,
      trim: true,
      default: "",
    },
    affectedAccount: {
      type: String,
      maxlength: 320,
      trim: true,
      default: "",
    },
    userNotes: {
      type: String,
      maxlength: 5000,
      trim: true,
      default: "",
    },
    status: {
      type: String,
      required: true,
      enum: REPORT_STATUSES,
      default: "DRAFT",
      index: true,
    },
    snapshot: {
      url: { type: String, required: true },
      normalizedUrl: { type: String, required: true },
      domain: { type: String, required: true },
      riskScore: { type: Number, default: null },
      riskLevel: { type: String, required: true },
      confidence: { type: Number, required: true },
      riskCalculationVersion: { type: String },
      analysisStatus: { type: String },
      safeBrowsing: { type: Schema.Types.Mixed },
      virusTotal: { type: Schema.Types.Mixed },
      urlhaus: { type: Schema.Types.Mixed },
      urlIntelligence: { type: Schema.Types.Mixed },
      sslAnalysis: { type: Schema.Types.Mixed },
      ssl: { type: Schema.Types.Mixed },
      aiAnalysis: { type: Schema.Types.Mixed },
      riskFactors: { type: [Schema.Types.Mixed], default: [] },
      summary: { type: String, default: "" },
      scannedAt: { type: Date, required: true },
    },
    generatedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for user query efficiency
incidentReportSchema.index({ userId: 1, createdAt: -1 });
incidentReportSchema.index({ userId: 1, status: 1 });

export const IncidentReport = model<IIncidentReport>("IncidentReport", incidentReportSchema);
