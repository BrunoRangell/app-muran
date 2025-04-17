export interface MetaAccount {
  id: string;
  client_id: string;
  account_id: string;
  account_name: string;
  is_primary: boolean;
  budget_amount: number;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface GoogleAccount {
  id: string;
  client_id: string;
  account_id: string;
  account_name: string;
  is_primary: boolean;
  budget_amount: number;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface ClientWithReview {
  id: string;
  company_name: string;
  meta_account_id?: string;
  meta_ads_budget?: number;
  google_account_id?: string;
  google_ads_budget?: number;
  status: string;
  lastReview?: any;
  needsBudgetAdjustment?: boolean;
  meta_accounts?: MetaAccount[];
  // Propriedades necessárias para o Google Ads
  google_accounts?: GoogleAccount[];
  google_reviews?: any[];
}

export interface ClientAnalysisResult {
  clientId: string;
  reviewId: number | string;
  analysis: {
    totalDailyBudget: number;
    totalSpent: number;
    campaigns?: any[];
  };
}

export interface ReviewData {
  id: number;
  review_date: string;
  meta_daily_budget_current: number | null;
  meta_total_spent: number;
  google_daily_budget_current?: number | null;
  google_total_spent?: number;
  google_last_five_days_spent?: number;
  created_at: string;
  updated_at: string;
  client_account_id?: string;
  account_display_name?: string;
  using_custom_budget?: boolean;
  custom_budget_id?: string | null;
  custom_budget_amount?: number | null;
}
