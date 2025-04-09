
export interface Review {
  id: string | number;
  client_id: string;
  review_date: string;
  meta_account_id?: string;
  meta_account_name?: string;
  meta_total_spent?: number;
  meta_daily_budget_current?: number;
  google_account_id?: string;
  google_account_name?: string;
  google_total_spent?: number;
  google_daily_budget_current?: number;
  google_last_5_days_avg?: number;
  created_at: string;
  updated_at: string;
  using_custom_budget?: boolean;
  custom_budget_id?: string;
  custom_budget_amount?: number;
}

export interface ClientWithReview {
  id: string;
  company_name: string;
  status: string;
  meta_account_id?: string;
  meta_ads_budget?: number;
  google_account_id?: string;
  google_ads_budget?: number;
  lastReview?: Review | null;
  needsBudgetAdjustment?: boolean;
  usingCustomBudget?: boolean;
  actualBudgetAmount?: number;
}
