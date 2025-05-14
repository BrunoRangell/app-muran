
import { useQuery } from "@tanstack/react-query";
import { useReviews } from "../context/ReviewContext";
import { useMetricsCalculation } from "./useMetricsCalculation";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";
import { ClientWithReview } from "@/components/daily-reviews/hooks/types/reviewTypes";

// Função para buscar clientes com suas revisões
const fetchClientsWithReviews = async (): Promise<{
  metaClients: ClientWithReview[];
  googleClients: ClientWithReview[];
}> => {
  try {
    // Buscar clientes ativos
    const { data: clients, error: clientsError } = await supabase
      .from("clients")
      .select("*")
      .eq("status", "active");

    if (clientsError) throw clientsError;

    // Buscar últimas revisões para cada cliente (Meta)
    const { data: metaReviews, error: metaReviewsError } = await supabase
      .from("client_current_reviews")
      .select("*")
      .not("meta_account_id", "is", null);

    if (metaReviewsError) throw metaReviewsError;

    // Buscar últimas revisões para cada cliente (Google)
    const { data: googleReviews, error: googleReviewsError } = await supabase
      .from("client_current_reviews")
      .select("*")
      .not("google_account_id", "is", null);

    if (googleReviewsError) throw googleReviewsError;

    // Mapear clientes com conta Meta Ads e adicionar sua última revisão
    const metaClients = clients
      .filter((client: any) => client.meta_account_id)
      .map((client: any) => {
        const lastReview = metaReviews.find(
          (review) => review.client_id === client.id
        );
        
        // Verificar se necessita ajuste de orçamento
        const needsAdjustment = lastReview && Math.abs(
          (lastReview.meta_daily_budget_current || 0) - (lastReview.meta_total_spent / 30 || 0)
        ) > 5;
        
        return {
          ...client,
          lastReview: lastReview || null,
          needsBudgetAdjustment: needsAdjustment || false
        };
      });

    // Mapear clientes com conta Google Ads e adicionar sua última revisão
    const googleClients = clients
      .filter((client: any) => client.google_account_id)
      .map((client: any) => {
        const lastReview = googleReviews.find(
          (review) => review.client_id === client.id
        );
        
        // Verificar se necessita ajuste de orçamento
        const needsAdjustment = lastReview && Math.abs(
          (lastReview.google_daily_budget_current || 0) - (lastReview.google_total_spent / 30 || 0)
        ) > 5;
        
        return {
          ...client,
          lastReview: lastReview || null,
          needsBudgetAdjustment: needsAdjustment || false
        };
      });

    return { metaClients, googleClients };
  } catch (error) {
    console.error("Erro ao buscar clientes e revisões:", error);
    throw error;
  }
};

export const useClientDataV2 = () => {
  const { state, dispatch } = useReviews();
  
  // Usar React Query para buscar e gerenciar dados
  const { 
    data, 
    isLoading, 
    error, 
    refetch 
  } = useQuery({
    queryKey: ["clientsWithReviewsV2"],
    queryFn: fetchClientsWithReviews,
  });

  // Calcular métricas para Meta Ads
  const metaMetrics = useMetricsCalculation({
    clients: state.clients.meta,
    platform: "meta"
  });

  // Calcular métricas para Google Ads
  const googleMetrics = useMetricsCalculation({
    clients: state.clients.google,
    platform: "google"
  });

  // Combinar métricas
  const combinedMetrics = {
    clientsCount: metaMetrics.clientsCount + googleMetrics.clientsCount,
    clientsWithReviewCount: metaMetrics.clientsWithReviewCount + googleMetrics.clientsWithReviewCount,
    clientsNeedingAdjustment: metaMetrics.clientsNeedingAdjustment + googleMetrics.clientsNeedingAdjustment,
    customBudgetsCount: metaMetrics.customBudgetsCount + googleMetrics.customBudgetsCount,
    totalMonthlyBudget: metaMetrics.totalMonthlyBudget + googleMetrics.totalMonthlyBudget,
    totalSpent: metaMetrics.totalSpent + googleMetrics.totalSpent,
    averageSpendPercentage: (metaMetrics.averageSpendPercentage + googleMetrics.averageSpendPercentage) / 2,
  };

  // Atualizar o estado quando os dados são carregados
  useEffect(() => {
    if (data) {
      dispatch({ type: "SET_CLIENTS", payload: { platform: "meta", clients: data.metaClients } });
      dispatch({ type: "SET_CLIENTS", payload: { platform: "google", clients: data.googleClients } });
      dispatch({ type: "SET_LAST_REFRESH", payload: new Date() });
    }
  }, [data, dispatch]);

  // Atualizar métricas quando os clientes ou filtros mudam
  useEffect(() => {
    dispatch({ type: "SET_METRICS", payload: { platform: "meta", data: metaMetrics } });
    dispatch({ type: "SET_METRICS", payload: { platform: "google", data: googleMetrics } });
    dispatch({ type: "SET_METRICS", payload: { platform: "combined", data: combinedMetrics } });
  }, [state.clients, state.filters, dispatch]);

  // Função para atualizar os dados manualmente
  const refreshData = async () => {
    dispatch({ type: "SET_BATCH_PROCESSING", payload: true });
    await refetch();
    dispatch({ type: "SET_BATCH_PROCESSING", payload: false });
    dispatch({ type: "SET_LAST_REFRESH", payload: new Date() });
  };

  return {
    isLoading,
    error,
    refreshData,
    metaClients: state.clients.meta,
    googleClients: state.clients.google,
    metrics: state.metrics,
    filters: state.filters,
    lastRefresh: state.lastRefresh,
  };
};
