
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getDaysInMonth } from "date-fns";
import { logger } from "@/lib/logger";

interface CampaignDetail {
  id: string;
  name: string;
  cost: number;
  impressions: number;
  status: string;
}

interface VeiculationStatus {
  status: "all_running" | "partial_running" | "none_running" | "no_campaigns" | "no_data";
  activeCampaigns: number;
  campaignsWithoutDelivery: number;
  message: string;
  badgeColor: string;
  campaignsDetailed: CampaignDetail[];
}

export interface GoogleAdsClientData {
  id: string;
  company_name: string;
  google_account_id?: string;
  google_account_name?: string;
  hasAccount: boolean;
  review?: {
    total_spent: number;
    daily_budget_current: number;
  };
  budget_amount: number;
  original_budget_amount: number;
  needsAdjustment: boolean;
  budgetCalculation?: {
    budgetDifference: number;
    remainingDays: number;
    idealDailyBudget: number;
    needsBudgetAdjustment: boolean;
    needsAdjustmentBasedOnAverage: boolean;
    warningIgnoredToday: boolean;
  };
  weightedAverage?: number;
  isUsingCustomBudget?: boolean;
  customBudget?: any;
  veiculationStatus?: VeiculationStatus;
}

export interface GoogleAdsMetrics {
  totalClients: number;
  clientsWithAdjustments: number;
  clientsWithoutAccount: number;
  averageSpend: number;
  totalSpent: number;
  totalBudget: number;
  spentPercentage: number;
  clientsWithCampaignIssues: number;
}

// Função auxiliar para calcular status de veiculação
function calculateVeiculationStatus(campaignHealth: any): VeiculationStatus {
  if (!campaignHealth) {
    return {
      status: "no_data",
      activeCampaigns: 0,
      campaignsWithoutDelivery: 0,
      message: "Dados não disponíveis",
      badgeColor: "bg-gray-100 text-gray-600 border-gray-200",
      campaignsDetailed: []
    };
  }

  const campaignsDetailed: CampaignDetail[] = Array.isArray(campaignHealth.campaigns_detailed)
    ? (campaignHealth.campaigns_detailed as unknown as CampaignDetail[])
    : [];
  const activeCampaignsCount = campaignHealth.active_campaigns_count || 0;
  const unservedCampaignsCount = campaignHealth.unserved_campaigns_count || 0;

  if (activeCampaignsCount === 0) {
    return {
      status: "no_campaigns",
      activeCampaigns: 0,
      campaignsWithoutDelivery: 0,
      message: "Nenhuma campanha ativa",
      badgeColor: "bg-yellow-100 text-yellow-800 border-yellow-200",
      campaignsDetailed: []
    };
  }

  if (unservedCampaignsCount === 0) {
    return {
      status: "all_running",
      activeCampaigns: activeCampaignsCount,
      campaignsWithoutDelivery: 0,
      message: "Todas as campanhas rodando",
      badgeColor: "bg-green-100 text-green-800 border-green-200",
      campaignsDetailed
    };
  }

  if (unservedCampaignsCount === activeCampaignsCount) {
    return {
      status: "none_running",
      activeCampaigns: activeCampaignsCount,
      campaignsWithoutDelivery: unservedCampaignsCount,
      message: "Todas as campanhas com erro",
      badgeColor: "bg-red-100 text-red-800 border-red-200",
      campaignsDetailed
    };
  }

  return {
    status: "partial_running",
    activeCampaigns: activeCampaignsCount,
    campaignsWithoutDelivery: unservedCampaignsCount,
    message: `${unservedCampaignsCount} campanha${unservedCampaignsCount > 1 ? 's' : ''} sem veiculação`,
    badgeColor: "bg-amber-100 text-amber-800 border-amber-200",
    campaignsDetailed
  };
}

