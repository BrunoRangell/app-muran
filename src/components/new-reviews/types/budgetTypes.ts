
export interface BudgetInfo {
  monthlyBudget: number;
  totalSpent: number;
  currentDailyBudget: number;
  idealDailyBudget: number;
  lastFiveDaysAverage?: number;
  remainingBudget: number;
  remainingDays: number;
  budgetDifference: number;
  budgetDifferenceBasedOnAverage?: number;
  needsBudgetAdjustment: boolean;
  needsAdjustmentBasedOnAverage?: boolean;
  spentPercentage: number;
}

export interface CustomBudget {
  id: string;
  client_id: string;
  budget_amount: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
  platform: 'meta' | 'google';
  account_id?: string | null;
  description?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface ClientBudgetData {
  clientId: string;
  clientName: string;
  platform: 'meta' | 'google';
  accountId?: string | null;
  hasCustomBudget: boolean;
  customBudget?: CustomBudget | null;
  monthlyBudget?: number | null;
  totalSpent?: number | null;
  currentDailyBudget?: number | null;
  lastFiveDaysAverage?: number | null;
  isCalculating?: boolean;
  calculationError?: string | null;
}
