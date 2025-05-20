
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
      console.log("Buscando dados de clientes e revisões Google Ads...");
      
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
      
      console.log(`Encontrados ${clients?.length || 0} clientes ativos`);

      // Buscar contas Google dos clientes
      const { data: googleAccounts, error: accountsError } = await supabase
        .from("client_google_accounts")
        .select("*")
        .eq("status", "active");

      if (accountsError) throw accountsError;
      
      console.log(`Encontradas ${googleAccounts?.length || 0} contas Google Ads`);

      // Buscar revisões mais recentes do Google Ads (apenas do mês atual)
      const currentDate = new Date();
      const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const firstDayStr = firstDayOfMonth.toISOString().split("T")[0];
      
      console.log(`Buscando revisões a partir de ${firstDayStr}`);
      
      const { data: reviews, error: reviewsError } = await supabase
        .from("google_ads_reviews")
        .select("*")
        .gte("review_date", firstDayStr)
        .order("review_date", { ascending: false });

      if (reviewsError) throw reviewsError;
      
      console.log(`Encontradas ${reviews?.length || 0} revisões do mês atual`);
      
      // Buscar orçamentos personalizados ativos do Google Ads
      const today = new Date().toISOString().split('T')[0];
      
      const { data: customBudgets, error: customBudgetsError } = await supabase
        .from("custom_budgets")
        .select("*")
        .eq("is_active", true)
        .eq("platform", "google")
        .lte("start_date", today)
        .gte("end_date", today);
        
      if (customBudgetsError) throw customBudgetsError;
      
      console.log(`Encontrados ${customBudgets?.length || 0} orçamentos personalizados ativos para o Google Ads`);

      // Combinar os dados
      const clientsWithData = clients
        .filter(client => client.google_account_id || (googleAccounts && googleAccounts.some(acc => acc.client_id === client.id)))
        .map(client => {
          // Encontrar contas do cliente
          const accounts = googleAccounts ? googleAccounts.filter(account => account.client_id === client.id) : [];
          
          // Se o cliente tiver contas específicas, criar um item para cada conta
          if (accounts.length > 0) {
            return accounts.map(account => {
              // Verificar se existe um orçamento personalizado para esta conta
              const activeCustomBudget = customBudgets ? customBudgets.find(budget => 
                budget.client_id === client.id && 
                (budget.account_id === account.account_id || budget.account_id === null)
              ) : null;
              
              // Encontrar revisões para esta conta (apenas do mês atual)
              const accountReviews = reviews ? reviews.filter(r => 
                r.client_id === client.id && 
                (r.google_account_id === account.account_id || r.client_account_id === account.id)
              ) : [];
              
              // Usar a revisão mais recente
              const review = accountReviews.length > 0 ? accountReviews[0] : null;
              
              // Obter a média de gasto dos últimos 5 dias (se disponível)
              const lastFiveDaysAvg = review?.google_last_five_days_spent || 0;
              
              // Verificar se a revisão indica uso de orçamento personalizado
              const isUsingCustomBudgetInReview = review?.using_custom_budget || false;
              
              // Determinar o orçamento a ser usado (personalizado ou padrão)
              const budgetAmount = activeCustomBudget ? 
                activeCustomBudget.budget_amount : 
                (isUsingCustomBudgetInReview && review?.custom_budget_amount ? 
                  review.custom_budget_amount : 
                  account.budget_amount || 0);
              
              // Armazenar o orçamento original para referência
              const originalBudgetAmount = account.budget_amount || 0;
              
              // Calcular orçamento recomendado
              const budgetCalc = calculateBudget({
                monthlyBudget: budgetAmount,
                totalSpent: review?.google_total_spent || 0,
                currentDailyBudget: review?.google_daily_budget_current || 0,
                lastFiveDaysAverage: lastFiveDaysAvg
              });
              
              return {
                ...client,
                google_account_id: account.account_id,
                google_account_name: account.account_name,
                budget_amount: budgetAmount,
                original_budget_amount: originalBudgetAmount,
                review: review || null,
                budgetCalculation: budgetCalc,
                needsAdjustment: budgetCalc.needsBudgetAdjustment || budgetCalc.needsAdjustmentBasedOnAverage,
                lastFiveDaysAvg: lastFiveDaysAvg,
                isUsingCustomBudget: isUsingCustomBudgetInReview || !!activeCustomBudget,
                customBudget: activeCustomBudget || (isUsingCustomBudgetInReview ? {
                  id: review?.custom_budget_id,
                  budget_amount: review?.custom_budget_amount,
                  start_date: review?.custom_budget_start_date,
                  end_date: review?.custom_budget_end_date
                } : null)
              };
            });
          } else if (client.google_account_id) {
            // Cliente com ID de conta padrão
            // Verificar se existe um orçamento personalizado para este cliente
            const activeCustomBudget = customBudgets ? customBudgets.find(budget => 
              budget.client_id === client.id && 
              (budget.account_id === client.google_account_id || budget.account_id === null)
            ) : null;
            
            // Encontrar revisões para o cliente
            const clientReviews = reviews ? reviews.filter(r => r.client_id === client.id) : [];
            const review = clientReviews.length > 0 ? clientReviews[0] : null;
            
            // Obter a média de gasto dos últimos 5 dias (se disponível)
            const lastFiveDaysAvg = review?.google_last_five_days_spent || 0;
            
            // Verificar se a revisão indica uso de orçamento personalizado
            const isUsingCustomBudgetInReview = review?.using_custom_budget || false;
            
            // Determinar o orçamento a ser usado (personalizado ou padrão)
            const budgetAmount = activeCustomBudget ? 
              activeCustomBudget.budget_amount : 
              (isUsingCustomBudgetInReview && review?.custom_budget_amount ? 
                review.custom_budget_amount : 
                client.google_ads_budget || 0);
            
            // Armazenar o orçamento original para referência
            const originalBudgetAmount = client.google_ads_budget || 0;
            
            // Calcular orçamento recomendado
            const budgetCalc = calculateBudget({
              monthlyBudget: budgetAmount,
              totalSpent: review?.google_total_spent || 0,
              currentDailyBudget: review?.google_daily_budget_current || 0,
              lastFiveDaysAverage: lastFiveDaysAvg
            });
            
            return {
              ...client,
              google_account_name: "Conta Principal",
              budget_amount: budgetAmount,
              original_budget_amount: originalBudgetAmount,
              review: review || null,
              budgetCalculation: budgetCalc,
              needsAdjustment: budgetCalc.needsBudgetAdjustment || budgetCalc.needsAdjustmentBasedOnAverage,
              lastFiveDaysAvg: lastFiveDaysAvg,
              isUsingCustomBudget: isUsingCustomBudgetInReview || !!activeCustomBudget,
              customBudget: activeCustomBudget || (isUsingCustomBudgetInReview ? {
                id: review?.custom_budget_id,
                budget_amount: review?.custom_budget_amount,
                start_date: review?.custom_budget_start_date,
                end_date: review?.custom_budget_end_date
              } : null)
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
      
      const metricsData = {
        totalClients: flattenedClients.length,
        clientsNeedingAdjustment: needingAdjustment,
        totalBudget: totalBudget,
        totalSpent: totalSpent,
        spentPercentage: totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0
      };
      
      console.log("Métricas calculadas:", metricsData);
      setMetrics(metricsData);

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
