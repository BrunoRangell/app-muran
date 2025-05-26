
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useBudgetCalculator } from "./useBudgetCalculator";

export type ClientMetrics = {
  totalClients: number;
  clientsNeedingAdjustment: number;
  totalBudget: number;
  totalSpent: number;
  spentPercentage: number;
};

export function useUnifiedReviewsData() {
  const [metrics, setMetrics] = useState<ClientMetrics>({
    totalClients: 0,
    clientsNeedingAdjustment: 0,
    totalBudget: 0,
    totalSpent: 0,
    spentPercentage: 0
  });

  const { calculateBudget } = useBudgetCalculator();

  // Fetch clients with their Meta accounts and reviews
  const { 
    data, 
    isLoading, 
    error, 
    refetch 
  } = useQuery({
    queryKey: ["improved-meta-reviews"],
    queryFn: async () => {
      // Buscar clientes ativos
      const { data: clients, error: clientsError } = await supabase
        .from("clients")
        .select(`
          id,
          company_name,
          meta_ads_budget,
          status
        `)
        .eq("status", "active");

      if (clientsError) throw clientsError;

      // Buscar contas Meta dos clientes
      const { data: metaAccounts, error: accountsError } = await supabase
        .from("client_meta_accounts")
        .select("*")
        .eq("status", "active");

      if (accountsError) throw accountsError;

      // Buscar revisões mais recentes
      const { data: reviews, error: reviewsError } = await supabase
        .from("daily_budget_reviews")
        .select(`*`)
        .eq("review_date", new Date().toISOString().split("T")[0]);

      if (reviewsError) throw reviewsError;
      
      // Buscar orçamentos personalizados separadamente (corrigindo o problema de relação)
      const { data: customBudgets, error: customBudgetsError } = await supabase
        .from("meta_custom_budgets")
        .select("*");
      
      if (customBudgetsError) throw customBudgetsError;
      
      // Buscar orçamentos personalizados ativos
      const today = new Date().toISOString().split("T")[0];
      const { data: activeCustomBudgets, error: budgetsError } = await supabase
        .from("meta_custom_budgets")
        .select("*")
        .eq("is_active", true)
        .lte("start_date", today)
        .gte("end_date", today);
      
      if (budgetsError) throw budgetsError;
      
      // Mapear orçamentos personalizados por client_id para fácil acesso
      const customBudgetsByClientId = new Map();
      activeCustomBudgets?.forEach(budget => {
        customBudgetsByClientId.set(budget.client_id, budget);
      });

      // Combinar os dados
      const clientsWithData = clients.map(client => {
        // Encontrar contas do cliente
        const accounts = metaAccounts.filter(account => account.client_id === client.id);
        
        // Se o cliente tiver contas específicas, criar um item para cada conta
        if (accounts.length > 0) {
          return accounts.map(account => {
            // Encontrar revisão para esta conta
            const review = reviews.find(r => 
              r.client_id === client.id && 
              (r.meta_account_id === account.account_id || r.client_account_id === account.account_id)
            );
            
            // Verificar se existe orçamento personalizado ativo
            let customBudget = null;
            let monthlyBudget = account.budget_amount;
            let isUsingCustomBudget = false;
            
            // Primeiro verificar se a revisão já tem informações de orçamento personalizado
            if (review?.using_custom_budget && review?.custom_budget_amount) {
              isUsingCustomBudget = true;
              monthlyBudget = review.custom_budget_amount;
              
              // Se temos um custom_budget_id, buscar diretamente do array de customBudgets
              if (review.custom_budget_id) {
                customBudget = customBudgets.find(b => b.id === review.custom_budget_id) || {
                  id: review.custom_budget_id,
                  budget_amount: review.custom_budget_amount,
                  start_date: review.custom_budget_start_date,
                  end_date: review.custom_budget_end_date
                };
              }
            } 
            // Se não, verificar se há orçamento personalizado ativo
            else if (customBudgetsByClientId.has(client.id)) {
              const budget = customBudgetsByClientId.get(client.id);
              customBudget = budget;
              monthlyBudget = budget.budget_amount;
              isUsingCustomBudget = true;
            }
            
            // Calcular orçamento recomendado usando o orçamento correto (personalizado ou padrão)
            const budgetCalc = calculateBudget({
              monthlyBudget: monthlyBudget,
              totalSpent: review?.meta_total_spent || 0,
              currentDailyBudget: review?.meta_daily_budget_current || 0
            });
            
            return {
              ...client,
              meta_account_id: account.account_id,
              meta_account_name: account.account_name,
              budget_amount: monthlyBudget,
              original_budget_amount: account.budget_amount,
              review: review || null,
              budgetCalculation: budgetCalc,
              needsAdjustment: budgetCalc.needsBudgetAdjustment,
              customBudget: customBudget,
              isUsingCustomBudget: isUsingCustomBudget
            };
          });
        } else {
          // Cliente sem contas específicas, usar valores padrão
          const review = reviews.find(r => r.client_id === client.id);
          
          // Verificar se existe orçamento personalizado ativo
          let customBudget = null;
          let monthlyBudget = client.meta_ads_budget;
          let isUsingCustomBudget = false;
          
          // Primeiro verificar se a revisão já tem informações de orçamento personalizado
          if (review?.using_custom_budget && review?.custom_budget_amount) {
            isUsingCustomBudget = true;
            monthlyBudget = review.custom_budget_amount;
            
            // Se temos um custom_budget_id, buscar diretamente do array de customBudgets
            if (review.custom_budget_id) {
              customBudget = customBudgets.find(b => b.id === review.custom_budget_id) || {
                id: review.custom_budget_id,
                budget_amount: review.custom_budget_amount,
                start_date: review.custom_budget_start_date,
                end_date: review.custom_budget_end_date
              };
            }
          }
          // Se não, verificar se há orçamento personalizado ativo
          else if (customBudgetsByClientId.has(client.id)) {
            const budget = customBudgetsByClientId.get(client.id);
            customBudget = budget;
            monthlyBudget = budget.budget_amount;
            isUsingCustomBudget = true;
          }
          
          // Calcular orçamento recomendado
          const budgetCalc = calculateBudget({
            monthlyBudget: monthlyBudget,
            totalSpent: review?.meta_total_spent || 0,
            currentDailyBudget: review?.meta_daily_budget_current || 0
          });
          
          return {
            ...client,
            meta_account_id: null,
            meta_account_name: "Conta Principal",
            budget_amount: monthlyBudget,
            original_budget_amount: client.meta_ads_budget,
            review: review || null,
            budgetCalculation: budgetCalc,
            needsAdjustment: budgetCalc.needsBudgetAdjustment,
            customBudget: customBudget,
            isUsingCustomBudget: isUsingCustomBudget
          };
        }
      });

      // Achatar o array (já que alguns clientes podem ter várias contas)
      const flattenedClients = clientsWithData.flat();
      
      // Calcular métricas
      const totalBudget = flattenedClients.reduce((sum, client) => sum + (client.budget_amount || 0), 0);
      const totalSpent = flattenedClients.reduce((sum, client) => sum + (client.review?.meta_total_spent || 0), 0);
      const needingAdjustment = flattenedClients.filter(client => client.needsAdjustment).length;
      
      setMetrics({
        totalClients: flattenedClients.length,
        clientsNeedingAdjustment: needingAdjustment,
        totalBudget: totalBudget,
        totalSpent: totalSpent,
        spentPercentage: totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0
      });

      return flattenedClients;
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
