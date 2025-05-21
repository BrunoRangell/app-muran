
import { ClientWithReview } from "../types/reviewTypes";

export interface BudgetState {
  hasReview: boolean;
  isCalculating: boolean;
  monthlyBudget: number;
  totalSpent: number;
  lastFiveDaysSpent: number;
  currentDailyBudget: number;
  idealDailyBudget: number;
  budgetDifference: number;
  budgetDifferenceBasedOnAverage: number;
  remainingDaysValue: number;
  remainingBudget: number;
  needsBudgetAdjustment: boolean;
  needsAdjustmentBasedOnAverage: boolean;
}

export interface CustomBudgetState {
  usingCustomBudget: boolean;
  customBudgetAmount: number | null;
  customBudgetStartDate: string | null;
  customBudgetEndDate: string | null;
}

export interface GoogleAdsBudgetResult extends BudgetState, CustomBudgetState {}

export interface BudgetCalculationOptions {
  client: ClientWithReview;
}
