
export interface Client {
  id: string;
  company_name: string;
  meta_account_id?: string;
  meta_ads_budget?: number;
  [key: string]: any;
}

export interface AnalysisResult {
  status: string;
  message: string;
  client: Client;
  reviewId: string | number;
}

export interface ReviewData {
  client_id: string;
  review_date: string;
  meta_daily_budget_current: number;
  meta_total_spent: number;
  meta_account_id: string;
  meta_account_name: string;
  updated_at: string;
}
