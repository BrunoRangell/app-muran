
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
}

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
