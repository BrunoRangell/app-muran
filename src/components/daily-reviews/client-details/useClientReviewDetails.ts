
import { useState, useEffect, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { getDaysInMonth } from 'date-fns';

export const useClientReviewDetails = (clientId: string) => {
  const [recommendation, setRecommendation] = useState<string | null>(null);
  const [idealDailyBudget, setIdealDailyBudget] = useState<number | null>(null);
  const queryClient = useQueryClient();

  // Função para recarregar os dados
  const refetchData = useCallback(() => {
    console.log("Recarregando dados para cliente:", clientId);
    queryClient.invalidateQueries({ queryKey: ["client-detail", clientId] });
    queryClient.invalidateQueries({ queryKey: ["latest-review", clientId] });
    queryClient.invalidateQueries({ queryKey: ["review-history", clientId] });
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
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error("Erro ao buscar revisão mais recente:", error);
        throw error;
      }
      
      console.log("Revisão mais recente recuperada:", data);
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
        .limit(10);

      if (error) {
        console.error("Erro ao buscar histórico de revisões:", error);
        throw error;
      }
      
      console.log("Histórico de revisões recuperado:", data);
      return data;
    },
    enabled: !!client,
  });

  // Calcular orçamento diário ideal quando o cliente for carregado
  useEffect(() => {
    if (client?.meta_ads_budget) {
      // Certifique-se de que meta_ads_budget seja tratado como número
      const monthlyBudget = Number(client.meta_ads_budget);
      console.log("Orçamento mensal do cliente:", monthlyBudget);
      
      const currentDate = new Date();
      const daysInMonth = getDaysInMonth(currentDate);
      console.log("Dias no mês atual:", daysInMonth);
      
      // Calcular orçamento diário ideal
      const idealDaily = monthlyBudget / daysInMonth;
      console.log("Orçamento diário ideal calculado:", idealDaily);
      setIdealDailyBudget(idealDaily);

      if (latestReview?.meta_daily_budget_current) {
        // Certifique-se de que meta_daily_budget_current seja tratado como número
        const currentDailyBudget = Number(latestReview.meta_daily_budget_current);
        console.log("Orçamento diário atual:", currentDailyBudget);
        
        // Calcular diferença percentual
        const percentDifference = ((currentDailyBudget - idealDaily) / idealDaily) * 100;
        console.log("Diferença percentual:", percentDifference);
        
        // Gerar recomendação baseada na diferença
        if (percentDifference < -10) {
          setRecommendation(`Aumentar o orçamento diário em ${Math.abs(Math.round(percentDifference))}%`);
        } else if (percentDifference > 10) {
          setRecommendation(`Diminuir o orçamento diário em ${Math.round(percentDifference)}%`);
        } else {
          setRecommendation("Manter o orçamento diário atual");
        }
      }
    }
  }, [client, latestReview]);

  const isLoading = isLoadingClient || isLoadingReview;
  const hasError = clientError || reviewError || historyError;

  return {
    client,
    latestReview,
    reviewHistory,
    recommendation,
    idealDailyBudget,
    isLoading,
    isLoadingHistory,
    hasError,
    refetchData
  };
};
