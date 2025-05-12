
export interface Client {
  id: string;
  company_name: string;
  status: string;
  meta_account_id?: string | null;
  meta_ads_budget?: number | null;
  google_account_id?: string | null;
  google_ads_budget?: number | null;
  created_at?: string;
  updated_at?: string;
}

export interface Review {
  id: string;
  client_id: string;
  review_date: string;
  created_at: string;
  updated_at: string;
  
  // Meta
  meta_daily_budget_current?: number | null;
  meta_total_spent?: number | null;
  meta_account_id?: string | null;
  meta_account_name?: string | null;
  meta_last_five_days_spent?: number | null;
  
  // Google
  google_daily_budget_current?: number | null;
  google_total_spent?: number | null;
  google_account_id?: string | null;
  google_account_name?: string | null;
  google_last_five_days_spent?: number | null;
  
  // Budget
  using_custom_budget?: boolean;
  custom_budget_id?: string | null;
  custom_budget_amount?: number | null;
  custom_budget_start_date?: string | null;
  custom_budget_end_date?: string | null;
}

export interface ClientWithReview extends Client {
  lastReview?: Review | null;
}

export interface ClientsSortOptions {
  sortField: 'company_name' | 'budget' | 'total_spent' | 'needs_adjustment';
  sortOrder: 'asc' | 'desc';
}
