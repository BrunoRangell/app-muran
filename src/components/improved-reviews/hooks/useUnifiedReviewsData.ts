
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useBudgetCalculator } from "./useBudgetCalculator";
import { logger } from "@/utils/logger";

export type ClientMetrics = {
  totalClients: number;
  clientsWithoutAccount: number;
  totalBudget: number;
  totalSpent: number;
  spentPercentage: number;
};

export function useUnifiedReviewsData() {
  const [metrics, setMetrics] = useState<ClientMetrics>({
    totalClients: 0,
    clientsWithoutAccount: 0,
    totalBudget: 0,
    totalSpent: 0,
    spentPercentage: 0
  });

  const { calculateBudget } = useBudgetCalculator();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["improved-meta-reviews"],
    queryFn: async () => {
      try {
        logger.info('META_ADS', 'Fetching Meta Ads data');
        
        // Buscar clientes ativos
        const { data: clients, error: clientsError } = await supabase
          .from("clients")
          .select(`id, company_name, status, meta_ads_budget, meta_account_id`)
          .eq("status", "active");

        if (clientsError) throw clientsError;

        // Buscar contas Meta adicionais
        const { data: additionalMetaAccounts, error: accountsError } = await supabase
          .from("client_meta_accounts")
          .select("*")
          .eq("status", "active")
          .eq("is_primary", false);

        if (accountsError) throw accountsError;

        // Buscar revisões desde o início do mês
        const today = new Date();
        const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
        const firstDayStr = firstDay.toISOString().split("T")[0];
        
        const { data: reviews, error: reviewsError } = await supabase
          .from("daily_budget_reviews")
          .select(`*`)
          .gte("review_date", firstDayStr)
          .order("review_date", { ascending: false });

        if (reviewsError) throw reviewsError;
        
        // Buscar orçamentos personalizados ativos
        const todayStr = today.toISOString().split("T")[0];
        const { data: activeCustomBudgets, error: budgetsError } = await supabase
          .from("custom_budgets")
          .select("*")
          .eq("platform", "meta")
          .eq("is_active", true)
          .lte("start_date", todayStr)
          .gte("end_date", todayStr);
        
        if (budgetsError) throw budgetsError;

        // Processar dados
        const processedData = await processMetaClientsData(
          clients || [],
          additionalMetaAccounts || [],
          reviews || [],
          activeCustomBudgets || [],
          calculateBudget
        );

        // Calcular métricas
        const metricsData = calculateMetaMetrics(processedData);
        setMetrics(metricsData);

        return processedData;
      } catch (error) {
        logger.error('META_ADS', 'Failed to fetch Meta Ads data', error);
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

// Função auxiliar para processar dados dos clientes Meta
async function processMetaClientsData(
  clients: any[], 
  additionalMetaAccounts: any[], 
  reviews: any[], 
  activeCustomBudgets: any[], 
  calculateBudget: any
) {
  // Mapear orçamentos personalizados por client_id
  const customBudgetsByClientId = new Map();
  activeCustomBudgets.forEach(budget => {
    customBudgetsByClientId.set(budget.client_id, budget);
  });

  // Criar Set de clientes com contas Meta
  const clientsWithAccounts = new Set();
  
  clients.forEach(client => {
    if (client.meta_account_id) {
      clientsWithAccounts.add(client.id);
    }
  });
  
  additionalMetaAccounts.forEach(account => {
    clientsWithAccounts.add(account.client_id);
  });

  // Processar cada cliente
  const clientsWithData = clients.map(client => {
    const hasMainAccount = client.meta_account_id && client.meta_account_id !== '';
    
    const additionalAccounts = additionalMetaAccounts.filter(account => 
      account.client_id === client.id
    ) || [];
    
    const allAccounts = [];
    
    if (hasMainAccount) {
      allAccounts.push({
        account_id: client.meta_account_id,
        account_name: "Conta Principal",
        budget_amount: client.meta_ads_budget || 0,
        is_primary: true
      });
    }
    
    additionalAccounts.forEach(account => {
      allAccounts.push({
        account_id: account.account_id,
        account_name: account.account_name,
        budget_amount: account.budget_amount,
        is_primary: false
      });
    });
    
    if (allAccounts.length > 0) {
      return allAccounts.map(account => 
        processMetaClientAccount(client, account, reviews, customBudgetsByClientId, calculateBudget)
      );
    } else {
      return createMetaClientWithoutAccount(client);
    }
  }) || [];

  return clientsWithData.flat();
}

// Função auxiliar para processar conta Meta do cliente
function processMetaClientAccount(
  client: any, 
  account: any, 
  reviews: any[], 
  customBudgetsByClientId: Map<any, any>, 
  calculateBudget: any
) {
  const clientReviews = reviews.filter(r => 
    r.client_id === client.id && r.meta_account_id === account.account_id
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
    totalSpent: review?.meta_total_spent || 0,
    currentDailyBudget: review?.meta_daily_budget_current || 0,
    customBudgetEndDate: customBudgetEndDate
  });
  
  const needsAdjustment = budgetCalc.needsBudgetAdjustment;
  
  return {
    ...client,
    meta_account_id: account.account_id,
    meta_account_name: account.account_name,
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

// Função auxiliar para cliente Meta sem conta
function createMetaClientWithoutAccount(client: any) {
  return {
    ...client,
    meta_account_id: null,
    meta_account_name: "Sem conta cadastrada",
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

// Função auxiliar para calcular métricas Meta
function calculateMetaMetrics(flattenedClients: any[]) {
  const clientsWithAccounts = new Set();
  const clientsWithoutAccount = flattenedClients.filter(client => !client.hasAccount).length;
  
  flattenedClients.forEach(client => {
    if (client.hasAccount) {
      clientsWithAccounts.add(client.id);
    }
  });
  
  const totalBudget = flattenedClients.reduce((sum, client) => sum + (client.budget_amount || 0), 0);
  const totalSpent = flattenedClients.reduce((sum, client) => sum + (client.review?.meta_total_spent || 0), 0);
  
  return {
    totalClients: clientsWithAccounts.size,
    clientsWithoutAccount: clientsWithoutAccount,
    totalBudget: totalBudget,
    totalSpent: totalSpent,
    spentPercentage: totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0
  };
}
