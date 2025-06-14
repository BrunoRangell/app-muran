
export interface CampaignHealthData {
  id: string;
  company_name: string;
  meta_account_id?: string;
  google_account_id?: string;
  today_spend: number;
  today_impressions: number;
  health_status: "healthy" | "warning" | "error" | "no-data";
  error_campaigns_count: number;
  last_activity: string;
}

export interface HealthMetrics {
  totalClients: number;
  healthyClients: number;
  problemClients: number;
  totalSpendToday: number;
  totalImpressionsToday: number;
  clientsWithErrors: number;
}

export type PlatformFilter = "all" | "meta" | "google";
export type StatusFilter = "all" | "problems" | "normal";
