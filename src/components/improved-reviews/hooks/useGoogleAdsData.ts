
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useBudgetCalculator } from "./useBudgetCalculator";
import { ClientMetrics } from "./useUnifiedReviewsData";

export function useGoogleAdsData() {
  const [metrics, setMetrics] = useState<ClientMetrics>({
    totalClients: 0,
    clientsWithoutAccount: 0,
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
      console.log("🔍 Buscando dados dos clientes Google Ads consolidados...");
      
      // Buscar clientes ativos
      const { data: clients, error: clientsError } = await supabase
        .from("clients")
        .select(`
          id,
          company_name,
          status
        `)
        .eq("status", "active");

      if (clientsError) throw clientsError;
      
      console.log(`✅ Clientes encontrados: ${clients?.length || 0}`);

      // Buscar contas Google específicas (agora única fonte de verdade)
      const { data: googleAccounts, error: accountsError } = await supabase
        .from("client_google_accounts")
        .select("*")
        .eq("status", "active");

      if (accountsError) throw accountsError;
      
      console.log(`✅ Contas Google Ads encontradas: ${googleAccounts?.length || 0}`);

      // Buscar orçamentos personalizados ATIVOS para Google Ads
      const today = new Date().toISOString().split('T')[0];
      const { data: customBudgets, error: customBudgetsError } = await supabase
        .from("custom_budgets")
        .select("*")
        .eq("platform", "google")
        .eq("is_active", true)
        .lte("start_date", today)
        .gte("end_date", today);

      if (customBudgetsError) throw customBudgetsError;
      
      console.log(`✅ Orçamentos personalizados ativos para Google Ads: ${customBudgets?.length || 0}`);

      // Criar mapa de orçamentos personalizados por client_id
      const customBudgetMap = new Map();
      customBudgets?.forEach(budget => {
        customBudgetMap.set(budget.client_id, budget);
      });

      // Calcular clientes com contas (baseado apenas na tabela específica)
      const clientsWithAccounts = new Set();
      googleAccounts?.forEach(account => {
        clientsWithAccounts.add(account.client_id);
      });
      
      const clientsWithoutAccount = clients?.filter(client => 
        !clientsWithAccounts.has(client.id)
      ).length || 0;

      console.log("📊 Clientes com conta Google:", clientsWithAccounts.size);
      console.log("📊 Clientes sem conta Google:", clientsWithoutAccount);

      // Buscar revisões mais recentes do Google Ads (apenas do mês atual)
      const currentDate = new Date();
      const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const firstDayStr = firstDayOfMonth.toISOString().split("T")[0];
      
      console.log(`🔍 Buscando revisões a partir de ${firstDayStr}`);
      
      const { data: reviews, error: reviewsError } = await supabase
        .from("google_ads_reviews")
        .select("*")
        .gte("review_date", firstDayStr)
        .order("review_date", { ascending: false });

      if (reviewsError) throw reviewsError;
      
      console.log(`✅ Revisões encontradas: ${reviews?.length || 0}`);

      // Combinar os dados - incluir TODOS os clientes
      const clientsWithData = clients?.map(client => {
        // Verificar se tem orçamento personalizado ativo
        const customBudget = customBudgetMap.get(client.id);
        const isUsingCustomBudget = !!customBudget;
        
        // Encontrar contas específicas do cliente
        const accounts = googleAccounts?.filter(account => account.client_id === client.id) || [];
        
        // Se o cliente tiver contas específicas, criar um item para cada conta
        if (accounts.length > 0) {
          return accounts.map(account => {
            // Encontrar revisões para esta conta (apenas do mês atual)
            const accountReviews = reviews?.filter(r => 
              r.client_id === client.id && 
              (r.google_account_id === account.account_id || r.client_account_id === account.id)
            ) || [];
            
            // Usar a revisão mais recente
            const review = accountReviews.length > 0 ? accountReviews[0] : null;
            
            // Determinar o orçamento a ser usado
            const originalBudgetAmount = account.budget_amount || 0;
            const budgetAmount = isUsingCustomBudget ? customBudget.budget_amount : originalBudgetAmount;
            
            // Obter a média de gasto dos últimos 5 dias (se disponível)
            const lastFiveDaysAvg = review?.google_last_five_days_spent || 0;
            
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
              isUsingCustomBudget,
              customBudget,
              review: review || null,
              budgetCalculation: budgetCalc,
              needsAdjustment: budgetCalc.needsBudgetAdjustment || budgetCalc.needsAdjustmentBasedOnAverage,
              lastFiveDaysAvg: lastFiveDaysAvg,
              hasAccount: true
            };
          });
        }
        // Cliente sem conta cadastrada
        else {
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
              recommendedDailyBudget: 0,
              needsBudgetAdjustment: false,
              adjustmentReason: null,
              currentSpendRate: 0,
              daysRemaining: 0
            },
            needsAdjustment: false,
            lastFiveDaysAvg: 0,
            hasAccount: false
          };
        }
      }) || [];

      // Achatar o array
      const flattenedClients = clientsWithData.flat().filter(Boolean);
      
      // Calcular métricas usando o orçamento correto
      const totalBudget = flattenedClients.reduce((sum, client) => sum + (client.budget_amount || 0), 0);
      const totalSpent = flattenedClients.reduce((sum, client) => sum + (client.review?.google_total_spent || 0), 0);
      
      const metricsData = {
        totalClients: flattenedClients.length,
        clientsWithoutAccount: clientsWithoutAccount,
        totalBudget: totalBudget,
        totalSpent: totalSpent,
        spentPercentage: totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0
      };
      
      console.log("📊 Métricas calculadas:", metricsData);
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
