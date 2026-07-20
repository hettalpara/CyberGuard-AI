// History feature types
export type HistoryActionType = "scan" | "report" | "chat" | "case_update" | "login";

export interface HistoryEntry {
  id: string;
  action: HistoryActionType;
  title: string;
  description: string;
  metadata?: Record<string, unknown>;
  timestamp: string;
}

export interface HistoryFilter {
  actionType?: HistoryActionType;
  dateRange?: { from: string; to: string };
  search?: string;
}
