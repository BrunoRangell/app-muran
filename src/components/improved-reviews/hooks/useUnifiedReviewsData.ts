
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
        .select("*")
        .eq("review_date", new Date().toISOString().split("T")[0]);

      if (reviewsError) throw reviewsError;
      
      // Buscar orçamentos personalizados ativos
      const today = new Date().toISOString().split('T')[0];
      const { data: customBudgets, error: customBudgetsError } = await supabase
        .from("custom_budgets")
        .select("*")
        .eq("platform", "meta")
        .eq("is_active", true)
        .lte("start_date", today)
        .gte("end_date", today);

      if (customBudgetsError) {
        console.error("Erro ao buscar orçamentos personalizados:", customBudgetsError);
      }

      // Combinar os dados
      const clientsWithData = clients.map(client => {
        // Encontrar contas do cliente
        const accounts = metaAccounts.filter(account => account.client_id === client.id);
        
        // Encontrar orçamentos personalizados do cliente
        const clientCustomBudgets = customBudgets?.filter(budget => budget.client_id === client.id) || [];
        
        // Se o cliente tiver contas específicas, criar um item para cada conta
        if (accounts.length > 0) {
          return accounts.map(account => {
            // Encontrar revisão para esta conta
            const review = reviews.find(r => 
              r.client_id === client.id && 
              (r.meta_account_id === account.account_id || r.client_account_id === account.account_id)
            );
            
            // Encontrar orçamento personalizado específico para esta conta
            const accountCustomBudget = clientCustomBudgets.find(b => 
              b.account_id === account.account_id || !b.account_id
            );
            
            // Usar dados do orçamento personalizado da revisão ou do orçamento ativo
            const isUsingCustomBudget = review?.using_custom_budget || false;
            const customBudgetAmount = review?.custom_budget_amount || accountCustomBudget?.budget_amount;
            const customBudgetEndDate = review?.custom_budget_end_date || accountCustomBudget?.end_date;
            
            // Calcular orçamento recomendado
            const budgetCalc = calculateBudget({
              monthlyBudget: account.budget_amount,
              totalSpent: review?.meta_total_spent || 0,
              currentDailyBudget: review?.meta_daily_budget_current || 0,
              usingCustomBudget: isUsingCustomBudget,
              customBudgetAmount: customBudgetAmount,
              customBudgetEndDate: customBudgetEndDate
            });
            
            return {
              ...client,
              meta_account_id: account.account_id,
              meta_account_name: account.account_name,
              budget_amount: isUsingCustomBudget && customBudgetAmount ? 
                customBudgetAmount : account.budget_amount,
              review: review || null,
              budgetCalculation: budgetCalc,
              needsAdjustment: budgetCalc.needsBudgetAdjustment,
              customBudget: accountCustomBudget || null,
              isUsingCustomBudget
            };
          });
        } else {
          // Cliente sem contas específicas, usar valores padrão
          const review = reviews.find(r => r.client_id === client.id);
          
          // Encontrar orçamento personalizado global para este cliente
          const clientCustomBudget = clientCustomBudgets.length > 0 ? clientCustomBudgets[0] : null;
          
          // Usar dados do orçamento personalizado da revisão ou do orçamento ativo
          const isUsingCustomBudget = review?.using_custom_budget || false;
          const customBudgetAmount = review?.custom_budget_amount || clientCustomBudget?.budget_amount;
          const customBudgetEndDate = review?.custom_budget_end_date || clientCustomBudget?.end_date;
          
          // Calcular orçamento recomendado
          const budgetCalc = calculateBudget({
            monthlyBudget: client.meta_ads_budget,
            totalSpent: review?.meta_total_spent || 0,
            currentDailyBudget: review?.meta_daily_budget_current || 0,
            usingCustomBudget: isUsingCustomBudget,
            customBudgetAmount: customBudgetAmount,
            customBudgetEndDate: customBudgetEndDate
          });
          
          return {
            ...client,
            meta_account_id: null,
            meta_account_name: "Conta Principal",
            budget_amount: isUsingCustomBudget && customBudgetAmount ? 
              customBudgetAmount : client.meta_ads_budget,
            review: review || null,
            budgetCalculation: budgetCalc,
            needsAdjustment: budgetCalc.needsBudgetAdjustment,
            customBudget: clientCustomBudget || null,
            isUsingCustomBudget
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
    refreshData: refetch,
    isRefreshing: false // Adicionado isRefreshing para compatibilidade com a interface
  };
}
