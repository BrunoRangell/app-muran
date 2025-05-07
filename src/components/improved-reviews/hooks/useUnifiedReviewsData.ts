
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
            
            // Calcular orçamento recomendado
            const budgetCalc = calculateBudget({
              monthlyBudget: account.budget_amount,
              totalSpent: review?.meta_total_spent || 0,
              currentDailyBudget: review?.meta_daily_budget_current || 0
            });
            
            return {
              ...client,
              meta_account_id: account.account_id,
              meta_account_name: account.account_name,
              budget_amount: account.budget_amount,
              review: review || null,
              budgetCalculation: budgetCalc,
              needsAdjustment: budgetCalc.needsBudgetAdjustment
            };
          });
        } else {
          // Cliente sem contas específicas, usar valores padrão
          const review = reviews.find(r => r.client_id === client.id);
          
          // Calcular orçamento recomendado
          const budgetCalc = calculateBudget({
            monthlyBudget: client.meta_ads_budget,
            totalSpent: review?.meta_total_spent || 0,
            currentDailyBudget: review?.meta_daily_budget_current || 0
          });
          
          return {
            ...client,
            meta_account_id: null,
            meta_account_name: "Conta Principal",
            budget_amount: client.meta_ads_budget,
            review: review || null,
            budgetCalculation: budgetCalc,
            needsAdjustment: budgetCalc.needsBudgetAdjustment
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
