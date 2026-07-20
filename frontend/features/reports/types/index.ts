// Reports feature types
export type ReportStatus = "draft" | "generated" | "submitted" | "archived";
export type ReportFormat = "pdf" | "csv" | "json";

export interface CrimeReport {
  id: string;
  title: string;
  description: string;
  status: ReportStatus;
  crimeType: string;
  incidentDate: string;
  generatedAt: string;
  format: ReportFormat;
  downloadUrl?: string;
}

export interface ReportFilter {
  status?: ReportStatus;
  crimeType?: string;
  dateRange?: { from: string; to: string };
}
