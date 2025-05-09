
// Tipos compartilhados entre Meta e Google Ads

export interface AdsReviewBase {
  id: string;
  client_id: string;
  review_date: string;
  created_at: string;
  updated_at: string;
  custom_budget_id?: string;
  using_custom_budget?: boolean;
  custom_budget_amount?: number;
}

export interface ClientBase {
  id: string;
  company_name: string;
  status: string;
}

export interface AdsAccount {
  id: string;
  account_id: string;
  account_name: string;
  client_id: string;
  budget_amount: number;
  status: string;
  is_primary: boolean;
}

export interface BudgetCalculation {
  idealDailyBudget: number;
  budgetDifference: number;
  needsBudgetAdjustment: boolean;
  needsAdjustmentBasedOnAverage?: boolean;
  dailyBudgetRecommendation: number;
  spentPercentage: number;
  remainingBudget: number;
  remainingDays: number;
}

export interface PlatformMetrics {
  totalClients: number;
  clientsNeedingAdjustment: number;
  totalBudget: number;
  totalSpent: number;
  spentPercentage: number;
}

// Estados e tipos comuns de UI
export type ViewMode = "cards" | "table" | "list";
export type PlatformType = "meta" | "google";
