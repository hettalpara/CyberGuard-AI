// ============================================================================
// Case Types
// Domain types for cyber crime cases — the primary business entity.
// ============================================================================

export type CaseStatus =
  | "open"
  | "investigating"
  | "pending_review"
  | "resolved"
  | "closed"
  | "escalated";

export type CasePriority = "critical" | "high" | "medium" | "low";

export type CrimeCategory =
  | "phishing"
  | "ransomware"
  | "identity_theft"
  | "data_breach"
  | "cyber_fraud"
  | "malware"
  | "social_engineering"
  | "ddos"
  | "insider_threat"
  | "other";

export interface CyberCase {
  id: string;
  caseNumber: string;
  title: string;
  description: string;
  status: CaseStatus;
  priority: CasePriority;
  category: CrimeCategory;
  assignedTo?: string;
  reportedBy: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  tags: string[];
  attachments: CaseAttachment[];
}

export interface CaseAttachment {
  id: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSizeBytes: number;
  uploadedAt: string;
}

export interface CaseNote {
  id: string;
  caseId: string;
  authorId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}
