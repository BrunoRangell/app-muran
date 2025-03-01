
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { getDaysInMonth } from 'date-fns';

export const useClientReviewDetails = (clientId: string) => {
  const [recommendation, setRecommendation] = useState<string | null>(null);
  const [idealDailyBudget, setIdealDailyBudget] = useState<number | null>(null);

  // Buscar dados do cliente
  const { data: client, isLoading: isLoadingClient, error: clientError } = useQuery({
    queryKey: ["client-detail", clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .eq("id", clientId)
        .single();

      if (error) {
        console.error("Erro ao buscar cliente:", error);
        throw error;
      }
      return data;
    },
  });

  // Buscar a revisão mais recente
  const { data: latestReview, isLoading: isLoadingReview, error: reviewError } = useQuery({
    queryKey: ["latest-review", clientId],
    queryFn: async () => {
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
      return data;
    },
    enabled: !!client,
  });

  // Histórico de revisões
  const { data: reviewHistory, isLoading: isLoadingHistory, error: historyError } = useQuery({
    queryKey: ["review-history", clientId],
    queryFn: async () => {
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
      return data;
    },
    enabled: !!client,
  });

  // Calcular orçamento diário ideal quando o cliente for carregado
  useEffect(() => {
    if (client?.meta_ads_budget) {
      const daysInMonth = getDaysInMonth(new Date());
      const idealDaily = client.meta_ads_budget / daysInMonth;
      setIdealDailyBudget(idealDaily);

      if (latestReview?.meta_daily_budget_current) {
        const percentDifference = ((latestReview.meta_daily_budget_current - idealDaily) / idealDaily) * 100;
        
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
    hasError
  };
};
