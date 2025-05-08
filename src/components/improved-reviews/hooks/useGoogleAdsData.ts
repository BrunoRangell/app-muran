
import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useBudgetCalculator } from "./useBudgetCalculator";
import { ClientMetrics } from "./useUnifiedReviewsData";

export interface GoogleAdsClientData {
  id: string;
  company_name: string;
  google_account_id: string;
  google_account_name: string;
  budget_amount: number;
  review: any;
  budgetCalculation: any;
  needsAdjustment: boolean;
  lastFiveDaysAvg: number;
  usingRealData?: boolean;
  custom_budget?: any | null;
  custom_budget_amount?: number;
  using_custom_budget?: boolean;
}

// Chave para armazenamento local dos dados e métricas do Google Ads
const GOOGLE_ADS_DATA_KEY = "google_ads_data_cache";
const GOOGLE_ADS_METRICS_KEY = "google_ads_metrics_cache";
// Tempo mínimo entre atualizações forçadas (5 segundos)
const MIN_REFRESH_INTERVAL = 5000;

export function useGoogleAdsData() {
  const [metrics, setMetrics] = useState<ClientMetrics>({
    totalClients: 0,
    clientsNeedingAdjustment: 0,
    totalBudget: 0,
    totalSpent: 0,
    spentPercentage: 0
  });
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [lastCustomBudgetUpdate, setLastCustomBudgetUpdate] = useState<Date | null>(null);
  const lastRefreshTimestamp = useRef<number>(Date.now());

  const { calculateBudget } = useBudgetCalculator();

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

    // Marcar que a carga inicial foi concluída após este useEffect
    setIsInitialLoad(false);
  }, []);

  // Fetch clients with their Google accounts and reviews
  const { 
    data, 
    isLoading, 
    error, 
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["improved-google-reviews", lastCustomBudgetUpdate], // Incluir o timestamp como dependência
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
      
      console.log(`Encontrados ${clients?.length || 0} clientes ativos`);

      // Buscar contas Google dos clientes
      const { data: googleAccounts, error: accountsError } = await supabase
        .from("client_google_accounts")
        .select("*")
        .eq("status", "active");

      if (accountsError) throw accountsError;
      
      console.log(`Encontradas ${googleAccounts?.length || 0} contas Google Ads`);

      // Buscar revisões mais recentes do Google Ads (apenas do mês atual)
      const currentDate = new Date();
      const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const firstDayStr = firstDayOfMonth.toISOString().split("T")[0];
      
      console.log(`Buscando revisões a partir de ${firstDayStr}`);
      
      const { data: reviews, error: reviewsError } = await supabase
        .from("google_ads_reviews")
        .select("*")
        .gte("review_date", firstDayStr)
        .order("review_date", { ascending: false })
        .order("updated_at", { ascending: false });

      if (reviewsError) throw reviewsError;
      
      console.log(`Encontradas ${reviews?.length || 0} revisões do mês atual`);

      // Buscar orçamentos personalizados ativos
      const { data: customBudgets, error: customBudgetsError } = await supabase
        .from("custom_budgets")
        .select("*")
        .eq("platform", "google")
        .eq("is_active", true)
        .lte("start_date", currentDate.toISOString().split('T')[0])
        .gte("end_date", currentDate.toISOString().split('T')[0]);

      if (customBudgetsError) console.error("Erro ao buscar orçamentos personalizados:", customBudgetsError);
      const activeCustomBudgets = customBudgets || [];
      
      console.log(`Encontrados ${activeCustomBudgets?.length || 0} orçamentos personalizados ativos para Google Ads`);

      // Combinar os dados
      const clientsWithData = clients
        .filter(client => client.google_account_id || (googleAccounts && googleAccounts.some(acc => acc.client_id === client.id)))
        .map(client => {
          // Encontrar contas do cliente
          const accounts = googleAccounts ? googleAccounts.filter(account => account.client_id === client.id) : [];
          
          // Se o cliente tiver contas específicas, criar um item para cada conta
          if (accounts.length > 0) {
            return accounts.map(account => {
              // Encontrar revisões para esta conta específica (cliente + conta)
              const accountReviews = reviews ? reviews.filter(r => 
                r.client_id === client.id && 
                (
                  (r.google_account_id === account.account_id) ||
                  (r.client_account_id === account.id)
                )
              ) : [];
              
              // Usar a revisão mais recente para esta conta
              const review = accountReviews.length > 0 ? accountReviews[0] : null;
              
              // Encontrar orçamento personalizado para esta conta
              const customBudget = activeCustomBudgets.find(
                budget => budget.client_id === client.id && 
                (budget.account_id === account.account_id || !budget.account_id)
              );
              
              // Verificar se os dados são reais ou simulados
              const usingRealData = review?.usingRealData !== false; // Se não especificado, assumir verdadeiro
              
              // Obter a média de gasto dos últimos 5 dias (se disponível)
              const lastFiveDaysAvg = review?.google_last_five_days_spent || 0;
              
              // Usar orçamento personalizado se disponível
              const monthlyBudget = customBudget ? customBudget.budget_amount : (account.budget_amount || 0);
              
              // Calcular orçamento recomendado
              const budgetCalc = calculateBudget({
                monthlyBudget: monthlyBudget,
                totalSpent: review?.google_total_spent || 0,
                currentDailyBudget: review?.google_daily_budget_current || 0,
                lastFiveDaysAverage: lastFiveDaysAvg // Passar a média dos últimos 5 dias
              });
              
              // Verificar se precisa de ajuste (baseado em orçamento diário OU na média dos últimos 5 dias)
              const needsAnyAdjustment = budgetCalc.needsBudgetAdjustment || budgetCalc.needsAdjustmentBasedOnAverage;
              
              return {
                ...client,
                google_account_id: account.account_id,
                google_account_name: account.account_name || "Conta Google",
                budget_amount: account.budget_amount,
                custom_budget: customBudget || null,
                custom_budget_amount: customBudget?.budget_amount,
                using_custom_budget: !!customBudget,
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
            
            // Encontrar orçamento personalizado para o cliente (sem conta específica)
            const customBudget = activeCustomBudgets.find(
              budget => budget.client_id === client.id && !budget.account_id
            );
            
            // Verificar se os dados são reais ou simulados
            const usingRealData = review?.usingRealData !== false; // Se não especificado, assumir verdadeiro
            
            // Obter a média de gasto dos últimos 5 dias (se disponível)
            const lastFiveDaysAvg = review?.google_last_five_days_spent || 0;
            
            // Usar orçamento personalizado se disponível
            const monthlyBudget = customBudget ? customBudget.budget_amount : (client.google_ads_budget || 0);
            
            // Calcular orçamento recomendado
            const budgetCalc = calculateBudget({
              monthlyBudget: monthlyBudget,
              totalSpent: review?.google_total_spent || 0,
              currentDailyBudget: review?.google_daily_budget_current || 0,
              lastFiveDaysAverage: lastFiveDaysAvg // Passar a média dos últimos 5 dias
            });
            
            // Verificar se precisa de ajuste (baseado em orçamento diário OU na média dos últimos 5 dias)
            const needsAnyAdjustment = budgetCalc.needsBudgetAdjustment || budgetCalc.needsAdjustmentBasedOnAverage;
            
            return {
              ...client,
              google_account_name: "Conta Principal",
              budget_amount: client.google_ads_budget || 0,
              custom_budget: customBudget || null,
              custom_budget_amount: customBudget?.budget_amount,
              using_custom_budget: !!customBudget,
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
      const totalBudget = flattenedClients.reduce((sum, client) => {
        // Usar orçamento personalizado se disponível, senão usar orçamento padrão
        const budgetToUse = client.using_custom_budget ? 
          client.custom_budget_amount : client.budget_amount;
        return sum + (budgetToUse || 0);
      }, 0);
      
      const totalSpent = flattenedClients.reduce((sum, client) => sum + (client.review?.google_total_spent || 0), 0);
      const needingAdjustment = flattenedClients.filter(client => client.needsAdjustment).length;
      
      const metricsData = {
        totalClients: flattenedClients.length,
        clientsNeedingAdjustment: needingAdjustment,
        totalBudget: totalBudget,
        totalSpent: totalSpent,
        spentPercentage: totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0
      };
      
      // Log menor para evitar poluição do console
      console.log("Métricas calculadas: Total clientes:", metricsData.totalClients, "Precisam de ajuste:", metricsData.clientsNeedingAdjustment);
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
    refetchOnMount: true,
    staleTime: 30000, // Considerar os dados obsoletos após 30 segundos (evitar atualizações frequentes)
    gcTime: 60 * 60 * 1000, // 1 hora (equivalente ao antigo cacheTime)
    initialData: () => {
      // Tentar recuperar dados do localStorage ao inicializar
      try {
        const savedData = localStorage.getItem(GOOGLE_ADS_DATA_KEY);
        if (savedData) {
          const parsedData = JSON.parse(savedData);
          console.log("Carregando dados do Google Ads do cache local", parsedData.length);
          return parsedData;
        }
      } catch (err) {
        console.error("Erro ao recuperar dados do cache:", err);
      }
      return undefined;
    },
  });

  // Função para forçar uma atualização completa dos dados
  const refreshData = async () => {
    const now = Date.now();
    // Verificar se já passou tempo suficiente desde a última atualização
    if (now - lastRefreshTimestamp.current < MIN_REFRESH_INTERVAL) {
      console.log(`Ignorando atualização - última foi há ${now - lastRefreshTimestamp.current}ms (mínimo: ${MIN_REFRESH_INTERVAL}ms)`);
      return { data };
    }
    
    console.log("Forçando atualização dos dados do Google Ads...");
    lastRefreshTimestamp.current = now;
    try {
      const result = await refetch({ cancelRefetch: true });
      return result;
    } catch (error) {
      console.error("Erro durante atualização dos dados:", error);
      return { error };
    }
  };

  // Calculando um estado de carregamento combinado que considera tanto o carregamento inicial
  // quanto o refetching para garantir que a UI não seja renderizada prematuramente
  const isLoadingCombined = isInitialLoad || isLoading || (isFetching && !data);

  return {
    data,
    isLoading: isLoadingCombined,
    isFetching,
    error,
    metrics,
    refreshData,
    setLastCustomBudgetUpdate
  };
}
