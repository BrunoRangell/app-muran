
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getDaysInMonth } from "date-fns";

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
}

export interface GoogleAdsMetrics {
  totalClients: number;
  clientsWithAdjustments: number;
  clientsWithoutAccount: number;
  averageSpend: number;
  totalSpent: number;
  totalBudget: number;
  spentPercentage: number;
}

const fetchGoogleAdsData = async (budgetCalculationMode: "weighted" | "current" = "weighted"): Promise<GoogleAdsClientData[]> => {
  console.log("🔍 [GOOGLE-ADS] Iniciando busca otimizada com batch queries...");
  
  try {
    // FASE 1: Buscar clientes ativos
    const { data: clients, error: clientsError } = await supabase
      .from('clients')
      .select('id, company_name')
      .eq('status', 'active');

    if (clientsError) throw clientsError;
    if (!clients || clients.length === 0) return [];

    const clientIds = clients.map(c => c.id);
    console.log(`✅ [GOOGLE-ADS] ${clients.length} clientes encontrados`);

    // FASE 1.2: BATCH QUERIES - buscar tudo em paralelo
    const [accountsResult, reviewsResult] = await Promise.all([
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
        .order('review_date', { ascending: false })
    ]);

    if (accountsResult.error) throw accountsResult.error;
    if (reviewsResult.error) throw reviewsResult.error;

    const accounts = accountsResult.data || [];
    const allReviews = reviewsResult.data || [];

    console.log(`✅ [GOOGLE-ADS] Batch loaded: ${accounts.length} accounts, ${allReviews.length} reviews`);

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

          const totalSpent = latestReview?.total_spent || 0;
          const budgetAmount = latestReview?.custom_budget_amount || account.budget_amount || 0;
          const remainingBudget = Math.max(budgetAmount - totalSpent, 0);
          const idealDailyBudget = remainingDays > 0 ? remainingBudget / remainingDays : 0;
          const weightedAverage = latestReview?.last_five_days_spent || 0;
          const currentDailyBudget = latestReview?.daily_budget_current || 0;
          
          const comparisonValue = budgetCalculationMode === "weighted" ? weightedAverage : currentDailyBudget;
          const budgetDifference = idealDailyBudget - comparisonValue;
          const needsBudgetAdjustment = Math.abs(budgetDifference) >= 5;

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
            }
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
          }
        });
      }
    }

    console.log(`✅ [GOOGLE-ADS] Processamento otimizado concluído: ${result.length} total`);
    return result;

  } catch (error) {
    console.error("❌ [GOOGLE-ADS] Erro:", error);
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
      console.log("📊 Calculando métricas - dados vazios");
      return {
        totalClients: 0,
        clientsWithAdjustments: 0,
        clientsWithoutAccount: 0,
        averageSpend: 0,
        totalSpent: 0,
        totalBudget: 0,
        spentPercentage: 0
      };
    }

    const totalSpent = data.reduce((sum, client) => sum + (client.review?.total_spent || 0), 0);
    const totalBudget = data.reduce((sum, client) => sum + (client.budget_amount || 0), 0);
    const clientsWithAdjustments = data.filter(client => client.needsAdjustment).length;
    const clientsWithoutAccount = data.filter(client => !client.hasAccount).length;

    const calculatedMetrics = {
      totalClients: data.length,
      clientsWithAdjustments,
      clientsWithoutAccount,
      averageSpend: data.length > 0 ? totalSpent / data.length : 0,
      totalSpent,
      totalBudget,
      spentPercentage: totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0
    };

    console.log("📊 Métricas calculadas:", calculatedMetrics);
    return calculatedMetrics;
  }, [data]);

  const refreshData = async () => {
    console.log("🔄 Forçando atualização dos dados...");
    setIsRefreshing(true);
    try {
      await refetch();
      console.log("✅ Dados atualizados com sucesso");
    } catch (error) {
      console.error("❌ Erro ao atualizar dados:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Log para debug do estado atual
  console.log("🔍 Estado atual do hook:", {
    dataLength: data?.length || 0,
    isLoading,
    error: error?.message,
    hasData: !!data
  });

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
