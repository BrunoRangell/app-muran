
import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useBudgetCalculator } from "../../common/hooks/useBudgetCalculator";
import { PlatformMetrics } from "../../common/types";
import { useBatchOperations } from "../../common/hooks/useBatchOperations";

// Chave para armazenamento local dos dados e métricas do Meta Ads
const META_ADS_DATA_KEY = "meta_ads_data_cache";
const META_ADS_METRICS_KEY = "meta_ads_metrics_cache";

export function useMeta() {
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
    platform: "meta"
  });

  // Carregar dados do localStorage quando o componente montar
  useEffect(() => {
    try {
      const savedMetrics = localStorage.getItem(META_ADS_METRICS_KEY);
      if (savedMetrics) {
        setMetrics(JSON.parse(savedMetrics));
      }
    } catch (err) {
      console.error("Erro ao carregar métricas do cache:", err);
    }

    // Marcar que a carga inicial foi concluída
    setIsInitialLoad(false);
  }, []);

  // Fetch data for Meta Ads
  const { 
    data, 
    isLoading, 
    error, 
    refetch,
    isFetching 
  } = useQuery({
    queryKey: ["meta-ads-data"],
    queryFn: async () => {
      console.log("Buscando dados de clientes e revisões Meta Ads...");
      
      // Buscar clientes ativos
      const { data: clients, error: clientsError } = await supabase
        .from("clients")
        .select(`
          id,
          company_name,
          meta_ads_budget,
          status
        `)
        .eq("status", "active");

      if (clientsError) throw clientsError;
      
      // Buscar contas Meta dos clientes
      const { data: metaAccounts, error: accountsError } = await supabase
        .from("client_meta_accounts")
        .select("*")
        .eq("status", "active");

      if (accountsError) throw accountsError;

      // Buscar revisões mais recentes do mês atual
      const currentDate = new Date();
      const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const firstDayStr = firstDayOfMonth.toISOString().split("T")[0];
      
      const { data: reviews, error: reviewsError } = await supabase
        .from("daily_budget_reviews")
        .select("*")
        .gte("review_date", firstDayStr)
        .order("review_date", { ascending: false })
        .order("updated_at", { ascending: false });

      if (reviewsError) throw reviewsError;
      
      // Combinar os dados
      const clientsWithData = clients
        .filter(client => client.meta_ads_budget > 0 || 
                         (metaAccounts && metaAccounts.some(acc => acc.client_id === client.id)))
        .map(client => {
          // Encontrar contas do cliente
          const accounts = metaAccounts ? metaAccounts.filter(account => account.client_id === client.id) : [];
          
          // Se o cliente tiver contas específicas, criar um item para cada conta
          if (accounts.length > 0) {
            return accounts.map(account => {
              // Encontrar revisão para esta conta específica
              const accountReviews = reviews ? reviews.filter(r => 
                r.client_id === client.id && 
                (r.meta_account_id === account.account_id || r.client_account_id === account.id)
              ) : [];
              
              // Usar a revisão mais recente para esta conta
              const review = accountReviews.length > 0 ? accountReviews[0] : null;
              
              // Calcular orçamento recomendado
              const budgetCalc = calculateBudget({
                monthlyBudget: account.budget_amount || 0,
                totalSpent: review?.meta_total_spent || 0,
                currentDailyBudget: review?.meta_daily_budget_current || 0
              });
              
              return {
                ...client,
                meta_account_id: account.account_id,
                meta_account_name: account.account_name || "Conta Meta Ads",
                budget_amount: account.budget_amount,
                review: review || null,
                budgetCalculation: budgetCalc,
                needsAdjustment: budgetCalc.needsBudgetAdjustment
              };
            });
          } else {
            // Cliente sem contas específicas
            const clientReviews = reviews ? reviews.filter(r => 
              r.client_id === client.id && !r.meta_account_id
            ) : [];
            
            const review = clientReviews.length > 0 ? clientReviews[0] : null;
            
            const budgetCalc = calculateBudget({
              monthlyBudget: client.meta_ads_budget || 0,
              totalSpent: review?.meta_total_spent || 0,
              currentDailyBudget: review?.meta_daily_budget_current || 0
            });
            
            return {
              ...client,
              meta_account_id: null,
              meta_account_name: "Conta Principal",
              budget_amount: client.meta_ads_budget || 0,
              review: review || null,
              budgetCalculation: budgetCalc,
              needsAdjustment: budgetCalc.needsBudgetAdjustment
            };
          }
        });

      // Achatar o array (já que alguns clientes podem ter várias contas)
      const flattenedClients = clientsWithData.flat().filter(Boolean);
      
      // Calcular métricas
      const totalBudget = flattenedClients.reduce((sum, client) => sum + (client.budget_amount || 0), 0);
      const totalSpent = flattenedClients.reduce((sum, client) => sum + (client.review?.meta_total_spent || 0), 0);
      const needingAdjustment = flattenedClients.filter(client => client.needsAdjustment).length;
      
      const metricsData = {
        totalClients: flattenedClients.length,
        clientsNeedingAdjustment: needingAdjustment,
        totalBudget,
        totalSpent,
        spentPercentage: totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0
      };
      
      setMetrics(metricsData);
      
      // Salvar métricas e dados no localStorage
      try {
        localStorage.setItem(META_ADS_METRICS_KEY, JSON.stringify(metricsData));
        localStorage.setItem(META_ADS_DATA_KEY, JSON.stringify(flattenedClients));
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
        const savedData = localStorage.getItem(META_ADS_DATA_KEY);
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
    console.log("Forçando atualização dos dados Meta Ads...");
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
