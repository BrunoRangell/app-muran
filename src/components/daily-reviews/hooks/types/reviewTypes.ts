
// Tipos relacionados ao cliente
export interface ClientWithReview {
  id: string;
  company_name: string;
  meta_account_id: string | null;
  meta_ads_budget: number;
  google_account_id?: string | null;
  google_ads_budget?: number;
  lastReview?: ReviewData;
  needsBudgetAdjustment?: boolean;
  status: string; // Adicionando o campo status que estava faltando
}

// Tipos relacionados à revisão
export interface ReviewData {
  id: number;
  review_date: string;
  meta_daily_budget_current: number | null;
  meta_total_spent: number;
  google_daily_budget_current?: number | null;
  google_total_spent?: number;
  google_last_five_days_spent?: number; // Novo campo para gasto dos últimos 5 dias
  created_at: string;
  updated_at: string;
  idealDailyBudget?: number;
  recommendation?: string | null;
  // Propriedades para orçamentos personalizados
  using_custom_budget?: boolean;
  custom_budget_id?: string | null;
  custom_budget_amount?: number | null;
  custom_budget_end_date?: string | null;
}

// Tipos relacionados à análise
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
  results: ClientAnalysisResult[];
  errors: {
    clientId: string;
    clientName: string;
    error: string;
  }[];
}

// Tipos relacionados a orçamentos personalizados
export interface CustomBudget {
  id: string;
  client_id: string;
  budget_amount: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  description?: string | null;
}
