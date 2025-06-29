
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
  review_date: string;
  google_daily_budget_current: number;
  google_total_spent: number;
  google_last_five_days_spent?: number;
  google_account_id?: string;
  google_account_name?: string;
  client_account_id?: string;
  account_display_name?: string;
  created_at: string;
  updated_at: string;
  using_custom_budget?: boolean;
  custom_budget_amount?: number;
  custom_budget_id?: string;
  custom_budget_end_date?: string;
  
  // Novos campos para gastos individuais dos últimos 5 dias
  google_day_1_spent?: number;
  google_day_2_spent?: number;
  google_day_3_spent?: number;
  google_day_4_spent?: number;
  google_day_5_spent?: number;
  
  // Novos campos para controlar avisos ignorados
  warning_ignored_today?: boolean;
  warning_ignored_date?: string;
  
  // Adicionando campos compatíveis para evitar erros no código existente
  meta_account_id?: string;
  meta_daily_budget_current?: number;
  meta_total_spent?: number;
  idealDailyBudget?: number;
  custom_budget_start_date?: string;
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
