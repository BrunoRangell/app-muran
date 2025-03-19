
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
  
  // Cálculos de orçamento e recomendações - usando o orçamento personalizado se disponível
  const {
    monthlyBudget,
    totalSpent,
    currentDailyBudget,
    idealDailyBudget,
    budgetDifference,
    remainingBudget,
    remainingDays,
    actualBudgetAmount,
    needsBudgetAdjustment
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
        isUsingCustomBudgetInReview,
        customBudget: customBudget ? {
          valor: customBudget.budget_amount,
          inicio: customBudget.start_date,
          fim: customBudget.end_date,
          isActive: customBudget.is_active
        } : 'Não encontrado',
        customBudgetFromReview: client.lastReview?.custom_budget_amount,
        customBudgetEndDate: client.lastReview?.custom_budget_end_date,
        diasRestantes: remainingDays,
        orcamentoRestante: remainingBudget,
        orcamentoDiarioIdeal: idealDailyBudget,
        needsBudgetAdjustment,
        orçamentoDiárioAtual: currentDailyBudget
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
    client.lastReview?.custom_budget_end_date,
    currentDailyBudget
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
    actualBudgetAmount,
    // Nova propriedade para ajudar na ordenação
    needsBudgetAdjustment
  };
};
