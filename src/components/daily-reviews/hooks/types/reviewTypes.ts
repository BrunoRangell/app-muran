
export interface ClientWithReview {
  id: string;
  company_name: string;
  meta_account_id: string;
  meta_ads_budget: number;
  lastReview?: ReviewData | null;
  daily_budget_reviews?: ReviewData[];
}

export interface ReviewData {
  id: number;
  client_id: string;
  review_date: string;
  meta_daily_budget_current: number;
  meta_total_spent: number;
  created_at: string;
  updated_at: string;
  using_custom_budget?: boolean;
  custom_budget_id?: string;
  custom_budget_amount?: number;
  custom_budget_end_date?: string;
  custom_budget_start_date?: string;
  needsBudgetAdjustment?: boolean;
}

export interface ClientAnalysisResult {
  clientId: string;
  reviewId: number;
  analysis: {
    totalDailyBudget: number;
    totalSpent: number;
    campaigns?: any[];
  };
}

export interface BatchReviewResult {
  results: any[];
  errors: any[];
}
