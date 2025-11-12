import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMetaReviewsWorker } from "@/hooks/useMetaReviewsWorker";
import { logger } from "@/lib/logger";

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

  const { isWorkerReady, processMetaData } = useMetaReviewsWorker();

  // FALLBACK: Processar dados na main thread quando worker não estiver pronto
  const processMetaDataFallback = useCallback((
    clients: any[],
    metaAccounts: any[],
    reviews: any[],
    activeCustomBudgets: any[],
    campaignHealthData: any[]
  ) => {
    logger.info('🔄 Processando dados na main thread (fallback)...');

    const campaignHealthByClientAccount = new Map();
    campaignHealthData.forEach(health => {
      const key = `${health.client_id}_${health.account_id}`;
      campaignHealthByClientAccount.set(key, health);
    });
    
    const customBudgetsByClientId = new Map();
    activeCustomBudgets.forEach(budget => {
      customBudgetsByClientId.set(budget.client_id, budget);
    });

    const clientsWithAccounts = new Set();
    metaAccounts.forEach(account => {
      clientsWithAccounts.add(account.client_id);
    });
    
    const clientsWithoutAccount = clients.filter(client => 
      !clientsWithAccounts.has(client.id)
    ).length || 0;

    const clientsWithData = clients.map(client => {
      if (!client.company_name) {
        client.company_name = `Cliente ${client.id.slice(0, 8)}`;
      }
      
      const clientMetaAccounts = metaAccounts.filter(account => 
        account.client_id === client.id
      ) || [];
      
      if (clientMetaAccounts.length > 0) {
        return clientMetaAccounts.map(account => {
          const clientReviews = reviews.filter(r => 
            r.client_id === client.id && 
            r.account_id === account.id
          ) || [];
          
          const review = clientReviews.length > 0 ? clientReviews[0] : null;
          
          const today = new Date().toISOString().split('T')[0];
          const warningIgnoredToday = review?.warning_ignored_today && review?.warning_ignored_date === today;
          
          let monthlyBudget = account.budget_amount;
          let isUsingCustomBudget = false;
          let customBudgetEndDate = null;
          let customBudgetStartDate = null;
          let customBudget = null;
          
          if (review?.using_custom_budget && review?.custom_budget_amount) {
            isUsingCustomBudget = true;
            monthlyBudget = review.custom_budget_amount;
            customBudgetEndDate = review.custom_budget_end_date;
            customBudgetStartDate = review.custom_budget_start_date;
            
            if (review.custom_budget_id) {
              customBudget = {
                id: review.custom_budget_id,
                budget_amount: review.custom_budget_amount,
                start_date: review.custom_budget_start_date,
                end_date: review.custom_budget_end_date
              };
            }
          } else if (customBudgetsByClientId.has(client.id)) {
            const budget = customBudgetsByClientId.get(client.id);
            customBudget = budget;
            monthlyBudget = budget.budget_amount;
            isUsingCustomBudget = true;
            customBudgetEndDate = budget.end_date;
            customBudgetStartDate = budget.start_date;
          }
          
          // Calcular budget
          const now = new Date();
          const currentDay = now.getDate();
          const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
          
          let budgetStartDay = 1;
          let budgetEndDay = daysInMonth;
          
          if (customBudgetStartDate && customBudgetEndDate) {
            const startDate = new Date(customBudgetStartDate);
            const endDate = new Date(customBudgetEndDate);
            const currentMonth = now.getMonth();
            const currentYear = now.getFullYear();
            
            if (startDate.getMonth() === currentMonth && startDate.getFullYear() === currentYear) {
              budgetStartDay = startDate.getDate();
              budgetEndDay = endDate.getDate();
            }
          }
          
          const remainingDays = Math.max(budgetEndDay - currentDay, 1);
          const totalSpent = review?.total_spent || 0;
          const remainingBudget = Math.max(monthlyBudget - totalSpent, 0);
          const idealDailyBudget = remainingBudget / remainingDays;
          const currentDailyBudget = review?.daily_budget_current || 0;
          const budgetDifference = idealDailyBudget - currentDailyBudget;
          
          // Threshold de R$ 5 para acusar ajuste necessário
          let needsBudgetAdjustment = false;
          
          if (!warningIgnoredToday) {
            needsBudgetAdjustment = Math.abs(budgetDifference) >= 5;
          }
          
          const balanceInfo = account.saldo_restante !== null || account.is_prepay_account !== null ? {
            balance: account.saldo_restante || 0,
            balance_type: account.saldo_restante !== null ? "numeric" : "unavailable",
            balance_value: account.saldo_restante,
            billing_model: account.is_prepay_account ? "pre" : "pos"
          } : null;
          
          const healthKey = `${client.id}_${account.id}`;
          const healthData = campaignHealthByClientAccount.get(healthKey);
          
          let veiculationStatus;
          if (!healthData) {
            veiculationStatus = {
              status: "no_data",
              activeCampaigns: 0,
              campaignsWithoutDelivery: 0,
              message: "Sem dados de veiculação",
              badgeColor: "bg-gray-500"
            };
          } else {
            const activeCampaigns = healthData.active_campaigns_count || 0;
            const campaignsWithoutDelivery = healthData.unserved_campaigns_count || 0;

            if (activeCampaigns === 0) {
              veiculationStatus = {
                status: "no_campaigns",
                activeCampaigns: 0,
                campaignsWithoutDelivery: 0,
                message: "Nenhuma campanha ativa",
                badgeColor: "bg-gray-500"
              };
            } else if (campaignsWithoutDelivery === 0) {
              veiculationStatus = {
                status: "all_running",
                activeCampaigns,
                campaignsWithoutDelivery: 0,
                message: "Todas as campanhas rodando",
                badgeColor: "bg-green-500"
              };
            } else if (campaignsWithoutDelivery === activeCampaigns) {
              veiculationStatus = {
                status: "none_running",
                activeCampaigns,
                campaignsWithoutDelivery,
                message: "Nenhuma campanha com entrega",
                badgeColor: "bg-red-500"
              };
            } else {
              veiculationStatus = {
                status: "partial_running",
                activeCampaigns,
                campaignsWithoutDelivery,
                message: `${campaignsWithoutDelivery} de ${activeCampaigns} sem entrega`,
                badgeColor: "bg-yellow-500"
              };
            }
          }
          
          return {
            ...client,
            meta_account_id: account.account_id,
            meta_account_uuid: account.id, // UUID do client_accounts para queries
            meta_account_name: account.account_name,
            budget_amount: monthlyBudget,
            original_budget_amount: account.budget_amount,
            review: review || null,
            budgetCalculation: {
              idealDailyBudget,
              budgetDifference,
              remainingDays,
              remainingBudget,
              needsBudgetAdjustment,
              warningIgnoredToday,
            },
            needsAdjustment: needsBudgetAdjustment,
            customBudget,
            isUsingCustomBudget,
            hasAccount: true,
            meta_daily_budget: currentDailyBudget,
            balance_info: balanceInfo || null,
            veiculationStatus,
            last_funding_detected_at: account.last_funding_detected_at,
            last_funding_amount: account.last_funding_amount
          };
        });
      } else {
        return {
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
      }
    }) || [];

    const flattenedClients = clientsWithData.flat();
    
    const totalBudget = flattenedClients.reduce((sum, client) => sum + (client.budget_amount || 0), 0);
    const totalSpent = flattenedClients.reduce((sum, client) => sum + (client.review?.total_spent || 0), 0);
    
    const metrics = {
      totalClients: clientsWithAccounts.size,
      clientsWithoutAccount,
      totalBudget,
      totalSpent,
      spentPercentage: totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0
    };

    logger.info('✅ Dados processados na main thread:', {
      totalClients: flattenedClients.length,
      withMetaAccounts: flattenedClients.filter(c => c.hasAccount).length,
      metrics
    });

    return { clients: flattenedClients, metrics };
  }, []);

  const { 
    data, 
    isLoading, 
    error, 
    refetch 
  } = useQuery({
    queryKey: ["improved-meta-reviews"],
    enabled: isWorkerReady, // SOLUÇÃO 2: Aguardar worker ficar pronto
    queryFn: async () => {
      logger.debug("🔄 FASE 5A: Iniciando busca unificada de dados...");
      
      const today = new Date();
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      const firstDayStr = firstDay.toISOString().split("T")[0];
      const todayStr = today.toISOString().split("T")[0];
      
      // FASE 4A: Consolidar queries em batch com Promise.all
      const [
        clientsResult,
        metaAccountsResult,
        reviewsResult,
        budgetsResult,
        campaignHealthResult
      ] = await Promise.all([
        supabase
          .from("clients")
          .select("id, company_name, status")
          .eq("status", "active"),
        
        supabase
          .from("client_accounts")
          .select("id, client_id, account_id, account_name, platform, status, budget_amount, is_primary, saldo_restante, is_prepay_account, last_funding_detected_at, last_funding_amount")
          .eq("status", "active")
          .eq("platform", "meta")
          .order("client_id")
          .order("is_primary", { ascending: false }),
        
        supabase
          .from("budget_reviews")
          .select("id, client_id, account_id, platform, review_date, daily_budget_current, total_spent, using_custom_budget, custom_budget_id, custom_budget_amount, custom_budget_start_date, custom_budget_end_date, warning_ignored_today, warning_ignored_date, day_1_spent, day_2_spent, day_3_spent, day_4_spent, day_5_spent, last_five_days_spent")
          .eq("platform", "meta")
          .gte("review_date", firstDayStr)
          .order("review_date", { ascending: false }),
        
        supabase
          .from("custom_budgets")
          .select("id, client_id, budget_amount, start_date, end_date, platform, is_active")
          .eq("platform", "meta")
          .eq("is_active", true)
          .lte("start_date", todayStr)
          .gte("end_date", todayStr),
        
        supabase
          .from("campaign_health")
          .select("id, client_id, account_id, platform, snapshot_date, active_campaigns_count, unserved_campaigns_count, has_account")
          .eq("snapshot_date", todayStr)
          .eq("platform", "meta")
      ]);

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

      logger.debug("✅ FASE 4A: Batch query concluído:", {
        clients: clients.length,
        metaAccounts: metaAccounts.length,
        reviews: reviews.length,
        activeCustomBudgets: activeCustomBudgets.length,
        campaignHealth: campaignHealthData.length
      });

      // FASE 5A & 5B: Processar dados no Web Worker com fallback
      let result;
      
      if (!isWorkerReady) {
        logger.warn('⚠️ Worker não está pronto, usando fallback na main thread');
        result = processMetaDataFallback(
          clients,
          metaAccounts,
          reviews,
          activeCustomBudgets,
          campaignHealthData
        );
      } else {
        try {
          logger.debug('⚙️ FASE 5A: Enviando dados para Web Worker...');
          result = await processMetaData(
            clients,
            metaAccounts,
            reviews,
            activeCustomBudgets,
            campaignHealthData
          );

          logger.debug('✅ FASE 5A: Dados processados pelo Worker:', {
            totalClients: result.clients.length,
            withMetaAccounts: result.clients.filter((c: any) => c.hasAccount).length,
          });
        } catch (workerError) {
          logger.error('❌ Erro no worker, usando fallback:', workerError);
          result = processMetaDataFallback(
            clients,
            metaAccounts,
            reviews,
            activeCustomBudgets,
            campaignHealthData
          );
        }
      }

      setMetrics(result.metrics);
      return result.clients;
    },
    staleTime: 30 * 60 * 1000, // FASE 4A: 30 minutos
  });

  return {
    data,
    isLoading,
    error,
    metrics,
    refreshData: refetch
  };
}
