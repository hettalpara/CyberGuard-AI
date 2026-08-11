import { apiClient } from "@/lib/api-client";
import type { ApiResponse, ScanRequest, UrlScanResult } from "@/types";

export const analyzerService = {
  scanUrl: (data: ScanRequest) =>
    apiClient.post<ApiResponse<UrlScanResult>>("/analyzer/scan", data),

  getScanHistory: () =>
    apiClient.get<ApiResponse<UrlScanResult[]>>("/analyzer/history"),
};