const fetchGoogleAdsData = async (budgetCalculationMode: "weighted" | "current" = "weighted"): Promise<GoogleAdsClientData[]> => {
  logger.debug("🔍 FASE 5C: Iniciando busca otimizada com batch queries...");
  
  try {
    // FASE 1: Buscar clientes ativos
    const { data: clients, error: clientsError } = await supabase
      .from('clients')
      .select('id, company_name')
      .eq('status', 'active');

    if (clientsError) throw clientsError;
    if (!clients || clients.length === 0) return [];

    const clientIds = clients.map(c => c.id);
    logger.debug(`✅ ${clients.length} clientes encontrados`);

    const today = new Date().toISOString().split('T')[0];

    // FASE 1.2: BATCH QUERIES - buscar tudo em paralelo (incluindo campaign_health)
    const [accountsResult, reviewsResult, campaignHealthResult] = await Promise.all([
      supabase
        .from('client_accounts')
        .select('id, client_id, account_id, account_name, budget_amount, status')
        .in('client_id', clientIds)
        .eq('platform', 'google')
        .eq('status', 'active'),
      supabase
        .from('budget_reviews')
        .select('client_id, account_id, total_spent, daily_budget_current, last_five_days_spent, custom_budget_amount, using_custom_budget, warning_ignored_today, review_date')
        .in('client_id', clientIds)
        .eq('platform', 'google')
        .order('review_date', { ascending: false }),
      supabase
        .from('campaign_health')
        .select('client_id, account_id, active_campaigns_count, unserved_campaigns_count, campaigns_detailed, snapshot_date')
        .in('client_id', clientIds)
        .eq('platform', 'google')
        .eq('snapshot_date', today)
    ]);

    if (accountsResult.error) throw accountsResult.error;
    if (reviewsResult.error) throw reviewsResult.error;
    // campaign_health pode não existir ainda, não dar erro
    if (campaignHealthResult.error) {
      logger.warn("⚠️ Erro ao buscar campaign_health (pode não existir dados ainda):", campaignHealthResult.error);
    }

    const accounts = accountsResult.data || [];
    const allReviews = reviewsResult.data || [];
    const campaignHealthData = campaignHealthResult.data || [];

    logger.debug(`✅ Batch loaded: ${accounts.length} accounts, ${allReviews.length} reviews, ${campaignHealthData.length} campaign_health`);

    // Indexar dados para acesso rápido
    const accountsByClient = new Map<string, any[]>();
    accounts.forEach(acc => {
      if (!accountsByClient.has(acc.client_id)) {
        accountsByClient.set(acc.client_id, []);
      }
      accountsByClient.get(acc.client_id)!.push(acc);
    });

    const reviewsByAccount = new Map<string, any>();
    allReviews.forEach(review => {
      const key = `${review.client_id}-${review.account_id}`;
      if (!reviewsByAccount.has(key)) {
        reviewsByAccount.set(key, review);
      }
    });

    // Indexar campaign_health por account_id
    const campaignHealthByAccount = new Map<string, any>();
    campaignHealthData.forEach(health => {
      campaignHealthByAccount.set(health.account_id, health);
    });

    // Processar clientes
    const result: GoogleAdsClientData[] = [];
    const currentDate = new Date();
    const daysInMonth = getDaysInMonth(currentDate);
    const currentDay = currentDate.getDate();
    const remainingDays = daysInMonth - currentDay + 1;

    for (const client of clients) {
      const clientAccounts = accountsByClient.get(client.id) || [];

      if (clientAccounts.length > 0) {
        for (const account of clientAccounts) {
          const reviewKey = `${client.id}-${account.id}`;
          const latestReview = reviewsByAccount.get(reviewKey);
          const campaignHealth = campaignHealthByAccount.get(account.id);

          const totalSpent = latestReview?.total_spent || 0;
          const budgetAmount = latestReview?.custom_budget_amount || account.budget_amount || 0;
          const remainingBudget = Math.max(budgetAmount - totalSpent, 0);
          const idealDailyBudget = remainingDays > 0 ? remainingBudget / remainingDays : 0;
          const weightedAverage = latestReview?.last_five_days_spent || 0;
          const currentDailyBudget = latestReview?.daily_budget_current || 0;
          
          const comparisonValue = budgetCalculationMode === "weighted" ? weightedAverage : currentDailyBudget;
          const budgetDifference = idealDailyBudget - comparisonValue;
          const needsBudgetAdjustment = Math.abs(budgetDifference) >= 5;

          // Calcular status de veiculação
          const veiculationStatus = calculateVeiculationStatus(campaignHealth);

          result.push({
            id: client.id,
            company_name: client.company_name,
            google_account_id: account.account_id,
            google_account_name: account.account_name,
            hasAccount: true,
            review: {
              total_spent: totalSpent,
              daily_budget_current: currentDailyBudget
            },
            budget_amount: budgetAmount,
            original_budget_amount: account.budget_amount || 0,
            needsAdjustment: needsBudgetAdjustment,
            weightedAverage,
            isUsingCustomBudget: latestReview?.using_custom_budget || false,
            budgetCalculation: {
              budgetDifference,
              remainingDays,
              idealDailyBudget,
              needsBudgetAdjustment,
              needsAdjustmentBasedOnAverage: needsBudgetAdjustment,
              warningIgnoredToday: latestReview?.warning_ignored_today || false
            },
            veiculationStatus
          });
        }
      } else {
        result.push({
          id: client.id,
          company_name: client.company_name,
          hasAccount: false,
          review: { total_spent: 0, daily_budget_current: 0 },
          budget_amount: 0,
          original_budget_amount: 0,
          needsAdjustment: false,
          weightedAverage: 0,
          isUsingCustomBudget: false,
          budgetCalculation: {
            budgetDifference: 0,
            remainingDays: 0,
            idealDailyBudget: 0,
            needsBudgetAdjustment: false,
            needsAdjustmentBasedOnAverage: false,
            warningIgnoredToday: false
          },
          veiculationStatus: {
            status: "no_data",
            activeCampaigns: 0,
            campaignsWithoutDelivery: 0,
            message: "Sem conta cadastrada",
            badgeColor: "bg-gray-100 text-gray-600 border-gray-200",
            campaignsDetailed: []
          }
        });
      }
    }

    logger.debug(`✅ Processamento otimizado concluído: ${result.length} total`);
    return result;

  } catch (error) {
    logger.error("❌ Erro ao buscar dados Google Ads:", error);
    throw error;
  }
};

