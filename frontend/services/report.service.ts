import { apiClient } from "@/lib/api-client";
import type { ApiResponse } from "@/types";
import type { CrimeReport, ReportFilter } from "@/features/reports/types";

export const reportService = {
  getReports: (filters?: ReportFilter) =>
    apiClient.get<ApiResponse<CrimeReport[]>>("/reports", { params: filters }),

  generateReport: (caseId: string) =>
    apiClient.post<ApiResponse<CrimeReport>>(`/reports/generate`, { caseId }),
};
