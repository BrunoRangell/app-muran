
import { ClientWithReview } from "@/components/daily-reviews/hooks/types/reviewTypes";

// Tipos para métricas
export interface MetricsData {
  clientsCount: number;
  clientsWithReviewCount: number;
  clientsNeedingAdjustment: number;
  customBudgetsCount: number;
  totalMonthlyBudget: number;
  totalSpent: number;
  averageSpendPercentage: number;
}

// Tipos para orçamentos
export interface RegularBudget {
  clientId: string;
  accountId?: string;
  platform: "meta" | "google";
  budgetAmount: number;
  currentDailyBudget?: number;
  totalSpent?: number;
}

// Interface para mapeamento entre a tabela do banco e nosso modelo
export interface CustomBudgetDatabase {
  id: string;
  client_id: string;
  account_id?: string;
  platform: string;
  budget_amount: number;
  start_date: string;
  end_date: string;
  description?: string;
  is_active: boolean;
  is_recurring: boolean;
  recurrence_pattern?: string;
  created_at: string;
  updated_at: string;
}

export interface CustomBudget {
  id: string;
  clientId: string;
  accountId?: string;
  platform: "meta" | "google";
  budgetAmount: number;
  startDate: string;
  endDate: string;
  description?: string;
  isActive: boolean;
  isRecurring?: boolean;
  recurrencePattern?: string;
}

// Helpers para conversão entre tipos de banco de dados e modelos da aplicação
export const dbToCustomBudget = (db: CustomBudgetDatabase): CustomBudget => ({
  id: db.id,
  clientId: db.client_id,
  accountId: db.account_id,
  platform: db.platform as "meta" | "google",
  budgetAmount: db.budget_amount,
  startDate: db.start_date,
  endDate: db.end_date,
  description: db.description,
  isActive: db.is_active,
  isRecurring: db.is_recurring,
  recurrencePattern: db.recurrence_pattern
});

export const customBudgetToDb = (budget: Omit<CustomBudget, "id">): Omit<CustomBudgetDatabase, "id" | "created_at" | "updated_at"> => ({
  client_id: budget.clientId,
  account_id: budget.accountId,
  platform: budget.platform,
  budget_amount: budget.budgetAmount,
  start_date: budget.startDate,
  end_date: budget.endDate,
  description: budget.description,
  is_active: budget.isActive,
  is_recurring: budget.isRecurring || false,
  recurrence_pattern: budget.recurrencePattern
});

// Estado ReviewsContext
export interface ReviewsState {
  clients: {
    meta: ClientWithReview[];
    google: ClientWithReview[];
  },
  filters: {
    searchQuery: string;
    showOnlyAdjustments: boolean;
    viewMode: "cards" | "table" | "list";
    platform: "meta" | "google" | "all";
  };
  processing: {
    processingClients: Record<string, boolean>;
    processingAccounts: Record<string, boolean>;
    batchProcessing: boolean;
  };
  metrics: {
    meta: MetricsData;
    google: MetricsData;
    combined: MetricsData;
  };
  lastRefresh: Date | null;
}

// Ações do ReviewsContext
export type ReviewsAction =
  | { type: "SET_CLIENTS"; payload: { platform: "meta" | "google"; clients: ClientWithReview[] } }
  | { type: "SET_FILTER"; payload: Partial<ReviewsState["filters"]> }
  | { type: "SET_METRICS"; payload: { platform: "meta" | "google" | "combined"; data: MetricsData } }
  | { type: "SET_PROCESSING_CLIENT"; payload: { clientId: string; processing: boolean } }
  | { type: "SET_PROCESSING_ACCOUNT"; payload: { accountId: string; processing: boolean } }
  | { type: "SET_BATCH_PROCESSING"; payload: boolean }
  | { type: "CLEAR_PROCESSING_STATES" }
  | { type: "SET_LAST_REFRESH"; payload: Date };

// Estado BudgetContext
export interface BudgetState {
  customBudgets: Record<string, CustomBudget[]>;
  regularBudgets: Record<string, RegularBudget>;
  processing: boolean;
  error: Error | null;
}

// Ações do BudgetContext
export type BudgetAction =
  | { type: "SET_CUSTOM_BUDGETS"; payload: Record<string, CustomBudget[]> }
  | { type: "SET_REGULAR_BUDGETS"; payload: Record<string, RegularBudget> }
  | { type: "ADD_CUSTOM_BUDGET"; payload: CustomBudget }
  | { type: "UPDATE_CUSTOM_BUDGET"; payload: CustomBudget }
  | { type: "DELETE_CUSTOM_BUDGET"; payload: { id: string } }
  | { type: "SET_PROCESSING"; payload: boolean }
  | { type: "SET_ERROR"; payload: Error | null };
