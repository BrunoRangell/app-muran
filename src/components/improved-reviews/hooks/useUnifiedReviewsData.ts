
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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
      console.log("🔍 [FASE 4A] Buscando dados Meta Ads com queries em batch...");
      
      const today = new Date();
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      const firstDayStr = firstDay.toISOString().split("T")[0];
      const todayStr = today.toISOString().split("T")[0];
      
      // FASE 4A: Consolidar 6 queries em 1 batch com Promise.all
      const [
        clientsResult,
        metaAccountsResult,
        reviewsResult,
        budgetsResult,
        campaignHealthResult
      ] = await Promise.all([
        // 1. Clientes ativos - select otimizado
        supabase
          .from("clients")
          .select("id, company_name, status")
          .eq("status", "active"),
        
        // 2. Contas Meta - select otimizado
        supabase
          .from("client_accounts")
          .select("id, client_id, account_id, account_name, platform, status, budget_amount, is_primary, saldo_restante, is_prepay_account, last_funding_detected_at, last_funding_amount")
          .eq("status", "active")
          .eq("platform", "meta")
          .order("client_id")
          .order("is_primary", { ascending: false }),
        
        // 3. Revisões do mês - select otimizado
        supabase
          .from("budget_reviews")
          .select("id, client_id, account_id, platform, review_date, daily_budget_current, total_spent, using_custom_budget, custom_budget_id, custom_budget_amount, custom_budget_start_date, custom_budget_end_date, warning_ignored_today, warning_ignored_date, day_1_spent, day_2_spent, day_3_spent, day_4_spent, day_5_spent, last_five_days_spent")
          .eq("platform", "meta")
          .gte("review_date", firstDayStr)
          .order("review_date", { ascending: false }),
        
        // 4. Orçamentos personalizados ativos
        supabase
          .from("custom_budgets")
          .select("id, client_id, budget_amount, start_date, end_date, platform, is_active")
          .eq("platform", "meta")
          .eq("is_active", true)
          .lte("start_date", todayStr)
          .gte("end_date", todayStr),
        
        // 5. Campaign health de hoje - select otimizado
        supabase
          .from("campaign_health")
          .select("id, client_id, account_id, platform, snapshot_date, active_campaigns_count, unserved_campaigns_count, has_account")
          .eq("snapshot_date", todayStr)
          .eq("platform", "meta")
      ]);

      // Validar erros
      if (clientsResult.error) throw clientsResult.error;
      if (metaAccountsResult.error) throw metaAccountsResult.error;
      if (reviewsResult.error) throw reviewsResult.error;
      if (budgetsResult.error) throw budgetsResult.error;
      if (campaignHealthResult.error) throw campaignHealthResult.error;

      const clients = clientsResult.data || [];
      const metaAccounts = metaAccountsResult.data || [];
      const reviews = reviewsResult.data || [];
      const activeCustomBudgets = budgetsResult.data || [];
      const campaignHealthData = campaignHealthResult.data || [];

      console.log("✅ [FASE 4A] Batch query concluído:", {
        clients: clients.length,
        metaAccounts: metaAccounts.length,
        reviews: reviews.length,
        activeCustomBudgets: activeCustomBudgets.length,
        campaignHealth: campaignHealthData.length
      });

      // Mapear dados de campaign_health por client_id e account_id
      const campaignHealthByClientAccount = new Map();
      campaignHealthData?.forEach(health => {
        const key = `${health.client_id}_${health.account_id}`;
        campaignHealthByClientAccount.set(key, health);
      });
      
      // Mapear orçamentos personalizados por client_id
      const customBudgetsByClientId = new Map();
      activeCustomBudgets?.forEach(budget => {
        customBudgetsByClientId.set(budget.client_id, budget);
      });

      // Verificar se o aviso foi ignorado hoje
      const checkWarningIgnored = (review: any) => {
        if (!review) return false;
        
        const today = new Date().toISOString().split('T')[0];
        const ignoredDate = review.warning_ignored_date;
        const isIgnored = review.warning_ignored_today;
        
        const result = isIgnored && ignoredDate === today;
        
        console.log(`🔍 DEBUG - Verificação de warning ignorado:`, {
          isIgnored,
          ignoredDate,
          today,
          result
        });
        
        return result;
      };

      // Criar Set de clientes com contas Meta
      const clientsWithAccounts = new Set();
      
      // Adicionar clientes que têm contas Meta
      metaAccounts?.forEach(account => {
        clientsWithAccounts.add(account.client_id);
      });
      
      const clientsWithoutAccount = clients?.filter(client => 
        !clientsWithAccounts.has(client.id)
      ).length || 0;

      console.log("📊 Clientes com conta Meta:", clientsWithAccounts.size);
      console.log("📊 Clientes sem conta Meta:", clientsWithoutAccount);

      // Combinar os dados - incluir TODOS os clientes
      const clientsWithData = clients?.map(client => {
        // VALIDAÇÃO: garantir que company_name existe
        if (!client.company_name) {
          console.warn(`⚠️ Cliente sem nome da empresa:`, client);
          client.company_name = `Cliente ${client.id.slice(0, 8)}`;
        }
        
        // Buscar contas Meta para este cliente
        const clientMetaAccounts = metaAccounts?.filter(account => 
          account.client_id === client.id
        ) || [];
        
        // Se o cliente tem contas Meta configuradas
        if (clientMetaAccounts.length > 0) {
          return clientMetaAccounts.map(account => {
            // Buscar a revisão mais recente para esta conta
            const clientReviews = reviews?.filter(r => 
              r.client_id === client.id && 
              r.account_id === account.id
            ) || [];
            
            // Usar a revisão mais recente
            const review = clientReviews.length > 0 ? clientReviews[0] : null;
            
            // Verificar se warning foi ignorado hoje
            const warningIgnoredToday = checkWarningIgnored(review);
            
            console.log(`🔍 Cliente ${client.company_name} (${account.account_name}): ${clientReviews.length} revisões encontradas, usando: ${review?.review_date || 'nenhuma'}, warning ignorado: ${warningIgnoredToday}`);
            
            let customBudget = null;
            let monthlyBudget = account.budget_amount;
            let isUsingCustomBudget = false;
            let customBudgetEndDate = null;
            let customBudgetStartDate = null; // CORREÇÃO: Adicionar customBudgetStartDate
            
            // Verificar orçamento personalizado na revisão
            if (review?.using_custom_budget && review?.custom_budget_amount) {
              isUsingCustomBudget = true;
              monthlyBudget = review.custom_budget_amount;
              customBudgetEndDate = review.custom_budget_end_date;
              customBudgetStartDate = review.custom_budget_start_date; // CORREÇÃO: Definir customBudgetStartDate
              
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
              customBudgetStartDate = budget.start_date; // CORREÇÃO: Definir customBudgetStartDate
            }
            
            console.log(`🔍 DEBUG - Cliente ${client.company_name}: customBudgetStartDate = ${customBudgetStartDate}, customBudgetEndDate = ${customBudgetEndDate}`);
            
            // Buscar dados de saldo direto da conta Meta
            const balanceInfo = account.saldo_restante !== null || account.is_prepay_account !== null ? {
              balance: account.saldo_restante || 0,
              balance_type: account.saldo_restante !== null ? "numeric" : (account.is_prepay_account === false ? "credit_card" : "unavailable"),
              balance_value: account.saldo_restante,
              billing_model: account.is_prepay_account ? "pre" : "pos"
            } : null;
            
            console.log(`💰 Balance data para ${client.company_name}:`, balanceInfo);
            
            // Calcular orçamento - CORREÇÃO: Passar customBudgetStartDate
            const budgetCalc = calculateBudget({
              monthlyBudget: monthlyBudget,
              totalSpent: review?.total_spent || 0,
              currentDailyBudget: review?.daily_budget_current || 0,
              customBudgetEndDate: customBudgetEndDate,
              customBudgetStartDate: customBudgetStartDate, // CORREÇÃO: Adicionar este campo
              warningIgnoredToday: warningIgnoredToday
            });
            
            const needsAdjustment = budgetCalc.needsBudgetAdjustment;
            
            // Buscar dados de veiculação para este cliente/conta
            const healthKey = `${client.id}_${account.id}`;
            const healthData = campaignHealthByClientAccount.get(healthKey);
            
            // Determinar status de veiculação
            const getVeiculationStatus = (healthData: any) => {
              if (!healthData) {
                return {
                  status: "no_data",
                  activeCampaigns: 0,
                  campaignsWithoutDelivery: 0,
                  message: "Sem dados de veiculação",
                  badgeColor: "bg-gray-500"
                };
              }

              const activeCampaigns = healthData.active_campaigns_count || 0;
              const campaignsWithoutDelivery = healthData.unserved_campaigns_count || 0;

              if (activeCampaigns === 0) {
                return {
                  status: "no_campaigns",
                  activeCampaigns: 0,
                  campaignsWithoutDelivery: 0,
                  message: "Nenhuma campanha ativa",
                  badgeColor: "bg-gray-500"
                };
              }

              if (campaignsWithoutDelivery === 0) {
                return {
                  status: "all_running",
                  activeCampaigns,
                  campaignsWithoutDelivery: 0,
                  message: "Todas as campanhas rodando",
                  badgeColor: "bg-green-500"
                };
              }

              if (campaignsWithoutDelivery === activeCampaigns) {
                return {
                  status: "none_running",
                  activeCampaigns,
                  campaignsWithoutDelivery,
                  message: "Nenhuma campanha com entrega",
                  badgeColor: "bg-red-500"
                };
              }

              return {
                status: "partial_running",
                activeCampaigns,
                campaignsWithoutDelivery,
                message: `${campaignsWithoutDelivery} de ${activeCampaigns} sem entrega`,
                badgeColor: "bg-yellow-500"
              };
            };

            const veiculationStatus = getVeiculationStatus(healthData);
            
            const clientData = {
               ...client,
               meta_account_id: account.account_id,
               meta_account_name: account.account_name,
               budget_amount: monthlyBudget,
               original_budget_amount: account.budget_amount,
               review: review || null,
               budgetCalculation: {
                 ...budgetCalc,
                 warningIgnoredToday: warningIgnoredToday
               },
               needsAdjustment: needsAdjustment,
               customBudget: customBudget,
               isUsingCustomBudget: isUsingCustomBudget,
               hasAccount: true,
               meta_daily_budget: review?.daily_budget_current || 0,
               balance_info: balanceInfo || null,
               veiculationStatus: veiculationStatus,
               last_funding_detected_at: account.last_funding_detected_at,
               last_funding_amount: account.last_funding_amount
             };
            
            console.log(`📝 Cliente processado: ${client.company_name} (${account.account_name})`, {
              totalSpent: review?.total_spent || 0,
              budgetAmount: monthlyBudget,
              needsAdjustment: needsAdjustment,
              budgetDifference: budgetCalc.budgetDifference,
              needsBudgetAdjustment: budgetCalc.needsBudgetAdjustment,
              warningIgnoredToday: warningIgnoredToday,
              hasReview: !!review,
              reviewDate: review?.review_date,
              customBudgetStartDate: customBudgetStartDate,
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
              spentPercentage: 0,
              warningIgnoredToday: false
            },
            needsAdjustment: false,
            customBudget: null,
            isUsingCustomBudget: false,
            hasAccount: false,
            veiculationStatus: {
              status: "no_data",
              activeCampaigns: 0,
              campaignsWithoutDelivery: 0,
              message: "Sem conta cadastrada",
              badgeColor: "bg-gray-500"
            }
          };
          
          console.log(`📝 Cliente SEM CONTA processado: ${client.company_name}`);
          
          return clientData;
        }
      }) || [];

      // Achatar o array
      const flattenedClients = clientsWithData.flat();
      
      // Calcular métricas
      const totalBudget = flattenedClients.reduce((sum, client) => sum + (client.budget_amount || 0), 0);
      const totalSpent = flattenedClients.reduce((sum, client) => sum + (client.review?.total_spent || 0), 0);
      
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
