
import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useBudgetCalculator } from "../../common/hooks/useBudgetCalculator";
import { PlatformMetrics } from "../../common/types";
import { useBatchOperations } from "../../common/hooks/useBatchOperations";

// Chave para armazenamento local dos dados e métricas do Google Ads
const GOOGLE_ADS_DATA_KEY = "google_ads_data_cache";
const GOOGLE_ADS_METRICS_KEY = "google_ads_metrics_cache";

export function useGoogle() {
  const [metrics, setMetrics] = useState<PlatformMetrics>({
    totalClients: 0,
    clientsNeedingAdjustment: 0,
    totalBudget: 0,
    totalSpent: 0,
    spentPercentage: 0
  });
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const { calculateBudget } = useBudgetCalculator();
  const { reviewAllClients: reviewAllClientsFromBatch, isProcessing: isProcessingBatch } = useBatchOperations({
    platform: "google"
  });

  // Carregar dados do localStorage quando o componente montar
  useEffect(() => {
    try {
      const savedMetrics = localStorage.getItem(GOOGLE_ADS_METRICS_KEY);
      if (savedMetrics) {
        setMetrics(JSON.parse(savedMetrics));
      }
    } catch (err) {
      console.error("Erro ao carregar métricas do cache:", err);
    }

    // Marcar que a carga inicial foi concluída
    setIsInitialLoad(false);
  }, []);

  // Fetch data for Google Ads
  const { 
    data, 
    isLoading, 
    error, 
    refetch,
    isFetching 
  } = useQuery({
    queryKey: ["google-ads-data"],
    queryFn: async () => {
      console.log("Buscando dados de clientes e revisões Google Ads...");
      
      // Buscar clientes ativos
      const { data: clients, error: clientsError } = await supabase
        .from("clients")
        .select(`
          id,
          company_name,
          google_ads_budget,
          google_account_id,
          status
        `)
        .eq("status", "active");

      if (clientsError) throw clientsError;
      
      // Buscar contas Google dos clientes
      const { data: googleAccounts, error: accountsError } = await supabase
        .from("client_google_accounts")
        .select("*")
        .eq("status", "active");

      if (accountsError) throw accountsError;

      // Buscar revisões mais recentes do mês atual
      const currentDate = new Date();
      const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const firstDayStr = firstDayOfMonth.toISOString().split("T")[0];
      
      const { data: reviews, error: reviewsError } = await supabase
        .from("google_ads_reviews")
        .select("*")
        .gte("review_date", firstDayStr)
        .order("review_date", { ascending: false })
        .order("updated_at", { ascending: false });

      if (reviewsError) throw reviewsError;
      
      // Combinar os dados
      const clientsWithData = clients
        .filter(client => client.google_account_id || (googleAccounts && googleAccounts.some(acc => acc.client_id === client.id)))
        .map(client => {
          // Encontrar contas do cliente
          const accounts = googleAccounts ? googleAccounts.filter(account => account.client_id === client.id) : [];
          
          // Se o cliente tiver contas específicas, criar um item para cada conta
          if (accounts.length > 0) {
            return accounts.map(account => {
              // Encontrar revisão para esta conta específica
              const accountReviews = reviews ? reviews.filter(r => 
                r.client_id === client.id && 
                (
                  (r.google_account_id === account.account_id) ||
                  (r.client_account_id === account.id)
                )
              ) : [];
              
              // Usar a revisão mais recente para esta conta
              const review = accountReviews.length > 0 ? accountReviews[0] : null;
              
              // Verificar se os dados são reais ou simulados
              const usingRealData = review?.usingRealData !== false;
              
              // Obter a média de gasto dos últimos 5 dias
              const lastFiveDaysAvg = review?.google_last_five_days_spent || 0;
              
              // Calcular orçamento recomendado
              const budgetCalc = calculateBudget({
                monthlyBudget: account.budget_amount || 0,
                totalSpent: review?.google_total_spent || 0,
                currentDailyBudget: review?.google_daily_budget_current || 0,
                lastFiveDaysAverage: lastFiveDaysAvg
              });
              
              // Verificar se precisa de ajuste
              const needsAnyAdjustment = budgetCalc.needsBudgetAdjustment || budgetCalc.needsAdjustmentBasedOnAverage;
              
              return {
                ...client,
                google_account_id: account.account_id,
                google_account_name: account.account_name || "Conta Google",
                budget_amount: account.budget_amount,
                review: review || null,
                budgetCalculation: budgetCalc,
                needsAdjustment: needsAnyAdjustment,
                lastFiveDaysAvg: lastFiveDaysAvg,
                usingRealData
              };
            });
          } else if (client.google_account_id) {
            // Cliente com ID de conta padrão
            const clientReviews = reviews ? reviews.filter(r => 
              r.client_id === client.id && 
              r.google_account_id === client.google_account_id
            ) : [];
            
            const review = clientReviews.length > 0 ? clientReviews[0] : null;
            
            // Verificar se os dados são reais ou simulados
            const usingRealData = review?.usingRealData !== false;
            
            // Obter a média de gasto dos últimos 5 dias
            const lastFiveDaysAvg = review?.google_last_five_days_spent || 0;
            
            // Calcular orçamento recomendado
            const budgetCalc = calculateBudget({
              monthlyBudget: client.google_ads_budget || 0,
              totalSpent: review?.google_total_spent || 0,
              currentDailyBudget: review?.google_daily_budget_current || 0,
              lastFiveDaysAverage: lastFiveDaysAvg
            });
            
            // Verificar se precisa de ajuste
            const needsAnyAdjustment = budgetCalc.needsBudgetAdjustment || budgetCalc.needsAdjustmentBasedOnAverage;
            
            return {
              ...client,
              google_account_name: "Conta Principal",
              budget_amount: client.google_ads_budget || 0,
              review: review || null,
              budgetCalculation: budgetCalc,
              needsAdjustment: needsAnyAdjustment,
              lastFiveDaysAvg: lastFiveDaysAvg,
              usingRealData
            };
          }
          
          return null;
        })
        .filter(Boolean);

      // Achatar o array (já que alguns clientes podem ter várias contas)
      const flattenedClients = clientsWithData.flat().filter(Boolean);
      
      // Calcular métricas
      const totalBudget = flattenedClients.reduce((sum, client) => sum + (client.budget_amount || 0), 0);
      const totalSpent = flattenedClients.reduce((sum, client) => sum + (client.review?.google_total_spent || 0), 0);
      const needingAdjustment = flattenedClients.filter(client => client.needsAdjustment).length;
      
      const metricsData = {
        totalClients: flattenedClients.length,
        clientsNeedingAdjustment: needingAdjustment,
        totalBudget: totalBudget,
        totalSpent: totalSpent,
        spentPercentage: totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0
      };
      
      setMetrics(metricsData);
      
      // Salvar métricas e dados no localStorage para persistência
      try {
        localStorage.setItem(GOOGLE_ADS_METRICS_KEY, JSON.stringify(metricsData));
        localStorage.setItem(GOOGLE_ADS_DATA_KEY, JSON.stringify(flattenedClients));
      } catch (err) {
        console.error("Erro ao salvar dados no cache:", err);
      }

      return flattenedClients;
    },
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    staleTime: 10 * 60 * 1000, // 10 minutos
    gcTime: 60 * 60 * 1000, // 1 hora
    initialData: () => {
      try {
        const savedData = localStorage.getItem(GOOGLE_ADS_DATA_KEY);
        if (savedData) {
          return JSON.parse(savedData);
        }
      } catch (err) {
        console.error("Erro ao recuperar dados do cache:", err);
      }
      return undefined;
    },
  });

  // Função para forçar atualização de dados
  const refreshData = useCallback(async () => {
    console.log("Forçando atualização dos dados Google Ads...");
    return refetch({ cancelRefetch: true });
  }, [refetch]);

  // Wrapper para a função de revisão em lote
  const reviewAllClients = useCallback((clients: any[]) => {
    return reviewAllClientsFromBatch(clients);
  }, [reviewAllClientsFromBatch]);

  // Estado de carregamento combinado
  const isLoadingCombined = isInitialLoad || isLoading || (isFetching && !data);

  return {
    data,
    isLoading: isLoadingCombined,
    isFetching,
    error,
    metrics,
    refreshData,
    reviewAllClients,
    isProcessingBatch
  };
}
