
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
    queryClient.invalidateQueries({ queryKey: ["client-current-review", clientId] });
    queryClient.invalidateQueries({ queryKey: ["latest-review", clientId] });
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

  // Buscar a revisão atual do cliente (nova tabela)
  const { data: currentReview, isLoading: isLoadingCurrentReview, error: currentReviewError } = useQuery({
    queryKey: ["client-current-review", clientId],
    queryFn: async () => {
      console.log("Buscando revisão atual para cliente:", clientId);
      const { data, error } = await supabase
        .from("client_current_reviews")
        .select("*")
        .eq("client_id", clientId)
        .maybeSingle();

      if (error) {
        console.error("Erro ao buscar revisão atual:", error);
        
        // Se não encontrar na nova tabela, tentar a tabela antiga para compatibilidade
        const { data: legacyData, error: legacyError } = await supabase
          .from("daily_budget_reviews")
          .select("*")
          .eq("client_id", clientId)
          .order("review_date", { ascending: false })
          .limit(1)
          .maybeSingle();
          
        if (legacyError) {
          console.error("Erro ao buscar revisão legada:", legacyError);
          return null;
        }
        
        return legacyData;
      }
      
      console.log("Revisão atual recuperada:", data);
      
      // Garantir que os valores numéricos sejam convertidos corretamente
      if (data) {
        if (data.meta_total_spent !== null && data.meta_total_spent !== undefined) {
          data.meta_total_spent = Number(data.meta_total_spent);
        }
        
        if (data.meta_daily_budget_current !== null && data.meta_daily_budget_current !== undefined) {
          data.meta_daily_budget_current = Number(data.meta_daily_budget_current);
        }
      }
      
      return data;
    },
    enabled: !!client,
  });

  // Para compatibilidade, manter a busca da revisão mais recente na tabela antiga
  const { data: latestReview, isLoading: isLoadingReview, error: reviewError } = useQuery({
    queryKey: ["latest-review", clientId],
    queryFn: async () => {
      // Se já temos a revisão atual, usá-la
      if (currentReview) {
        return currentReview;
      }
      
      console.log("Buscando revisão mais recente para cliente:", clientId);
      const { data, error } = await supabase
        .from("daily_budget_reviews")
        .select("*")
        .eq("client_id", clientId)
        .order("review_date", { ascending: false })
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
      }
      
      return data;
    },
    enabled: !currentReview && !!client,
  });

  // Usar a revisão atual se disponível, ou a mais recente da tabela antiga
  const effectiveReview = currentReview || latestReview;

  // Para retrocompatibilidade, ainda criamos um array de "histórico" com a revisão atual
  const reviewHistory = effectiveReview ? [effectiveReview] : null;
  const isLoadingHistory = isLoadingCurrentReview || isLoadingReview;

  // Calcular recomendações de orçamento usando o hook separado
  const {
    recommendation,
    idealDailyBudget,
    suggestedBudgetChange,
    remainingDays,
    remainingBudget
  } = useClientBudgetRecommendation(
    client?.meta_ads_budget,
    effectiveReview?.meta_total_spent,
    effectiveReview?.meta_daily_budget_current
  );

  const isLoading = isLoadingClient || isLoadingCurrentReview || isLoadingReview;
  const hasError = clientError || currentReviewError || reviewError;

  return {
    client,
    latestReview: effectiveReview,
    reviewHistory,
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
    monthlyBudget: client?.meta_ads_budget,
    totalSpent: effectiveReview?.meta_total_spent
  };
};
