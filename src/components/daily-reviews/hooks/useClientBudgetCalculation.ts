
import { useEffect } from "react";
import { ClientWithReview } from "./types/reviewTypes";
import { useBudgetFetcher } from "./budget/useBudgetFetcher";
import { useBudgetCalculations } from "./budget/useBudgetCalculations";
import { useTotalSpentCalculator } from "./budget/useTotalSpentCalculator";

export const useClientBudgetCalculation = (client: ClientWithReview) => {
  // Buscar dados de orçamento personalizado
  const {
    customBudget,
    isLoadingCustomBudget,
    hasReview,
    isUsingCustomBudgetInReview
  } = useBudgetFetcher(client);
  
  // Cálculos de orçamento e recomendações
  const {
    monthlyBudget,
    totalSpent,
    currentDailyBudget,
    idealDailyBudget,
    budgetDifference,
    remainingBudget,
    remainingDays,
    actualBudgetAmount,
    needsBudgetAdjustment,
    isUsingCustomBudget
  } = useBudgetCalculations(client, customBudget, isUsingCustomBudgetInReview, hasReview);
  
  // Cálculo manual de total gasto
  const {
    calculatedTotalSpent,
    isCalculating,
    calculationError,
    calculateTotalSpent
  } = useTotalSpentCalculator();

  // Log para diagnóstico
  useEffect(() => {
    if (customBudget || isUsingCustomBudgetInReview) {
      console.log(`Cliente ${client.company_name} - Orçamento Info:`, {
        isUsingCustomBudget,
        customBudget: customBudget ? {
          valor: customBudget.budget_amount,
          inicio: customBudget.start_date,
          fim: customBudget.end_date
        } : 'Não encontrado',
        customBudgetFromReview: client.lastReview?.custom_budget_amount,
        diasRestantes: remainingDays,
        orcamentoRestante: remainingBudget,
        orcamentoDiarioIdeal: idealDailyBudget,
        needsBudgetAdjustment
      });
    }
  }, [
    customBudget, 
    client.company_name, 
    remainingBudget, 
    idealDailyBudget, 
    isUsingCustomBudgetInReview, 
    needsBudgetAdjustment, 
    remainingDays, 
    client.lastReview?.custom_budget_amount,
    isUsingCustomBudget
  ]);

  return {
    hasReview,
    isCalculating,
    calculationError,
    monthlyBudget,
    totalSpent,
    currentDailyBudget,
    idealDailyBudget,
    budgetDifference,
    remainingDaysValue: remainingDays,
    // Expor a função de cálculo manual para ser chamada pelos botões "analisar"
    calculateTotalSpent: () => calculateTotalSpent(client.meta_account_id, customBudget),
    // Informações sobre orçamento personalizado
    customBudget,
    isLoadingCustomBudget,
    remainingBudget,
    // Informações adicionais
    isUsingCustomBudgetInReview,
    isUsingCustomBudget,
    actualBudgetAmount,
    // Nova propriedade para ajudar na ordenação
    needsBudgetAdjustment
  };
};
