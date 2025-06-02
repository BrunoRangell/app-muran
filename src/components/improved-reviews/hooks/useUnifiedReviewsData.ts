import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useBudgetCalculator } from "./useBudgetCalculator";

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

  // Fetch clients with their Meta accounts and reviews
  const { 
    data, 
    isLoading, 
    error, 
    refetch 
  } = useQuery({
    queryKey: ["improved-meta-reviews"],
    queryFn: async () => {
      console.log("🔍 Buscando dados dos clientes Meta Ads...");
      
      // Buscar clientes ativos
      const { data: clients, error: clientsError } = await supabase
        .from("clients")
        .select(`
          id,
          company_name,
          meta_ads_budget,
          meta_account_id,
          status
        `)
        .eq("status", "active");

      if (clientsError) {
        console.error("❌ Erro ao buscar clientes:", clientsError);
        throw clientsError;
      }

      console.log("✅ Clientes encontrados:", clients?.length || 0);

      // Buscar contas Meta dos clientes
      const { data: metaAccounts, error: accountsError } = await supabase
        .from("client_meta_accounts")
        .select("*")
        .eq("status", "active");

      if (accountsError) {
        console.error("❌ Erro ao buscar contas Meta:", accountsError);
        throw accountsError;
      }

      console.log("✅ Contas Meta encontradas:", metaAccounts?.length || 0);

      // Buscar revisões mais recentes
      const today = new Date().toISOString().split("T")[0];
      const { data: reviews, error: reviewsError } = await supabase
        .from("daily_budget_reviews")
        .select(`*`)
        .eq("review_date", today);

      if (reviewsError) {
        console.error("❌ Erro ao buscar revisões:", reviewsError);
        throw reviewsError;
      }
      
      console.log("✅ Revisões encontradas para hoje:", reviews?.length || 0);
      
      if (reviews && reviews.length > 0) {
        reviews.forEach(review => {
          console.log(`📊 Revisão cliente ${review.client_id}:`, {
            totalSpent: review.meta_total_spent,
            currentBudget: review.meta_daily_budget_current,
            accountId: review.meta_account_id || 'principal',
            accountName: review.meta_account_name || 'Conta Principal'
          });
        });
      } else {
        console.warn("⚠️ Nenhuma revisão encontrada para hoje. Clientes aparecerão com dados zerados.");
      }
      
      // Buscar orçamentos personalizados separadamente
      const { data: customBudgets, error: customBudgetsError } = await supabase
        .from("meta_custom_budgets")
        .select("*");
      
      if (customBudgetsError) {
        console.error("❌ Erro ao buscar orçamentos personalizados:", customBudgetsError);
        throw customBudgetsError;
      }
      
      // Buscar orçamentos personalizados ativos
      const { data: activeCustomBudgets, error: budgetsError } = await supabase
        .from("meta_custom_budgets")
        .select("*")
        .eq("is_active", true)
        .lte("start_date", today)
        .gte("end_date", today);
      
      if (budgetsError) {
        console.error("❌ Erro ao buscar orçamentos ativos:", budgetsError);
        throw budgetsError;
      }
      
      console.log("✅ Orçamentos personalizados ativos:", activeCustomBudgets?.length || 0);
      
      // Mapear orçamentos personalizados por client_id para fácil acesso
      const customBudgetsByClientId = new Map();
      activeCustomBudgets?.forEach(budget => {
        customBudgetsByClientId.set(budget.client_id, budget);
      });

      // Corrigir cálculo de clientes com contas - verificar ambas as fontes
      const clientsWithAccounts = new Set();
      
      // Adicionar clientes que têm meta_account_id na tabela clients
      clients?.forEach(client => {
        if (client.meta_account_id) {
          clientsWithAccounts.add(client.id);
        }
      });
      
      // Adicionar clientes que têm contas na tabela client_meta_accounts
      metaAccounts?.forEach(account => {
        clientsWithAccounts.add(account.client_id);
      });
      
      const clientsWithoutAccount = clients?.filter(client => 
        !clientsWithAccounts.has(client.id)
      ).length || 0;

      console.log("📊 Clientes com conta:", clientsWithAccounts.size);
      console.log("📊 Clientes sem conta:", clientsWithoutAccount);

      // Combinar os dados - incluir TODOS os clientes, mesmo os sem conta
      const clientsWithData = clients?.map(client => {
        // Encontrar contas específicas do cliente
        const accounts = metaAccounts?.filter(account => account.client_id === client.id) || [];
        
        // Determinar se o cliente tem conta configurada (verificar ambas as fontes)
        const hasAccount = clientsWithAccounts.has(client.id);
        
        // Se o cliente tiver contas específicas na tabela client_meta_accounts
        if (accounts.length > 0) {
          return accounts.map(account => {
            const review = reviews?.find(r => 
              r.client_id === client.id && 
              (r.meta_account_id === account.account_id || r.client_account_id === account.account_id)
            );
            
            let customBudget = null;
            let monthlyBudget = account.budget_amount;
            let isUsingCustomBudget = false;
            
            if (review?.using_custom_budget && review?.custom_budget_amount) {
              isUsingCustomBudget = true;
              monthlyBudget = review.custom_budget_amount;
              
              if (review.custom_budget_id) {
                customBudget = customBudgets?.find(b => b.id === review.custom_budget_id) || {
                  id: review.custom_budget_id,
                  budget_amount: review.custom_budget_amount,
                  start_date: review.custom_budget_start_date,
                  end_date: review.custom_budget_end_date
                };
              }
            } 
            else if (customBudgetsByClientId.has(client.id)) {
              const budget = customBudgetsByClientId.get(client.id);
              customBudget = budget;
              monthlyBudget = budget.budget_amount;
              isUsingCustomBudget = true;
            }
            
            const budgetCalc = calculateBudget({
              monthlyBudget: monthlyBudget,
              totalSpent: review?.meta_total_spent || 0,
              currentDailyBudget: review?.meta_daily_budget_current || 0
            });
            
            const clientData = {
              ...client,
              meta_account_id: account.account_id,
              meta_account_name: account.account_name,
              budget_amount: monthlyBudget,
              original_budget_amount: account.budget_amount,
              review: review || null,
              budgetCalculation: budgetCalc,
              needsAdjustment: budgetCalc.needsBudgetAdjustment,
              customBudget: customBudget,
              isUsingCustomBudget: isUsingCustomBudget,
              hasAccount: true // Cliente com conta específica sempre tem conta
            };
            
            console.log(`📝 Cliente processado: ${client.company_name} (${account.account_name})`, {
              totalSpent: review?.meta_total_spent || 0,
              budgetAmount: monthlyBudget,
              needsAdjustment: budgetCalc.needsBudgetAdjustment,
              hasReview: !!review
            });
            
            return clientData;
          });
        } 
        // Se o cliente tem meta_account_id na tabela clients (mas não tem conta específica)
        else if (client.meta_account_id) {
          const review = reviews?.find(r => r.client_id === client.id);
          
          let customBudget = null;
          let monthlyBudget = client.meta_ads_budget;
          let isUsingCustomBudget = false;
          
          if (review?.using_custom_budget && review?.custom_budget_amount) {
            isUsingCustomBudget = true;
            monthlyBudget = review.custom_budget_amount;
            
            if (review.custom_budget_id) {
              customBudget = customBudgets?.find(b => b.id === review.custom_budget_id) || {
                id: review.custom_budget_id,
                budget_amount: review.custom_budget_amount,
                start_date: review.custom_budget_start_date,
                end_date: review.custom_budget_end_date
              };
            }
          }
          else if (customBudgetsByClientId.has(client.id)) {
            const budget = customBudgetsByClientId.get(client.id);
            customBudget = budget;
            monthlyBudget = budget.budget_amount;
            isUsingCustomBudget = true;
          }
          
          const budgetCalc = calculateBudget({
            monthlyBudget: monthlyBudget,
            totalSpent: review?.meta_total_spent || 0,
            currentDailyBudget: review?.meta_daily_budget_current || 0
          });
          
          const clientData = {
            ...client,
            meta_account_id: client.meta_account_id,
            meta_account_name: "Conta Principal",
            budget_amount: monthlyBudget,
            original_budget_amount: client.meta_ads_budget,
            review: review || null,
            budgetCalculation: budgetCalc,
            needsAdjustment: budgetCalc.needsBudgetAdjustment,
            customBudget: customBudget,
            isUsingCustomBudget: isUsingCustomBudget,
            hasAccount: true // Cliente com meta_account_id tem conta
          };
          
          console.log(`📝 Cliente processado: ${client.company_name} (Conta Principal)`, {
            totalSpent: review?.meta_total_spent || 0,
            budgetAmount: monthlyBudget,
            needsAdjustment: budgetCalc.needsBudgetAdjustment,
            hasReview: !!review
          });
          
          return clientData;
        }
        // Cliente sem conta cadastrada
        else {
          const clientData = {
            ...client,
            meta_account_id: null,
            meta_account_name: "Sem conta cadastrada",
            budget_amount: 0,
            original_budget_amount: client.meta_ads_budget || 0,
            review: null,
            budgetCalculation: {
              recommendedDailyBudget: 0,
              needsBudgetAdjustment: false,
              adjustmentReason: null,
              currentSpendRate: 0,
              daysRemaining: 0
            },
            needsAdjustment: false,
            customBudget: null,
            isUsingCustomBudget: false,
            hasAccount: false // Cliente sem conta
          };
          
          console.log(`📝 Cliente SEM CONTA processado: ${client.company_name}`);
          
          return clientData;
        }
      }) || [];

      // Achatar o array (já que alguns clientes podem ter várias contas)
      const flattenedClients = clientsWithData.flat();
      
      // Calcular métricas
      const totalBudget = flattenedClients.reduce((sum, client) => sum + (client.budget_amount || 0), 0);
      const totalSpent = flattenedClients.reduce((sum, client) => sum + (client.review?.meta_total_spent || 0), 0);
      
      console.log("📊 Métricas calculadas:", {
        totalClients: flattenedClients.length,
        totalBudget,
        totalSpent,
        clientsWithoutAccount: clientsWithoutAccount,
        spentPercentage: totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0
      });
      
      setMetrics({
        totalClients: flattenedClients.length,
        clientsWithoutAccount: clientsWithoutAccount,
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
