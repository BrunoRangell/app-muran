
import { useState, useEffect, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { getDaysInMonth, format } from 'date-fns';

export const useClientReviewDetails = (clientId: string) => {
  const [recommendation, setRecommendation] = useState<string | null>(null);
  const [idealDailyBudget, setIdealDailyBudget] = useState<number | null>(null);
  const [suggestedBudgetChange, setSuggestedBudgetChange] = useState<number | null>(null);
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

  // Calcular orçamento diário ideal com base na data atual
  useEffect(() => {
    if (client?.meta_ads_budget && latestReview) {
      // Certifique-se de que meta_ads_budget seja tratado como número
      const monthlyBudget = Number(client.meta_ads_budget);
      const totalSpent = Number(latestReview.meta_total_spent) || 0;
      const currentDailyBudget = Number(latestReview.meta_daily_budget_current) || 0;
      
      console.log("Orçamento mensal do cliente:", monthlyBudget);
      console.log("Total gasto até agora:", totalSpent);
      console.log("Orçamento diário atual:", currentDailyBudget);
      
      // Sempre usar a data atual para o cálculo
      const currentDate = new Date();
      const daysInMonth = getDaysInMonth(currentDate);
      const currentDay = currentDate.getDate();
      const remainingDays = daysInMonth - currentDay + 1; // +1 para incluir o dia atual
      
      console.log("Data atual utilizada para cálculo:", currentDate.toLocaleDateString('pt-BR'));
      console.log("Dias no mês:", daysInMonth);
      console.log("Dia atual:", currentDay);
      console.log("Dias restantes:", remainingDays);
      
      // Calcular orçamento restante
      const remainingBudget = monthlyBudget - totalSpent;
      console.log("Orçamento restante:", remainingBudget);
      
      // Calcular orçamento diário ideal baseado no orçamento restante e dias restantes
      const idealDaily = remainingBudget / remainingDays;
      console.log("Orçamento diário ideal calculado:", idealDaily);
      setIdealDailyBudget(idealDaily);
      
      // Calcular diferença entre orçamento atual e ideal
      const budgetDifference = currentDailyBudget - idealDaily;
      setSuggestedBudgetChange(budgetDifference);
      console.log("Diferença de orçamento:", budgetDifference);
      
      // Gerar recomendação baseada na diferença
      // Usar 5% como threshold para sugerir mudanças
      const thresholdPercentage = 0.05;
      const thresholdValue = idealDaily * thresholdPercentage;
      
      if (budgetDifference > thresholdValue) {
        setRecommendation(`Diminuir R$${budgetDifference.toFixed(2)}`);
      } else if (budgetDifference < -thresholdValue) {
        setRecommendation(`Aumentar R$${Math.abs(budgetDifference).toFixed(2)}`);
      } else {
        setRecommendation("Manter o orçamento diário atual");
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
    suggestedBudgetChange,
    isLoading,
    isLoadingHistory,
    hasError,
    refetchData
  };
};
