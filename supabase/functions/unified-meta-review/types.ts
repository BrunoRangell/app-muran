// Tipos para operações de banco de dados
export interface ClientData {
  id: string;
  company_name: string;
}

export interface MetaAccount {
  id: string;
  account_id: string;
  account_name: string;
  budget_amount: number;
}

export interface CustomBudget {
  id: string;
  budget_amount: number;
  start_date: string;
  end_date: string;
}

export interface ReviewData {
  daily_budget_current: number;
  total_spent: number;
  account_id: string;
  using_custom_budget: boolean;
  custom_budget_id: string | null;
  custom_budget_amount: number | null;
  custom_budget_start_date?: string | null;
  custom_budget_end_date?: string | null;
  saldo_restante?: number | null;
  is_prepay_account?: boolean;
}

export interface CampaignHealthData {
  client_id: string;
  account_id: string;
  snapshot_date: string;
  platform: 'meta' | 'google';
  has_account: boolean;
  active_campaigns_count: number;
  unserved_campaigns_count: number;
  cost_today: number;
  impressions_today: number;
  campaigns_detailed: any[];
}

export interface IndividualReviewRequest {
  clientId: string;
  metaAccountId?: string;
  reviewDate?: string;
}

export interface BatchReviewRequest {
  clientIds: string[];
  reviewDate?: string;
}