
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
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

const fetchGoogleAdsData = async (): Promise<GoogleAdsClientData[]> => {
  console.log("🔍 Iniciando busca de dados do Google Ads...");
  
  try {
    // 1. Primeiro fazer limpeza dos dados antigos
    console.log("🧹 Executando limpeza automática dos budget_reviews...");
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        'https://socrnutfpqtcjmetskta.supabase.co',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNvY3JudXRmcHF0Y2ptZXRza3RhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzgzNDg1OTMsImV4cCI6MjA1MzkyNDU5M30.yFkP90puucdc1qxlIOs3Hp4V18_LKea2mf6blmJ9Rpw'
      );
      
      const { data: cleanupResult, error: cleanupError } = await supabase.rpc('manual_cleanup_campaign_health');
      
      if (cleanupError) {
        console.warn("⚠️ Aviso na limpeza automática:", cleanupError);
      } else {
        console.log("✅ Limpeza automática concluída:", cleanupResult);
      }
    } catch (cleanupErr) {
      console.warn("⚠️ Erro na limpeza automática (continuando):", cleanupErr);
    }
    // Primeiro, buscar TODOS os clientes ativos
    const { data: clients, error: clientsError } = await supabase
      .from('clients')
      .select('id, company_name')
      .eq('status', 'active');

    if (clientsError) {
      console.error("❌ Erro ao buscar clientes:", clientsError);
      throw clientsError;
    }

    console.log(`✅ Encontrados ${clients?.length || 0} clientes ativos`);

    if (!clients || clients.length === 0) {
      console.warn("⚠️ Nenhum cliente ativo encontrado");
      return [];
    }

    const result: GoogleAdsClientData[] = [];
    const today = new Date().toISOString().split('T')[0];

    // Processar cada cliente individualmente para evitar JOINs complexos
    for (const client of clients) {
      console.log(`🔄 Processando cliente: ${client.company_name}`);

      // Buscar contas Google Ads do cliente
      const { data: googleAccounts, error: accountsError } = await supabase
        .from('client_accounts')
        .select('*')
        .eq('client_id', client.id)
        .eq('platform', 'google')
        .eq('status', 'active');

      if (accountsError) {
        console.error(`❌ Erro ao buscar contas Google do cliente ${client.company_name}:`, accountsError);
        continue;
      }

      if (googleAccounts && googleAccounts.length > 0) {
        // Cliente COM conta Google Ads
        for (const account of googleAccounts) {
          console.log(`📊 Processando conta Google: ${account.account_name}`);

          // Buscar revisões para esta conta
          const { data: reviews, error: reviewsError } = await supabase
            .from('budget_reviews')
            .select('*')
            .eq('client_id', client.id)
            .eq('account_id', account.id)
            .eq('platform', 'google')
            .order('review_date', { ascending: false })
            .limit(1);

          if (reviewsError) {
            console.error(`❌ Erro ao buscar revisões:`, reviewsError);
          }

          const latestReview = reviews && reviews.length > 0 ? reviews[0] : null;
          const totalSpent = latestReview?.total_spent || 0;
          const budgetAmount = latestReview?.custom_budget_amount || account.budget_amount || 0;
          
          // Cálculos básicos
          const currentDate = new Date();
          const daysInMonth = getDaysInMonth(currentDate);
          const currentDay = currentDate.getDate();
          const remainingDays = daysInMonth - currentDay + 1;
          const remainingBudget = Math.max(budgetAmount - totalSpent, 0);
          const idealDailyBudget = remainingDays > 0 ? remainingBudget / remainingDays : 0;
          const weightedAverage = latestReview?.last_five_days_spent || 0;
          const budgetDifference = idealDailyBudget - weightedAverage;
          const needsBudgetAdjustment = Math.abs(budgetDifference) >= 5;

          const clientData: GoogleAdsClientData = {
            id: client.id,
            company_name: client.company_name,
            google_account_id: account.account_id,
            google_account_name: account.account_name,
            hasAccount: true,
            review: {
              total_spent: totalSpent,
              daily_budget_current: latestReview?.daily_budget_current || account.budget_amount || 0
            },
            budget_amount: budgetAmount,
            original_budget_amount: account.budget_amount || 0,
            needsAdjustment: needsBudgetAdjustment,
            weightedAverage: weightedAverage,
            isUsingCustomBudget: latestReview?.using_custom_budget || false,
            budgetCalculation: {
              budgetDifference,
              remainingDays,
              idealDailyBudget,
              needsBudgetAdjustment,
              needsAdjustmentBasedOnAverage: needsBudgetAdjustment,
              warningIgnoredToday: latestReview?.warning_ignored_today || false
            }
          };

          result.push(clientData);
          console.log(`✅ Cliente adicionado: ${client.company_name} (COM conta Google)`);
        }
      } else {
        // Cliente SEM conta Google Ads
        const clientData: GoogleAdsClientData = {
          id: client.id,
          company_name: client.company_name,
          hasAccount: false,
          review: {
            total_spent: 0,
            daily_budget_current: 0
          },
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
        };

        result.push(clientData);
        console.log(`✅ Cliente adicionado: ${client.company_name} (SEM conta Google)`);
      }
    }

    console.log(`🎉 Processamento concluído. Total de clientes: ${result.length}`);
    console.log(`📊 Resumo:`, {
      total: result.length,
      comConta: result.filter(c => c.hasAccount).length,
      semConta: result.filter(c => !c.hasAccount).length,
      precisamAjuste: result.filter(c => c.needsAdjustment).length
    });

    return result;

  } catch (error) {
    console.error("❌ Erro fatal na busca de dados do Google Ads:", error);
    throw error;
  }
};

export const useGoogleAdsData = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['google-ads-clients-data'], // Query key única e específica
    queryFn: fetchGoogleAdsData,
    staleTime: 2 * 60 * 1000, // 2 minutos
    gcTime: 5 * 60 * 1000, // 5 minutos
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
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
