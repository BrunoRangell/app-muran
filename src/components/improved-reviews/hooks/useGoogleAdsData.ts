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
      
      // Buscar clientes ativos - FONTE ÚNICA DE VERDADE para orçamentos
      const { data: clients, error: clientsError } = await supabase
        .from("clients")
        .select(`
          id,
          company_name,
          status,
          google_ads_budget,
          google_account_id
        `)
        .eq("status", "active");

      if (clientsError) throw clientsError;
      
      console.log(`✅ Clientes encontrados: ${clients?.length || 0}`);

      // Buscar contas Google adicionais (apenas para múltiplas contas)
      const { data: additionalGoogleAccounts, error: accountsError } = await supabase
        .from("client_google_accounts")
        .select("*")
        .eq("status", "active")
        .eq("is_primary", false); // Apenas contas secundárias

      if (accountsError) throw accountsError;
      
      console.log(`✅ Contas Google Ads adicionais encontradas: ${additionalGoogleAccounts?.length || 0}`);

      // Buscar orçamentos personalizados ATIVOS para Google Ads - TABELA UNIFICADA
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

      // Calcular clientes com contas
      const clientsWithAccounts = new Set();
      
      // Processar clientes com conta principal (da tabela clients)
      clients?.forEach(client => {
        if (client.google_account_id) {
          clientsWithAccounts.add(client.id);
        }
      });
      
      // Adicionar clientes com contas adicionais
      additionalGoogleAccounts?.forEach(account => {
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
        
        // Verificar se tem conta principal
        const hasMainAccount = client.google_account_id && client.google_account_id !== '';
        
        // Buscar contas adicionais
        const additionalAccounts = additionalGoogleAccounts?.filter(account => 
          account.client_id === client.id
        ) || [];
        
        const allAccounts = [];
        
        // Adicionar conta principal se existir
        if (hasMainAccount) {
          allAccounts.push({
            account_id: client.google_account_id,
            account_name: "Conta Principal",
            budget_amount: client.google_ads_budget || 0, // FONTE ÚNICA: clients.google_ads_budget
            is_primary: true
          });
        }
        
        // Adicionar contas secundárias
        additionalAccounts.forEach(account => {
          allAccounts.push({
            account_id: account.account_id,
            account_name: account.account_name,
            budget_amount: account.budget_amount,
            is_primary: false
          });
        });
        
        // Se o cliente tiver contas específicas, criar um item para cada conta
        if (allAccounts.length > 0) {
          return allAccounts.map(account => {
            // Encontrar revisões para esta conta (apenas do mês atual)
            const accountReviews = reviews?.filter(r => 
              r.client_id === client.id && 
              r.google_account_id === account.account_id
            ) || [];
            
            // Usar a revisão mais recente
            const review = accountReviews.length > 0 ? accountReviews[0] : null;
            
            // Determinar o orçamento a ser usado
            const originalBudgetAmount = account.budget_amount;
            const budgetAmount = isUsingCustomBudget ? customBudget.budget_amount : originalBudgetAmount;
            
            // Obter a média de gasto dos últimos 5 dias (se disponível)
            const lastFiveDaysAvg = review?.google_last_five_days_spent || 0;
            
            // Calcular orçamento recomendado
            const budgetCalc = calculateBudget({
              monthlyBudget: budgetAmount,
              totalSpent: review?.google_total_spent || 0,
              currentDailyBudget: review?.google_daily_budget_current || 0,
              lastFiveDaysAverage: lastFiveDaysAvg,
              customBudgetEndDate: customBudget?.end_date
            });
            
            const needsAdjustment = budgetCalc.needsBudgetAdjustment;
            
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
              idealDailyBudget: 0,
              budgetDifference: 0,
              remainingDays: 0,
              remainingBudget: 0,
              needsBudgetAdjustment: false,
              spentPercentage: 0
            },
            needsAdjustment: false,
            lastFiveDaysAvg: 0,
            hasAccount: false
          };
        }
      }) || [];

      // Achatar o array
      const flattenedClients = clientsWithData.flat().filter(Boolean);
      
      // Calcular métricas - CORREÇÃO: usar clientsWithAccounts.size para clientes monitorados
      const totalBudget = flattenedClients.reduce((sum, client) => sum + (client.budget_amount || 0), 0);
      const totalSpent = flattenedClients.reduce((sum, client) => sum + (client.review?.google_total_spent || 0), 0);
      
      const metricsData = {
        totalClients: clientsWithAccounts.size, // CORRIGIDO: usar clientes com contas
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
