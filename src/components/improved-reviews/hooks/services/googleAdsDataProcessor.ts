
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
  review: any;
  budgetCalculation: any;
  needsAdjustment: boolean;
  customBudget: any;
  isUsingCustomBudget: boolean;
  hasAccount: boolean;
}

export async function fetchGoogleReviews() {
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
  const firstDayStr = firstDay.toISOString().split("T")[0];
  
  const { data: reviews, error: reviewsError } = await supabase
    .from("google_ads_reviews")
    .select(`*`)
    .gte("review_date", firstDayStr)
    .order("review_date", { ascending: false });

  if (reviewsError) {
    logger.error("GOOGLE_ADS", "Erro ao buscar reviews do Google Ads", reviewsError);
    throw reviewsError;
  }
  
  return reviews || [];
}

export function processGoogleClientAccount(
  client: any, 
  account: any, 
  reviews: any[], 
  customBudgetsByClientId: Map<any, any>, 
  calculateBudget: any
): ProcessedClientData {
  const clientReviews = reviews.filter(r => 
    r.client_id === client.id && r.google_account_id === account.account_id
  ) || [];
  
  const review = clientReviews.length > 0 ? clientReviews[0] : null;
  
  let customBudget = null;
  let monthlyBudget = account.budget_amount;
  let isUsingCustomBudget = false;
  let customBudgetEndDate = null;
  
  // Verificar orçamento personalizado na revisão
  if (review?.using_custom_budget && review?.custom_budget_amount) {
    isUsingCustomBudget = true;
    monthlyBudget = review.custom_budget_amount;
    customBudgetEndDate = review.custom_budget_end_date;
    
    if (review.custom_budget_id) {
      customBudget = {
        id: review.custom_budget_id,
        budget_amount: review.custom_budget_amount,
        start_date: review.custom_budget_start_date,
        end_date: review.custom_budget_end_date
      };
    }
  } 
  // Verificar orçamento personalizado ativo
  else if (customBudgetsByClientId.has(client.id)) {
    const budget = customBudgetsByClientId.get(client.id);
    customBudget = budget;
    monthlyBudget = budget.budget_amount;
    isUsingCustomBudget = true;
    customBudgetEndDate = budget.end_date;
  }
  
  const budgetCalc = calculateBudget({
    monthlyBudget: monthlyBudget,
    totalSpent: review?.google_total_spent || 0,
    currentDailyBudget: review?.google_daily_budget_current || 0,
    customBudgetEndDate: customBudgetEndDate
  });
  
  const needsAdjustment = budgetCalc.needsBudgetAdjustment;
  
  return {
    ...client,
    google_account_id: account.account_id,
    google_account_name: account.account_name,
    budget_amount: monthlyBudget,
    original_budget_amount: account.budget_amount,
    review: review || null,
    budgetCalculation: budgetCalc,
    needsAdjustment: needsAdjustment,
    customBudget: customBudget,
    isUsingCustomBudget: isUsingCustomBudget,
    hasAccount: true
  };
}

export function createGoogleClientWithoutAccount(client: any): ProcessedClientData {
  return {
    ...client,
    google_account_id: null,
    google_account_name: "Sem conta cadastrada",
    budget_amount: 0,
    original_budget_amount: 0,
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
    customBudget: null,
    isUsingCustomBudget: false,
    hasAccount: false
  };
}
