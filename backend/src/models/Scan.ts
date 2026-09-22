import { Schema, model, Document, Types } from "mongoose";

export interface IScan extends Document {
  userId: Types.ObjectId;
  url: string;
  normalizedUrl: string;
  domain: string;
  riskScore: number | null;
  riskLevel: string;
  confidence: number;
  riskCalculationVersion?: string;
  analysisStatus?: string;
  risk: {
    score: number | null;
    level: string;
    reasons: string[];
    confidence: number;
    factors: Array<{
      name: string;
      score: number | null;
      weight: number;
      contribution: number;
      impact: string;
      status: string;
      reason: string;
      available: boolean;
      details?: Record<string, unknown>;
    }>;
    findings?: Array<{
      source: string;
      finding: string;
      severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFO";
      explanation: string;
      evidence?: string;
      isConfirmedThreat?: boolean;
    }>;
    analysisStatus?: string;
  };
  ssl: {
    enabled: boolean;
    valid: boolean;
    status: string;
    issuer?: string;
    validDaysRemaining?: number;
    protocol?: string;
  };
  sslAnalysis?: {
    status: string;
    protocol: string;
    score: number | null;
    level: string | null;
    certificate: Record<string, unknown>;
    reason: string;
    checkedAt: string;
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
    evidence: Record<string, unknown>;
  };
  safeBrowsing: {
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
  urlhaus?: {
    available: boolean;
    status: string;
    match: boolean;
    threatType?: string;
    tags?: string[];
    confidence?: number;
    reason?: string;
    checkedAt?: string;
    error?: string;
  };
  virusTotal: {
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
    enginesFlagged?: number;
    permalink?: string | null;
    status?: string;
    error?: string;
  };
  riskFactors: any[];
  findings?: Array<{
    source: string;
    finding: string;
    severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFO";
    explanation: string;
    evidence?: string;
    isConfirmedThreat?: boolean;
  }>;
  summary: string;
  aiExplanation?: string;
  recommendedActions?: string[];
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
  scannedAt: Date;
  reportId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const scanSchema = new Schema<IScan>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    url: {
      type: String,
      required: true,
      trim: true,
    },
    normalizedUrl: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    domain: {
      type: String,
      required: true,
      trim: true,
    },
    riskScore: {
      type: Number,
      required: false,
      min: 0,
      max: 100,
      default: null,
    },
    riskLevel: {
      type: String,
      required: true,
      default: "SAFE",
    },
    confidence: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    riskCalculationVersion: {
      type: String,
      default: "2.0",
    },
    analysisStatus: {
      type: String,
      default: "COMPLETE",
    },
    risk: {
      score: { type: Number, default: null },
      level: { type: String, default: "SAFE" },
      reasons: { type: [String], default: [] },
      confidence: { type: Number, default: 0 },
      factors: { type: [Schema.Types.Mixed], default: [] },
      findings: { type: [Schema.Types.Mixed], default: [] },
      analysisStatus: { type: String, default: "COMPLETE" },
    },
    urlIntelligence: {
      status: { type: String, default: "UNAVAILABLE" },
      score: { type: Number, default: null },
      level: { type: String, default: null },
      indicators: { type: [Schema.Types.Mixed], default: [] },
      reasons: { type: [String], default: [] },
      evidence: { type: Schema.Types.Mixed, default: {} },
    },
    sslAnalysis: {
      status: { type: String, default: "UNAVAILABLE" },
      protocol: { type: String },
      score: { type: Number, default: null },
      level: { type: String, default: null },
      certificate: { type: Schema.Types.Mixed, default: {} },
      reason: { type: String },
      checkedAt: { type: String },
    },
    ssl: {
      enabled: { type: Boolean, default: false },
      valid: { type: Boolean, default: false },
      status: { type: String, default: "unavailable" },
      issuer: { type: String },
      validDaysRemaining: { type: Number },
      protocol: { type: String },
    },
    safeBrowsing: {
      checked: { type: Boolean, default: false },
      available: { type: Boolean, default: false },
      status: { type: String, default: "UNAVAILABLE" },
      threatDetected: { type: Boolean, default: false },
      threatTypes: { type: [String], default: [] },
      score: { type: Number, default: null },
      reason: { type: String },
      checkedAt: { type: String },
      error: { type: String },
    },
    urlhaus: {
      available: { type: Boolean, default: false },
      status: { type: String, default: "UNAVAILABLE" },
      match: { type: Boolean, default: false },
      threatType: { type: String },
      tags: { type: [String], default: [] },
      confidence: { type: Number },
      reason: { type: String },
      checkedAt: { type: String },
      error: { type: String },
    },
    virusTotal: {
      checked: { type: Boolean, default: false },
      available: { type: Boolean, default: false },
      malicious: { type: Boolean, default: false },
      suspicious: { type: Boolean, default: false },
      harmless: { type: Number, default: 0 },
      maliciousCount: { type: Number, default: 0 },
      suspiciousCount: { type: Number, default: 0 },
      undetectedCount: { type: Number, default: 0 },
      totalEngines: { type: Number, default: 0 },
      detectionRatio: { type: String, default: "0 / 0" },
      enginesFlagged: { type: Number, default: 0 },
      permalink: { type: String, default: null },
      status: { type: String, default: "not_checked" },
      error: { type: String },
    },
    riskFactors: {
      type: Schema.Types.Mixed,
      default: [],
    },
    findings: {
      type: Schema.Types.Mixed,
      default: [],
    },
    summary: {
      type: String,
      required: true,
    },
    aiExplanation: {
      type: String,
    },
    recommendedActions: {
      type: [String],
      default: [],
    },
    aiAnalysis: {
      available: { type: Boolean, default: false },
      summary: { type: String },
      threatType: { type: String },
      severity: { type: String },
      explanation: { type: String },
      keyIndicators: { type: [String], default: [] },
      recommendedActions: { type: [String], default: [] },
      confidenceNote: { type: String },
      generatedAt: { type: Date },
      model: { type: String },
      error: { type: String },
    },
    scannedAt: {
      type: Date,
      default: Date.now,
    },
    reportId: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret: Record<string, any>) => {
        ret.id = ret._id ? ret._id.toString() : ret.id;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

scanSchema.index({ userId: 1, createdAt: -1 });

export const Scan = model<IScan>("Scan", scanSchema);
export default Scan;
