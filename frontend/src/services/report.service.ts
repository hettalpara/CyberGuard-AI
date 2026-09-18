// ============================================================================
// Incident Report Client Service — Phase 8
// Interacts with backend /api/reports endpoints for incident report management
// and binary PDF generation/download streaming.
// ============================================================================

import { apiClient } from "@/lib/api-client";
import type {
  ApiResponse,
  IncidentReport,
  CreateReportInput,
  UpdateReportInput,
} from "@/types";

export interface ReportPaginationResult {
  reports: IncidentReport[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export const reportService = {
  /**
   * Create a new formal Incident Report from a completed Scan.
   */
  createReport: (data: CreateReportInput) =>
    apiClient.post<{ success: boolean; message: string; report: IncidentReport }>(
      "/reports",
      data
    ),

  /**
   * Retrieve paginated list of user's incident reports.
   */
  getReports: (params?: { page?: number; limit?: number; status?: string; search?: string }) =>
    apiClient.get<{
      success: boolean;
      data: IncidentReport[];
      pagination: { page: number; limit: number; total: number; pages: number };
    }>("/reports", { params }),

  /**
   * Retrieve a single incident report by Mongo ID or human-readable Report ID.
   */
  getReportById: (id: string) =>
    apiClient.get<{ success: boolean; report: IncidentReport }>(`/reports/${id}`),

  /**
   * Update user-editable incident report fields.
   */
  updateReport: (id: string, data: UpdateReportInput) =>
    apiClient.patch<{ success: boolean; message: string; report: IncidentReport }>(
      `/reports/${id}`,
      data
    ),

  /**
   * Delete an incident report.
   */
  deleteReport: (id: string) =>
    apiClient.delete<{ success: boolean; message: string }>(`/reports/${id}`),

  /**
   * Downloads the backend-generated PDF for a given incident report.
   * Streams the binary arraybuffer, creates a temporary anchor, and initiates download.
   */
  downloadReportPdf: async (id: string, fallbackFilename?: string): Promise<void> => {
    const response = await apiClient.get(`/reports/${id}/pdf`, {
      responseType: "blob",
    });

    const blob = new Blob([response.data], { type: "application/pdf" });
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = downloadUrl;

    // Extract filename from header if present
    const disposition = response.headers["content-disposition"];
    let filename = fallbackFilename || `CyberGuard-Incident-Report-${id}.pdf`;
    if (disposition && disposition.includes("filename=")) {
      const match = disposition.match(/filename="?([^"]+)"?/);
      if (match && match[1]) {
        filename = match[1];
      }
    }

    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
  },
};
