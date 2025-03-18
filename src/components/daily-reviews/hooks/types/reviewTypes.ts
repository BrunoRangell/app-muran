
// Tipos relacionados ao cliente
export interface ClientWithReview {
  id: string;
  company_name: string;
  meta_account_id: string | null;
  meta_ads_budget: number;
  lastReview?: ReviewData;
}

// Tipos relacionados à revisão
export interface ReviewData {
  id: number;
  review_date: string;
  meta_daily_budget_current: number | null;
  meta_total_spent: number;
  created_at: string;
  updated_at: string;
  idealDailyBudget?: number;
  recommendation?: string | null;
  // Propriedades para orçamentos personalizados
  using_custom_budget?: boolean;
  custom_budget_id?: string | null;
  custom_budget_amount?: number | null;
  custom_budget_end_date?: string | null; // Adicionando esta propriedade para uso futuro
  custom_budget_start_date?: string | null; // Adicionando esta propriedade para uso futuro
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