export const useGoogleAdsData = (budgetCalculationMode: "weighted" | "current" = "weighted") => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['google-ads-clients-data', budgetCalculationMode],
    queryFn: () => fetchGoogleAdsData(budgetCalculationMode),
    staleTime: 10 * 60 * 1000, // FASE 3: 10 minutos - dados mudam pouco
    gcTime: 30 * 60 * 1000, // 30 minutos
    retry: 2,
  });

  const metrics = useMemo<GoogleAdsMetrics>(() => {
    if (!data || data.length === 0) {
      logger.debug("📊 Calculando métricas - dados vazios");
      return {
        totalClients: 0,
        clientsWithAdjustments: 0,
        clientsWithoutAccount: 0,
        averageSpend: 0,
        totalSpent: 0,
        totalBudget: 0,
        spentPercentage: 0,
        clientsWithCampaignIssues: 0
      };
    }

    const totalSpent = data.reduce((sum, client) => sum + (client.review?.total_spent || 0), 0);
    const totalBudget = data.reduce((sum, client) => sum + (client.budget_amount || 0), 0);
    const clientsWithAdjustments = data.filter(client => client.needsAdjustment).length;
    const clientsWithoutAccount = data.filter(client => !client.hasAccount).length;
    const clientsWithCampaignIssues = data.filter(client => 
      client.veiculationStatus && 
      (client.veiculationStatus.status === "none_running" || 
       client.veiculationStatus.status === "no_campaigns" ||
       client.veiculationStatus.status === "partial_running")
    ).length;

    const calculatedMetrics = {
      totalClients: data.length,
      clientsWithAdjustments,
      clientsWithoutAccount,
      averageSpend: data.length > 0 ? totalSpent / data.length : 0,
      totalSpent,
      totalBudget,
      spentPercentage: totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0,
      clientsWithCampaignIssues
    };

    logger.debug("📊 Métricas calculadas:", calculatedMetrics);
    return calculatedMetrics;
  }, [data]);

  const refreshData = async () => {
    logger.debug("🔄 Forçando atualização dos dados...");
    setIsRefreshing(true);
    try {
      await refetch();
      logger.debug("✅ Dados atualizados com sucesso");
    } catch (error) {
      logger.error("❌ Erro ao atualizar dados:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  return {
    data: data || [],
    metrics,
    isLoading,
    error,
    refreshData,
    searchQuery,
    setSearchQuery,
    isRefreshing
  };
};
