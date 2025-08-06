
export interface GoogleAccount {
  id: string;
  client_id: string;
  account_id: string;
  account_name: string;
  budget_amount: number;
  is_primary: boolean;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface MetaAccount {
  id: string;
  client_id: string;
  account_id: string;
  account_name: string;
  budget_amount: number;
  is_primary: boolean;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface GoogleReview {
  id: string;
  client_id: string;
  account_id: string;
  review_date: string;
  platform: string;
  daily_budget_current: number;
  total_spent: number;
  last_five_days_spent?: number;
  day_1_spent?: number;
  day_2_spent?: number;
  day_3_spent?: number;
  day_4_spent?: number;
  day_5_spent?: number;
  created_at: string;
  updated_at: string;
  using_custom_budget?: boolean;
  custom_budget_amount?: number;
  custom_budget_id?: string;
  custom_budget_start_date?: string;
  custom_budget_end_date?: string;
  warning_ignored_today?: boolean;
  warning_ignored_date?: string;
  
  // Campos compatíveis para Google Ads
  google_daily_budget_current?: number;
  google_total_spent?: number;
  google_last_five_days_spent?: number;
  google_account_id?: string;
  google_account_name?: string;
  google_day_1_spent?: number;
  google_day_2_spent?: number;
  google_day_3_spent?: number;
  google_day_4_spent?: number;
  google_day_5_spent?: number;
  
  // Campos compatíveis para Meta Ads
  meta_account_id?: string;
  meta_daily_budget_current?: number;
  meta_total_spent?: number;
  
  // Campos de exibição
  client_account_id?: string;
  account_display_name?: string;
  idealDailyBudget?: number;
}

export interface ClientWithReview {
  id: string;
  company_name: string;
  contact_name?: string;
  contact_phone?: string;
  status: string;
  google_account_id?: string;
  google_ads_budget?: number;
  meta_account_id?: string;
  meta_ads_budget?: number;
  google_accounts?: GoogleAccount[];
  meta_accounts?: MetaAccount[]; // Adicionado para compatibilidade
  lastReview?: GoogleReview | null;
  google_reviews?: GoogleReview[];
  needsBudgetAdjustment?: boolean;
}
