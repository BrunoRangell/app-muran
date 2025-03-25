
import { useEffect } from "react";
import { ClientWithReview } from "./types/reviewTypes";
import { useBudgetFetcher } from "./budget/useBudgetFetcher";
import { useBudgetCalculations } from "./budget/useBudgetCalculations";

export const useGoogleAdsBudgetCalculation = (client: ClientWithReview) => {
  // Buscar dados de orçamento personalizado
  const {
    customBudget,
    isLoadingCustomBudget,
    hasReview,
    isUsingCustomBudgetInReview
  } = useBudgetFetcher(client);
  
  // Cálculos de orçamento e recomendações - usando o orçamento personalizado se disponível
  const {
    monthlyBudget: metaMonthlyBudget,
    totalSpent,
    currentDailyBudget,
    idealDailyBudget,
    budgetDifference,
    remainingBudget,
    remainingDays,
    actualBudgetAmount,
    needsBudgetAdjustment
  } = useBudgetCalculations(client, customBudget, isUsingCustomBudgetInReview, hasReview);
  
  // Substituir o orçamento mensal pelo orçamento de Google Ads
  const monthlyBudget = client.google_ads_budget || 0;

  // Log para diagnóstico
  useEffect(() => {
    console.log(`Cliente ${client.company_name} - Orçamento Google Ads:`, {
      orçamentoMensal: monthlyBudget,
      orçamentoDiárioAtual: currentDailyBudget,
      orçamentoDiárioIdeal: idealDailyBudget,
      diferençaOrçamento: budgetDifference,
      needsBudgetAdjustment
    });
    
    // Atualizar a propriedade needsBudgetAdjustment no objeto client
    if (client && needsBudgetAdjustment !== undefined) {
      client.needsBudgetAdjustment = needsBudgetAdjustment;
    }
  }, [
    client, 
    client.company_name, 
    monthlyBudget,
    currentDailyBudget,
    idealDailyBudget,
    budgetDifference,
    needsBudgetAdjustment
  ]);

  return {
    hasReview,
    monthlyBudget,
    totalSpent,
    currentDailyBudget,
    idealDailyBudget,
    budgetDifference,
    remainingDaysValue: remainingDays,
    // Informações sobre orçamento personalizado
    customBudget,
    isLoadingCustomBudget,
    remainingBudget,
    // Informações adicionais
    isUsingCustomBudgetInReview,
    actualBudgetAmount,
    // Nova propriedade para ajudar na ordenação
    needsBudgetAdjustment,
    // Flag para controle de estado
    isCalculating: false,
    calculationError: null
  };
};
