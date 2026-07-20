// Dashboard feature types
export interface DashboardStats {
  totalCases: number;
  activeCases: number;
  resolvedCases: number;
  threatsDetected: number;
  urlsScanned: number;
  riskScore: number;
}

export interface RecentActivity {
  id: string;
  type: "case" | "scan" | "report" | "alert";
  title: string;
  description: string;
  timestamp: string;
}
