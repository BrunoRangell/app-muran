
import { useMemo } from "react";
import { ClientWithReview } from "@/components/daily-reviews/hooks/types/reviewTypes";
import { MetricsData } from "../context/types";

interface UseMetricsCalculationProps {
  clients: ClientWithReview[];
  platform: "meta" | "google";
}

export function useMetricsCalculation({ clients, platform }: UseMetricsCalculationProps): MetricsData {
  const metrics = useMemo(() => {
    if (!clients || clients.length === 0) {
      return {
        clientsCount: 0,
        clientsWithReviewCount: 0,
        clientsNeedingAdjustment: 0,
        customBudgetsCount: 0,
        totalMonthlyBudget: 0,
        totalSpent: 0,
        averageSpendPercentage: 0,
      };
    }

    // Definir campos baseados na plataforma
    const budgetField = platform === "meta" ? "meta_ads_budget" : "google_ads_budget";
    const totalSpentField = platform === "meta" ? "meta_total_spent" : "google_total_spent";
    
    // Calcular métricas
    const clientsCount = clients.length;
    
    const clientsWithReview = clients.filter(client => client.lastReview !== null);
    const clientsWithReviewCount = clientsWithReview.length;
    
    const clientsNeedingAdjustment = clients.filter(client => 
      client.needsBudgetAdjustment === true
    ).length;

    const customBudgetsCount = clients.filter(client => 
      client.lastReview?.using_custom_budget === true
    ).length;

    const totalMonthlyBudget = clients.reduce((sum, client) => 
      sum + (client[budgetField] || 0), 0);

    const totalSpent = clientsWithReview.reduce((sum, client) => 
      sum + (client.lastReview?.[totalSpentField] || 0), 0);

    // Calcular percentual médio gasto (evitando divisão por zero)
    let averageSpendPercentage = 0;
    if (totalMonthlyBudget > 0) {
      averageSpendPercentage = (totalSpent / totalMonthlyBudget) * 100;
    }

    return {
      clientsCount,
      clientsWithReviewCount,
      clientsNeedingAdjustment,
      customBudgetsCount,
      totalMonthlyBudget,
      totalSpent,
      averageSpendPercentage: parseFloat(averageSpendPercentage.toFixed(2)),
    };
  }, [clients, platform]);

  return metrics;
}
