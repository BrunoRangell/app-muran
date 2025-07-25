
import { useState, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useClientBudgetRecommendation } from "../hooks/useClientBudgetRecommendation";

export const useClientReviewDetails = (clientId: string) => {
  const queryClient = useQueryClient();

  // Função para recarregar os dados
  const refetchData = useCallback(() => {
    console.log("Recarregando dados para cliente:", clientId);
    queryClient.invalidateQueries({ queryKey: ["client-detail", clientId] });
    queryClient.invalidateQueries({ queryKey: ["latest-review", clientId] });
    queryClient.invalidateQueries({ queryKey: ["review-history", clientId] });
    queryClient.invalidateQueries({ queryKey: ["custom-budget", clientId] });
  }, [queryClient, clientId]);

  // Buscar dados do cliente
  const { data: client, isLoading: isLoadingClient, error: clientError } = useQuery({
    queryKey: ["client-detail", clientId],
    queryFn: async () => {
      console.log("Buscando dados do cliente:", clientId);
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .eq("id", clientId)
        .single();

      if (error) {
        console.error("Erro ao buscar cliente:", error);
        throw error;
      }
      
      console.log("Dados do cliente recuperados:", data);
      return data;
    },
  });

  // Buscar orçamento personalizado ativo
  const { data: customBudget, isLoading: isLoadingCustomBudget } = useQuery({
    queryKey: ["custom-budget", clientId],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from("custom_budgets")
        .select("*")
        .eq("client_id", clientId)
        .eq("platform", "meta")
        .eq("is_active", true)
        .lte("start_date", today)
        .gte("end_date", today)
        .order("created_at", { ascending: false })
        .maybeSingle();
      
      if (error) {
        console.error("Erro ao buscar orçamento personalizado:", error);
        return null;
      }
      
      return data;
    },
    enabled: !!client,
  });

  // Buscar a revisão mais recente
  const { data: latestReview, isLoading: isLoadingReview, error: reviewError } = useQuery({
    queryKey: ["latest-review", clientId],
    queryFn: async () => {
      console.log("Buscando revisão mais recente para cliente:", clientId);
      const { data, error } = await supabase
        .from("daily_budget_reviews")
        .select("*")
        .eq("client_id", clientId)
        .order("review_date", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error("Erro ao buscar revisão mais recente:", error);
        throw error;
      }
      
      console.log("Revisão mais recente recuperada:", data);
      
      // Garantir que os valores numéricos sejam convertidos corretamente
      if (data) {
        if (data.meta_total_spent !== null && data.meta_total_spent !== undefined) {
          data.meta_total_spent = Number(data.meta_total_spent);
        }
        
        if (data.meta_daily_budget_current !== null && data.meta_daily_budget_current !== undefined) {
          data.meta_daily_budget_current = Number(data.meta_daily_budget_current);
        }
        
        console.log("Valores convertidos:", {
          meta_total_spent: data.meta_total_spent,
          meta_daily_budget_current: data.meta_daily_budget_current
        });
      }
      
      return data;
    },
    enabled: !!client,
  });

  // Histórico de revisões
  const { data: reviewHistory, isLoading: isLoadingHistory, error: historyError } = useQuery({
    queryKey: ["review-history", clientId],
    queryFn: async () => {
      console.log("Buscando histórico de revisões para cliente:", clientId);
      const { data, error } = await supabase
        .from("daily_budget_reviews")
        .select("*")
        .eq("client_id", clientId)
        .order("review_date", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) {
        console.error("Erro ao buscar histórico de revisões:", error);
        throw error;
      }
      
      console.log("Histórico de revisões recuperado:", data);
      
      // Garantir que os valores numéricos sejam convertidos corretamente
      if (data && data.length > 0) {
        return data.map(review => ({
          ...review,
          meta_total_spent: review.meta_total_spent !== null ? Number(review.meta_total_spent) : null,
          meta_daily_budget_current: review.meta_daily_budget_current !== null ? Number(review.meta_daily_budget_current) : null
        }));
      }
      
      return data;
    },
    enabled: !!client,
  });

  // Determinar se está usando orçamento personalizado
  const usingCustomBudget = customBudget !== null;
  const monthlyBudget = customBudget?.budget_amount || client?.meta_ads_budget;

  // Calcular recomendações de orçamento usando o hook separado
  const {
    recommendation,
    idealDailyBudget,
    suggestedBudgetChange,
    remainingDays,
    remainingBudget
  } = useClientBudgetRecommendation(
    client?.meta_ads_budget,
    latestReview?.meta_total_spent,
    latestReview?.meta_daily_budget_current,
    customBudget?.budget_amount,
    customBudget?.start_date,
    customBudget?.end_date,
    usingCustomBudget
  );

  const isLoading = isLoadingClient || isLoadingReview || isLoadingCustomBudget;
  const hasError = clientError || reviewError || historyError;

  return {
    client,
    latestReview,
    reviewHistory,
    customBudget,
    recommendation,
    idealDailyBudget,
    suggestedBudgetChange,
    isLoading,
    isLoadingHistory,
    hasError,
    refetchData,
    // Detalhes do cálculo
    remainingDays,
    remainingBudget,
    monthlyBudget,
    totalSpent: latestReview?.meta_total_spent,
    usingCustomBudget
  };
};
