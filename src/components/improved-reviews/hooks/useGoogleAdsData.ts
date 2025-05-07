
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useBudgetCalculator } from "./useBudgetCalculator";
import { ClientMetrics } from "./useUnifiedReviewsData";

export function useGoogleAdsData() {
  const [metrics, setMetrics] = useState<ClientMetrics>({
    totalClients: 0,
    clientsNeedingAdjustment: 0,
    totalBudget: 0,
    totalSpent: 0,
    spentPercentage: 0
  });

  const { calculateBudget } = useBudgetCalculator();

  // Fetch clients with their Google accounts and reviews
  const { 
    data, 
    isLoading, 
    error, 
    refetch 
  } = useQuery({
    queryKey: ["improved-google-reviews"],
    queryFn: async () => {
      // Buscar clientes ativos
      const { data: clients, error: clientsError } = await supabase
        .from("clients")
        .select(`
          id,
          company_name,
          google_ads_budget,
          google_account_id,
          status
        `)
        .eq("status", "active");

      if (clientsError) throw clientsError;

      // Buscar contas Google dos clientes
      const { data: googleAccounts, error: accountsError } = await supabase
        .from("client_google_accounts")
        .select("*")
        .eq("status", "active");

      if (accountsError) throw accountsError;

      // Buscar revisões mais recentes do Google Ads
      const { data: reviews, error: reviewsError } = await supabase
        .from("google_ads_reviews")
        .select("*")
        .eq("review_date", new Date().toISOString().split("T")[0]);

      if (reviewsError) throw reviewsError;

      // Combinar os dados
      const clientsWithData = clients
        .filter(client => client.google_account_id || (googleAccounts && googleAccounts.some(acc => acc.client_id === client.id)))
        .map(client => {
          // Encontrar contas do cliente
          const accounts = googleAccounts ? googleAccounts.filter(account => account.client_id === client.id) : [];
          
          // Se o cliente tiver contas específicas, criar um item para cada conta
          if (accounts.length > 0) {
            return accounts.map(account => {
              // Encontrar revisão para esta conta
              const review = reviews && reviews.find(r => 
                r.client_id === client.id && 
                (r.google_account_id === account.account_id || r.client_account_id === account.account_id)
              );
              
              // Calcular orçamento recomendado
              const budgetCalc = calculateBudget({
                monthlyBudget: account.budget_amount,
                totalSpent: review?.google_total_spent || 0,
                currentDailyBudget: review?.google_daily_budget_current || 0
              });
              
              return {
                ...client,
                google_account_id: account.account_id,
                google_account_name: account.account_name,
                budget_amount: account.budget_amount,
                review: review || null,
                budgetCalculation: budgetCalc,
                needsAdjustment: budgetCalc.needsBudgetAdjustment
              };
            });
          } else if (client.google_account_id) {
            // Cliente com ID de conta padrão
            const review = reviews && reviews.find(r => r.client_id === client.id);
            
            // Calcular orçamento recomendado
            const budgetCalc = calculateBudget({
              monthlyBudget: client.google_ads_budget || 0,
              totalSpent: review?.google_total_spent || 0,
              currentDailyBudget: review?.google_daily_budget_current || 0
            });
            
            return {
              ...client,
              google_account_name: "Conta Principal",
              budget_amount: client.google_ads_budget || 0,
              review: review || null,
              budgetCalculation: budgetCalc,
              needsAdjustment: budgetCalc.needsBudgetAdjustment
            };
          }
          
          return null;
        })
        .filter(Boolean);

      // Achatar o array (já que alguns clientes podem ter várias contas)
      const flattenedClients = clientsWithData.flat().filter(Boolean);
      
      // Calcular métricas
      const totalBudget = flattenedClients.reduce((sum, client) => sum + (client.budget_amount || 0), 0);
      const totalSpent = flattenedClients.reduce((sum, client) => sum + (client.review?.google_total_spent || 0), 0);
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
