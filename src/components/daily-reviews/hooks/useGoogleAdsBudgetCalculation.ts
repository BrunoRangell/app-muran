
import { useMemo } from "react";
import { ClientWithReview } from "./types/reviewTypes";
import { useCustomBudgetData } from "./google-budget/useCustomBudgetData";
import { useTotalBudgetCalculation } from "./google-budget/useTotalBudgetCalculation";
import { useSpendCalculations } from "./google-budget/useSpendCalculations";
import { useRemainingDaysCalculation } from "./google-budget/useRemainingDaysCalculation";
import { useIdealBudgetCalculation } from "./google-budget/useIdealBudgetCalculation";
import { useAdjustmentDetection } from "./google-budget/useAdjustmentDetection";
import { GoogleAdsBudgetResult } from "./google-budget/types";

export const useGoogleAdsBudgetCalculation = (client: ClientWithReview): GoogleAdsBudgetResult => {
  // Obter dados do orçamento personalizado
  const customBudgetState = useCustomBudgetData(client);
  
  // Calcular orçamento mensal total
  const monthlyBudget = useTotalBudgetCalculation(client, customBudgetState);
  
  // Calcular gastos e orçamento diário atual
  const { 
    hasReview, 
    totalSpent, 
    lastFiveDaysSpent, 
    currentDailyBudget 
  } = useSpendCalculations(client);
  
  // Calcular dias restantes
  const remainingDaysValue = useRemainingDaysCalculation(customBudgetState);
  
  // Calcular orçamento restante
  const remainingBudget = Math.max(monthlyBudget - totalSpent, 0);
  
  // Calcular orçamento diário ideal
  const idealDailyBudget = useIdealBudgetCalculation({
    remainingBudget,
    remainingDaysValue
  });
  
  // Calcular diferenças de orçamento
  const budgetDifference = useMemo(() => {
    if (!hasReview || currentDailyBudget === 0) return 0;
    return idealDailyBudget - currentDailyBudget;
  }, [hasReview, idealDailyBudget, currentDailyBudget]);
  
  // Calcular diferença baseada na média dos últimos 5 dias
  const budgetDifferenceBasedOnAverage = useMemo(() => {
    if (!hasReview || lastFiveDaysSpent === 0) return 0;
    return idealDailyBudget - lastFiveDaysSpent;
  }, [hasReview, idealDailyBudget, lastFiveDaysSpent]);
  
  // Detectar necessidade de ajustes
  const { 
    needsBudgetAdjustment, 
    needsAdjustmentBasedOnAverage 
  } = useAdjustmentDetection({
    hasReview,
    currentDailyBudget,
    idealDailyBudget,
    lastFiveDaysSpent,
    budgetDifference,
    budgetDifferenceBasedOnAverage
  });
  
  return {
    hasReview,
    isCalculating: false,
    monthlyBudget,
    totalSpent,
    lastFiveDaysSpent,
    currentDailyBudget,
    idealDailyBudget,
    budgetDifference,
    budgetDifferenceBasedOnAverage,
    remainingDaysValue,
    remainingBudget,
    needsBudgetAdjustment,
    needsAdjustmentBasedOnAverage,
    ...customBudgetState
  };
};
