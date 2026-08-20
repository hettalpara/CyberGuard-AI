import { Schema, model, Document, Types } from "mongoose";

export interface IScan extends Document {
  userId: Types.ObjectId;
  url: string;
  normalizedUrl: string;
  domain: string;
  riskScore: number;
  riskLevel: "SAFE" | "SUSPICIOUS" | "DANGEROUS" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  risk: {
    score: number;
    level: "SAFE" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    reasons: string[];
  };
  ssl: {
    enabled: boolean;
    valid: boolean;
    status: string;
    issuer?: string;
    validDaysRemaining?: number;
    protocol?: string;
  };
  safeBrowsing: {
    checked: boolean;
    threatDetected: boolean;
    threatType?: string;
    status?: string;
    threats?: any[];
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
  summary: string;
  aiExplanation?: string;
  recommendedActions?: string[];
  scannedAt: Date;
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
      required: true,
      min: 0,
      max: 100,
    },
    riskLevel: {
      type: String,
      required: true,
      default: "SAFE",
    },
    risk: {
      score: { type: Number, default: 0 },
      level: { type: String, default: "SAFE" },
      reasons: { type: [String], default: [] },
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
      threatDetected: { type: Boolean, default: false },
      threatType: { type: String },
      status: { type: String, default: "not_checked" },
      threats: { type: [Schema.Types.Mixed], default: [] },
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
    scannedAt: {
      type: Date,
      default: Date.now,
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
