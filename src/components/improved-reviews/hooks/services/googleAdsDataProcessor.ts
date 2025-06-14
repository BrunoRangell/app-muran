
import { supabase } from "@/lib/supabase";
import { logger } from "@/utils/logger";

export interface ProcessedClientData {
  id: string;
  company_name: string;
  status: string;
  google_account_id: string | null;
  google_account_name: string;
  budget_amount: number;
  original_budget_amount: number;
  isUsingCustomBudget: boolean;
  customBudget: any;
  review: any;
  budgetCalculation: any;
  needsAdjustment: boolean;
  lastFiveDaysAvg: number;
  weightedAverage: number;
  hasAccount: boolean;
}

export async function fetchGoogleReviews() {
  const currentDate = new Date();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const firstDayStr = firstDayOfMonth.toISOString().split("T")[0];
  
  const { data: reviews } = await supabase
    .from("google_ads_reviews")
    .select(`*, google_day_1_spent, google_day_2_spent, google_day_3_spent, google_day_4_spent, google_day_5_spent`)
    .gte("review_date", firstDayStr)
    .order("review_date", { ascending: false });

  return reviews || [];
}

export function calculateWeightedAverage(review: any) {
  if (!review) return 0;
  
  const day1 = review.google_day_1_spent || 0;
  const day2 = review.google_day_2_spent || 0;
  const day3 = review.google_day_3_spent || 0;
  const day4 = review.google_day_4_spent || 0;
  const day5 = review.google_day_5_spent || 0;
  
  return (day1 * 0.1) + (day2 * 0.15) + (day3 * 0.2) + (day4 * 0.25) + (day5 * 0.3);
}

export function processClientAccount(
  client: any, 
  account: any, 
  reviews: any[], 
  customBudget: any, 
  isUsingCustomBudget: boolean, 
  calculateBudget: any
): ProcessedClientData {
  const accountReviews = reviews.filter(r => 
    r.client_id === client.id && r.google_account_id === account.account_id
  ) || [];
  
  const review = accountReviews.length > 0 ? accountReviews[0] : null;
  const weightedAverage = calculateWeightedAverage(review);
  
  const originalBudgetAmount = account.budget_amount;
  const budgetAmount = isUsingCustomBudget ? customBudget.budget_amount : originalBudgetAmount;
  
  const lastFiveDaysAvg = review?.google_last_five_days_spent || 0;
  
  const budgetCalc = calculateBudget({
    monthlyBudget: budgetAmount,
    totalSpent: review?.google_total_spent || 0,
    currentDailyBudget: review?.google_daily_budget_current || 0,
    weightedAverage: weightedAverage,
    customBudgetEndDate: customBudget?.end_date
  });
  
  const needsAdjustment = budgetCalc.needsAdjustmentBasedOnWeighted || budgetCalc.needsBudgetAdjustment;
  
  return {
    ...client,
    google_account_id: account.account_id,
    google_account_name: account.account_name,
    budget_amount: budgetAmount,
    original_budget_amount: originalBudgetAmount,
    isUsingCustomBudget,
    customBudget,
    review: review || null,
    budgetCalculation: budgetCalc,
    needsAdjustment: needsAdjustment,
    lastFiveDaysAvg: lastFiveDaysAvg,
    weightedAverage: weightedAverage,
    hasAccount: true
  };
}

export function createClientWithoutAccount(client: any): ProcessedClientData {
  return {
    ...client,
    google_account_id: null,
    google_account_name: "Sem conta cadastrada",
    budget_amount: 0,
    original_budget_amount: 0,
    isUsingCustomBudget: false,
    customBudget: null,
    review: null,
    budgetCalculation: {
      idealDailyBudget: 0,
      budgetDifference: 0,
      remainingDays: 0,
      remainingBudget: 0,
      needsBudgetAdjustment: false,
      spentPercentage: 0
    },
    needsAdjustment: false,
    lastFiveDaysAvg: 0,
    weightedAverage: 0,
    hasAccount: false
  };
}
