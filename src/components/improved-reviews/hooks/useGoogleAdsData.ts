
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

      // Buscar revisões mais recentes do Google Ads (apenas do mês atual) - INCLUINDO DADOS DIÁRIOS
      const currentDate = new Date();
      const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const firstDayStr = firstDayOfMonth.toISOString().split("T")[0];
      
      console.log(`🔍 Buscando revisões a partir de ${firstDayStr}`);
      
      const { data: reviews, error: reviewsError } = await supabase
        .from("google_ads_reviews")
        .select(`
          *,
          google_day_1_spent,
          google_day_2_spent,
          google_day_3_spent,
          google_day_4_spent,
          google_day_5_spent,
          warning_ignored_today,
          warning_ignored_date
        `)
        .gte("review_date", firstDayStr)
        .order("review_date", { ascending: false });

      if (reviewsError) throw reviewsError;
      
      console.log(`✅ Revisões encontradas: ${reviews?.length || 0}`);
      
      // Função auxiliar para calcular média ponderada
      const calculateWeightedAverage = (review: any) => {
        if (!review) return 0;
        
        const day1 = review.google_day_1_spent || 0; // 5 dias atrás (peso 0.1)
        const day2 = review.google_day_2_spent || 0; // 4 dias atrás (peso 0.15)
        const day3 = review.google_day_3_spent || 0; // 3 dias atrás (peso 0.2)
        const day4 = review.google_day_4_spent || 0; // 2 dias atrás (peso 0.25)
        const day5 = review.google_day_5_spent || 0; // 1 dia atrás (peso 0.3)
        
        // Calcular média ponderada com pesos crescentes para dias mais recentes
        const weightedAverage = (day1 * 0.1) + (day2 * 0.15) + (day3 * 0.2) + (day4 * 0.25) + (day5 * 0.3);
        
        console.log(`📊 Média ponderada calculada:`, {
          day1, day2, day3, day4, day5, weightedAverage
        });
        
        return weightedAverage;
      };

      // Verificar se o aviso foi ignorado hoje
      const checkWarningIgnored = (review: any) => {
        if (!review) return false;
        
        const today = new Date().toISOString().split('T')[0];
        const ignoredDate = review.warning_ignored_date;
        const isIgnored = review.warning_ignored_today;
        
        return isIgnored && ignoredDate === today;
      };

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
            
            // Calcular média ponderada dos últimos 5 dias
            const weightedAverage = calculateWeightedAverage(review);
            
            // Verificar se o aviso foi ignorado hoje
            const warningIgnoredToday = checkWarningIgnored(review);
            
            // Determinar o orçamento a ser usado
            const originalBudgetAmount = account.budget_amount;
            const budgetAmount = isUsingCustomBudget ? customBudget.budget_amount : originalBudgetAmount;
            
            // Obter a média de gasto dos últimos 5 dias (se disponível)
            const lastFiveDaysAvg = review?.google_last_five_days_spent || 0;
            
            // CORREÇÃO: Passar warningIgnoredToday como parâmetro
            const budgetCalc = calculateBudget({
              monthlyBudget: budgetAmount,
              totalSpent: review?.google_total_spent || 0,
              currentDailyBudget: review?.google_daily_budget_current || 0,
              weightedAverage: weightedAverage,
              customBudgetEndDate: customBudget?.end_date,
              warningIgnoredToday: warningIgnoredToday
            });
            
            // CORREÇÃO: Verificar se realmente precisa de ajuste baseado na média ponderada
            const needsAdjustment = !warningIgnoredToday && budgetCalc.needsAdjustmentBasedOnWeighted;
            
            // LOG DETALHADO para debugging
            console.log(`🔍 DEBUG DETALHADO - Cliente ${client.company_name}:`, {
              weightedAverage,
              idealDailyBudget: budgetCalc.idealDailyBudget,
              budgetDifferenceBasedOnWeighted: budgetCalc.budgetDifferenceBasedOnWeighted,
              needsAdjustmentBasedOnWeighted: budgetCalc.needsAdjustmentBasedOnWeighted,
              warningIgnoredToday,
              needsAdjustment,
              hasReview: !!review,
              budgetAmount,
              totalSpent: review?.google_total_spent || 0,
              remainingDays: budgetCalc.remainingDays,
              threshold: '≥ R$ 5'
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
              budgetCalculation: {
                ...budgetCalc,
                warningIgnoredToday: warningIgnoredToday
              },
              needsAdjustment: needsAdjustment,
              lastFiveDaysAvg: lastFiveDaysAvg,
              weightedAverage: weightedAverage,
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
              spentPercentage: 0,
              warningIgnoredToday: false
            },
            needsAdjustment: false,
            lastFiveDaysAvg: 0,
            weightedAverage: 0,
            hasAccount: false
          };
        }
      }) || [];

      // Achatar o array
      const flattenedClients = clientsWithData.flat().filter(Boolean);
      
      // LOG FINAL para verificar clientes com ajuste necessário
      const clientsNeedingAdjustment = flattenedClients.filter(client => client.needsAdjustment);
      console.log(`🚨 RESUMO - Clientes que precisam de ajuste: ${clientsNeedingAdjustment.length}`, 
        clientsNeedingAdjustment.map(c => ({
          name: c.company_name,
          needsAdjustment: c.needsAdjustment,
          warningIgnored: c.budgetCalculation?.warningIgnoredToday
        }))
      );
      
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
