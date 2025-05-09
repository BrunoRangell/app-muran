
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useBudgetCalculator } from "./useBudgetCalculator";

export type UnifiedMetrics = {
  totalItems: number;
  reviewedItems: number;
  increases: number;
  decreases: number;
  issues: number;
};

export function useUnifiedReviewsData(platform: "meta" | "google" = "meta") {
  const [metrics, setMetrics] = useState<UnifiedMetrics>({
    totalItems: 0,
    reviewedItems: 0,
    increases: 0,
    decreases: 0,
    issues: 0
  });

  const { calculateBudget } = useBudgetCalculator();

  // Fetch clients with their accounts and reviews
  const { 
    data, 
    isLoading, 
    error, 
    refetch 
  } = useQuery({
    queryKey: [`improved-${platform}-reviews`],
    queryFn: async () => {
      // Buscar clientes ativos
      const { data: clients, error: clientsError } = await supabase
        .from("clients")
        .select(`
          id,
          company_name,
          meta_ads_budget,
          google_ads_budget,
          status
        `)
        .eq("status", "active");

      if (clientsError) throw clientsError;
      
      // Determinar qual campo de orçamento usar baseado na plataforma
      const budgetField = platform === "meta" ? "meta_ads_budget" : "google_ads_budget";
      const accountIdField = platform === "meta" ? "meta_account_id" : "google_account_id";
      
      // Buscar contas da plataforma correspondente
      const accountsTable = platform === "meta" ? "client_meta_accounts" : "client_google_accounts";
      const { data: accounts, error: accountsError } = await supabase
        .from(accountsTable)
        .select("*")
        .eq("status", "active");

      if (accountsError) throw accountsError;

      // Buscar revisões mais recentes
      const reviewsTable = platform === "meta" ? "daily_budget_reviews" : "google_ads_reviews";
      const { data: reviews, error: reviewsError } = await supabase
        .from(reviewsTable)
        .select("*")
        .eq("review_date", new Date().toISOString().split("T")[0]);

      if (reviewsError) throw reviewsError;

      // Combinar os dados
      const clientsWithData = clients.map(client => {
        // Encontrar contas do cliente
        const clientAccounts = accounts.filter(account => account.client_id === client.id);
        
        // Se o cliente tiver contas específicas, criar um item para cada conta
        if (clientAccounts.length > 0) {
          return clientAccounts.map(account => {
            // Encontrar revisão para esta conta
            const accountIdToMatch = platform === "meta" ? "meta_account_id" : "google_account_id";
            const review = reviews.find(r => 
              r.client_id === client.id && 
              (r[accountIdToMatch] === account.account_id || r.client_account_id === account.account_id)
            );
            
            // Calcular orçamento recomendado
            const dailyBudgetField = platform === "meta" ? "meta_daily_budget_current" : "google_daily_budget_current";
            const spentField = platform === "meta" ? "meta_total_spent" : "google_total_spent";
            
            const budgetCalc = calculateBudget({
              monthlyBudget: account.budget_amount,
              totalSpent: review?.[spentField] || 0,
              currentDailyBudget: review?.[dailyBudgetField] || 0,
              customBudgetAmount: review?.custom_budget_amount,
              isUsingCustomBudget: review?.using_custom_budget,
              customBudgetStartDate: review?.custom_budget_start_date,
              customBudgetEndDate: review?.custom_budget_end_date
            });
            
            return {
              ...client,
              [accountIdField]: account.account_id,
              account_name: account.account_name,
              budget_amount: account.budget_amount,
              lastReview: review || null,
              budgetCalculation: budgetCalc,
              needsBudgetAdjustment: budgetCalc.needsBudgetAdjustment
            };
          });
        } else {
          // Cliente sem contas específicas, usar valores padrão
          const review = reviews.find(r => r.client_id === client.id);
          
          // Calcular orçamento recomendado
          const dailyBudgetField = platform === "meta" ? "meta_daily_budget_current" : "google_daily_budget_current";
          const spentField = platform === "meta" ? "meta_total_spent" : "google_total_spent";
          
          const budgetCalc = calculateBudget({
            monthlyBudget: client[budgetField],
            totalSpent: review?.[spentField] || 0,
            currentDailyBudget: review?.[dailyBudgetField] || 0,
            customBudgetAmount: review?.custom_budget_amount,
            isUsingCustomBudget: review?.using_custom_budget
          });
          
          return {
            ...client,
            [accountIdField]: null,
            account_name: platform === "meta" ? "Conta Meta Principal" : "Conta Google Principal",
            budget_amount: client[budgetField],
            lastReview: review || null,
            budgetCalculation: budgetCalc,
            needsBudgetAdjustment: budgetCalc.needsBudgetAdjustment
          };
        }
      });

      // Achatar o array (já que alguns clientes podem ter várias contas)
      const flattenedClients = clientsWithData.flat();
      
      // Calcular métricas
      const totalBudget = flattenedClients.reduce((sum, client) => sum + (client.budget_amount || 0), 0);
      const totalSpent = flattenedClients.reduce((sum, client) => {
        const spentField = platform === "meta" ? "meta_total_spent" : "google_total_spent";
        return sum + (client.lastReview?.[spentField] || 0);
      }, 0);
      const needingAdjustment = flattenedClients.filter(client => client.needsBudgetAdjustment).length;
      const increases = flattenedClients.filter(client => {
        const budgetCalc = client.budgetCalculation;
        return budgetCalc && budgetCalc.budgetDifference > 0 && budgetCalc.needsBudgetAdjustment;
      }).length;
      const decreases = flattenedClients.filter(client => {
        const budgetCalc = client.budgetCalculation;
        return budgetCalc && budgetCalc.budgetDifference < 0 && budgetCalc.needsBudgetAdjustment;
      }).length;
      
      setMetrics({
        totalItems: flattenedClients.length,
        reviewedItems: flattenedClients.filter(client => client.lastReview).length,
        increases,
        decreases,
        issues: needingAdjustment
      });

      return flattenedClients;
    }
  });

  return {
    data,
    isLoading,
    error,
    metrics,
    refreshData: refetch,
    isRefreshing: false // Adicionado isRefreshing para compatibilidade com a interface
  };
}
