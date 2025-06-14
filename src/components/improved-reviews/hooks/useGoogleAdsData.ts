
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useBudgetCalculator } from "./useBudgetCalculator";
import { ClientMetrics } from "./useUnifiedReviewsData";
import { logger } from "@/utils/logger";

export function useGoogleAdsData() {
  const [metrics, setMetrics] = useState<ClientMetrics>({
    totalClients: 0,
    clientsWithoutAccount: 0,
    totalBudget: 0,
    totalSpent: 0,
    spentPercentage: 0
  });

  const { calculateBudget } = useBudgetCalculator();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["improved-google-reviews"],
    queryFn: async () => {
      try {
        logger.info('GOOGLE_ADS', 'Fetching Google Ads data');
        
        // Buscar clientes ativos
        const { data: clients, error: clientsError } = await supabase
          .from("clients")
          .select(`id, company_name, status, google_ads_budget, google_account_id`)
          .eq("status", "active");

        if (clientsError) throw clientsError;

        // Buscar contas Google adicionais
        const { data: additionalGoogleAccounts, error: accountsError } = await supabase
          .from("client_google_accounts")
          .select("*")
          .eq("status", "active")
          .eq("is_primary", false);

        if (accountsError) throw accountsError;

        // Buscar orçamentos personalizados ativos
        const today = new Date().toISOString().split('T')[0];
        const { data: customBudgets, error: customBudgetsError } = await supabase
          .from("custom_budgets")
          .select("*")
          .eq("platform", "google")
          .eq("is_active", true)
          .lte("start_date", today)
          .gte("end_date", today);

        if (customBudgetsError) throw customBudgetsError;

        // Processar dados dos clientes
        const processedData = await processClientsData(
          clients || [], 
          additionalGoogleAccounts || [], 
          customBudgets || [],
          calculateBudget
        );

        // Calcular métricas
        const metricsData = calculateMetrics(processedData);
        setMetrics(metricsData);

        return processedData;
      } catch (error) {
        logger.error('GOOGLE_ADS', 'Failed to fetch Google Ads data', error);
        throw error;
      }
    }
  });

  return {
    data,
    isLoading,
    error,
    metrics,
    refreshData: refetch
  };
}

// Função auxiliar para processar dados dos clientes
async function processClientsData(clients: any[], additionalAccounts: any[], customBudgets: any[], calculateBudget: any) {
  // Buscar revisões do mês atual
  const currentDate = new Date();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const firstDayStr = firstDayOfMonth.toISOString().split("T")[0];
  
  const { data: reviews } = await supabase
    .from("google_ads_reviews")
    .select(`*, google_day_1_spent, google_day_2_spent, google_day_3_spent, google_day_4_spent, google_day_5_spent`)
    .gte("review_date", firstDayStr)
    .order("review_date", { ascending: false });

  // Criar mapa de orçamentos personalizados
  const customBudgetMap = new Map();
  customBudgets.forEach(budget => {
    customBudgetMap.set(budget.client_id, budget);
  });

  // Processar cada cliente
  const clientsWithData = clients.map(client => {
    const customBudget = customBudgetMap.get(client.id);
    const isUsingCustomBudget = !!customBudget;
    
    const hasMainAccount = client.google_account_id && client.google_account_id !== '';
    const additionalClientAccounts = additionalAccounts.filter(account => 
      account.client_id === client.id
    ) || [];
    
    const allAccounts = [];
    
    if (hasMainAccount) {
      allAccounts.push({
        account_id: client.google_account_id,
        account_name: "Conta Principal",
        budget_amount: client.google_ads_budget || 0,
        is_primary: true
      });
    }
    
    additionalClientAccounts.forEach(account => {
      allAccounts.push({
        account_id: account.account_id,
        account_name: account.account_name,
        budget_amount: account.budget_amount,
        is_primary: false
      });
    });
    
    if (allAccounts.length > 0) {
      return allAccounts.map(account => 
        processClientAccount(client, account, reviews || [], customBudget, isUsingCustomBudget, calculateBudget)
      );
    } else {
      return createClientWithoutAccount(client);
    }
  }) || [];

  return clientsWithData.flat().filter(Boolean);
}

// Função auxiliar para processar conta do cliente
function processClientAccount(client: any, account: any, reviews: any[], customBudget: any, isUsingCustomBudget: boolean, calculateBudget: any) {
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

// Função auxiliar para cliente sem conta
function createClientWithoutAccount(client: any) {
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

// Função auxiliar para calcular média ponderada
function calculateWeightedAverage(review: any) {
  if (!review) return 0;
  
  const day1 = review.google_day_1_spent || 0;
  const day2 = review.google_day_2_spent || 0;
  const day3 = review.google_day_3_spent || 0;
  const day4 = review.google_day_4_spent || 0;
  const day5 = review.google_day_5_spent || 0;
  
  return (day1 * 0.1) + (day2 * 0.15) + (day3 * 0.2) + (day4 * 0.25) + (day5 * 0.3);
}

// Função auxiliar para calcular métricas
function calculateMetrics(flattenedClients: any[]) {
  const clientsWithAccounts = new Set();
  flattenedClients.forEach(client => {
    if (client.hasAccount) {
      clientsWithAccounts.add(client.id);
    }
  });
  
  const totalBudget = flattenedClients.reduce((sum, client) => sum + (client.budget_amount || 0), 0);
  const totalSpent = flattenedClients.reduce((sum, client) => sum + (client.review?.google_total_spent || 0), 0);
  
  return {
    totalClients: clientsWithAccounts.size,
    clientsWithoutAccount: flattenedClients.filter(client => !client.hasAccount).length,
    totalBudget: totalBudget,
    totalSpent: totalSpent,
    spentPercentage: totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0
  };
}
