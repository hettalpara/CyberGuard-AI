// Recovery feature types
export interface RecoveryGuide {
  id: string;
  crimeType: string;
  title: string;
  summary: string;
  steps: RecoveryStep[];
  resources: RecoveryResource[];
  lastUpdated: string;
}

export interface RecoveryStep {
  order: number;
  title: string;
  description: string;
  isCompleted?: boolean;
}

export interface RecoveryResource {
  title: string;
  url: string;
  type: "link" | "document" | "helpline" | "authority";
}
