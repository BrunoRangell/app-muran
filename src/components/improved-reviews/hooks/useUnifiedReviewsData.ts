
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
      console.log("🔍 Buscando dados dos clientes Meta Ads consolidados...");
      
      // Buscar clientes ativos - FONTE ÚNICA DE VERDADE para orçamentos
      const { data: clients, error: clientsError } = await supabase
        .from("clients")
        .select(`
          id,
          company_name,
          status,
          meta_ads_budget,
          meta_account_id
        `)
        .eq("status", "active");

      if (clientsError) {
        console.error("❌ Erro ao buscar clientes:", clientsError);
        throw clientsError;
      }

      console.log("✅ Clientes encontrados:", clients?.length || 0);

      // Buscar contas Meta adicionais (apenas para múltiplas contas)
      const { data: additionalMetaAccounts, error: accountsError } = await supabase
        .from("client_meta_accounts")
        .select("*")
        .eq("status", "active")
        .eq("is_primary", false); // Apenas contas secundárias

      if (accountsError) {
        console.error("❌ Erro ao buscar contas Meta adicionais:", accountsError);
        throw accountsError;
      }

      console.log("✅ Contas Meta adicionais encontradas:", additionalMetaAccounts?.length || 0);

      // MUDANÇA PRINCIPAL: Buscar revisões desde o início do mês, igual ao Google Ads
      const today = new Date();
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      const firstDayStr = firstDay.toISOString().split("T")[0];
      
      console.log(`🔍 Buscando revisões Meta desde ${firstDayStr} (início do mês)`);
      
      const { data: reviews, error: reviewsError } = await supabase
        .from("daily_budget_reviews")
        .select(`*`)
        .gte("review_date", firstDayStr)
        .order("review_date", { ascending: false }); // Mais recente primeiro

      if (reviewsError) {
        console.error("❌ Erro ao buscar revisões:", reviewsError);
        throw reviewsError;
      }
      
      console.log("✅ Revisões encontradas desde início do mês:", reviews?.length || 0);
      
      // Buscar orçamentos personalizados ativos - TABELA UNIFICADA
      const todayStr = today.toISOString().split("T")[0];
      const { data: activeCustomBudgets, error: budgetsError } = await supabase
        .from("custom_budgets")
        .select("*")
        .eq("platform", "meta")
        .eq("is_active", true)
        .lte("start_date", todayStr)
        .gte("end_date", todayStr);
      
      if (budgetsError) {
        console.error("❌ Erro ao buscar orçamentos personalizados:", budgetsError);
        throw budgetsError;
      }
      
      console.log("✅ Orçamentos personalizados ativos:", activeCustomBudgets?.length || 0);
      
      // Mapear orçamentos personalizados por client_id
      const customBudgetsByClientId = new Map();
      activeCustomBudgets?.forEach(budget => {
        customBudgetsByClientId.set(budget.client_id, budget);
      });

      // Criar Set de clientes com contas Meta
      const clientsWithAccounts = new Set();
      
      // Processar clientes com conta principal (da tabela clients)
      clients?.forEach(client => {
        if (client.meta_account_id) {
          clientsWithAccounts.add(client.id);
        }
      });
      
      // Adicionar clientes com contas adicionais
      additionalMetaAccounts?.forEach(account => {
        clientsWithAccounts.add(account.client_id);
      });
      
      const clientsWithoutAccount = clients?.filter(client => 
        !clientsWithAccounts.has(client.id)
      ).length || 0;

      console.log("📊 Clientes com conta Meta:", clientsWithAccounts.size);
      console.log("📊 Clientes sem conta Meta:", clientsWithoutAccount);

      // Combinar os dados - incluir TODOS os clientes
      const clientsWithData = clients?.map(client => {
        // Verificar se tem conta principal (da tabela clients)
        const hasMainAccount = client.meta_account_id && client.meta_account_id !== '';
        
        // Buscar contas adicionais
        const additionalAccounts = additionalMetaAccounts?.filter(account => 
          account.client_id === client.id
        ) || [];
        
        const allAccounts = [];
        
        // Adicionar conta principal se existir
        if (hasMainAccount) {
          allAccounts.push({
            account_id: client.meta_account_id,
            account_name: "Conta Principal",
            budget_amount: client.meta_ads_budget || 0, // FONTE ÚNICA: clients.meta_ads_budget
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
        
        // Se o cliente tem contas Meta configuradas
        if (allAccounts.length > 0) {
          return allAccounts.map(account => {
            // MUDANÇA PRINCIPAL: Buscar a revisão mais recente para esta conta
            const clientReviews = reviews?.filter(r => 
              r.client_id === client.id && 
              r.meta_account_id === account.account_id
            ) || [];
            
            // Usar a revisão mais recente (primeira no array ordenado)
            const review = clientReviews.length > 0 ? clientReviews[0] : null;
            
            console.log(`🔍 Cliente ${client.company_name} (${account.account_name}): ${clientReviews.length} revisões encontradas, usando: ${review?.review_date || 'nenhuma'}`);
            
            let customBudget = null;
            let monthlyBudget = account.budget_amount;
            let isUsingCustomBudget = false;
            let customBudgetEndDate = null;
            
            // Verificar orçamento personalizado na revisão
            if (review?.using_custom_budget && review?.custom_budget_amount) {
              isUsingCustomBudget = true;
              monthlyBudget = review.custom_budget_amount;
              customBudgetEndDate = review.custom_budget_end_date;
              
              if (review.custom_budget_id) {
                customBudget = {
                  id: review.custom_budget_id,
                  budget_amount: review.custom_budget_amount,
                  start_date: review.custom_budget_start_date,
                  end_date: review.custom_budget_end_date
                };
              }
            } 
            // Verificar orçamento personalizado ativo
            else if (customBudgetsByClientId.has(client.id)) {
              const budget = customBudgetsByClientId.get(client.id);
              customBudget = budget;
              monthlyBudget = budget.budget_amount;
              isUsingCustomBudget = true;
              customBudgetEndDate = budget.end_date;
            }
            
            console.log(`🔍 DEBUG - Cliente ${client.company_name}: customBudgetEndDate = ${customBudgetEndDate}`);
            
            const budgetCalc = calculateBudget({
              monthlyBudget: monthlyBudget,
              totalSpent: review?.meta_total_spent || 0,
              currentDailyBudget: review?.meta_daily_budget_current || 0,
              customBudgetEndDate: customBudgetEndDate
            });
            
            const needsAdjustment = budgetCalc.needsBudgetAdjustment;
            
            const clientData = {
              ...client,
              meta_account_id: account.account_id,
              meta_account_name: account.account_name,
              budget_amount: monthlyBudget,
              original_budget_amount: account.budget_amount,
              review: review || null,
              budgetCalculation: budgetCalc,
              needsAdjustment: needsAdjustment,
              customBudget: customBudget,
              isUsingCustomBudget: isUsingCustomBudget,
              hasAccount: true
            };
            
            console.log(`📝 Cliente processado: ${client.company_name} (${account.account_name})`, {
              totalSpent: review?.meta_total_spent || 0,
              budgetAmount: monthlyBudget,
              needsAdjustment: needsAdjustment,
              budgetDifference: budgetCalc.budgetDifference,
              needsBudgetAdjustment: budgetCalc.needsBudgetAdjustment,
              hasReview: !!review,
              reviewDate: review?.review_date,
              sourceTable: account.is_primary ? "clients" : "client_meta_accounts",
              customBudgetEndDate: customBudgetEndDate,
              remainingDays: budgetCalc.remainingDays
            });
            
            return clientData;
          });
        } 
        // Cliente sem conta cadastrada
        else {
          const clientData = {
            ...client,
            meta_account_id: null,
            meta_account_name: "Sem conta cadastrada",
            budget_amount: 0,
            original_budget_amount: 0,
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
            customBudget: null,
            isUsingCustomBudget: false,
            hasAccount: false
          };
          
          console.log(`📝 Cliente SEM CONTA processado: ${client.company_name}`);
          
          return clientData;
        }
      }) || [];

      // Achatar o array
      const flattenedClients = clientsWithData.flat();
      
      // Calcular métricas
      const totalBudget = flattenedClients.reduce((sum, client) => sum + (client.budget_amount || 0), 0);
      const totalSpent = flattenedClients.reduce((sum, client) => sum + (client.review?.meta_total_spent || 0), 0);
      
      console.log("📊 Métricas calculadas:", {
        totalClients: clientsWithAccounts.size,
        totalBudget,
        totalSpent,
        clientsWithoutAccount: clientsWithoutAccount,
        spentPercentage: totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0
      });
      
      setMetrics({
        totalClients: clientsWithAccounts.size,
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
