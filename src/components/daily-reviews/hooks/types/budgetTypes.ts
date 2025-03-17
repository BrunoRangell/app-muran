
// Tipos específicos para orçamentos
export interface BudgetInfo {
  monthlyBudget: number;
  totalSpent: number;
  currentDailyBudget: number;
  idealDailyBudget: number;
  budgetDifference: number;
  remainingBudget: number;
  remainingDays: number;
  actualBudgetAmount: number;
  needsBudgetAdjustment: boolean;
}

export interface CustomBudgetInfo {
  customBudget: any | null;
  isUsingCustomBudgetInReview: boolean;
  isLoadingCustomBudget: boolean;
}

export interface ClientBudgetCalculationResult extends BudgetInfo, CustomBudgetInfo {
  hasReview: boolean;
  isCalculating: boolean;
  calculationError: string | null;
  remainingDaysValue: number;
  calculateTotalSpent: () => Promise<number | undefined>;
}
