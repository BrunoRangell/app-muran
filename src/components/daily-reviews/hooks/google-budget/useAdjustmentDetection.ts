
import { useMemo } from "react";

interface AdjustmentDetectionParams {
  hasReview: boolean;
  currentDailyBudget: number;
  idealDailyBudget: number;
  lastFiveDaysSpent: number;
  budgetDifference: number;
  budgetDifferenceBasedOnAverage: number;
}

export const useAdjustmentDetection = ({
  hasReview,
  currentDailyBudget,
  idealDailyBudget,
  lastFiveDaysSpent,
  budgetDifference,
  budgetDifferenceBasedOnAverage
}: AdjustmentDetectionParams) => {
  // Determinar se o orçamento precisa de ajuste baseado no orçamento atual
  const needsBudgetAdjustment = useMemo(() => {
    if (!hasReview || currentDailyBudget === 0) return false;
    
    // Verifica se a diferença é maior que 5 reais ou 5% do orçamento atual
    const absoluteDifference = Math.abs(budgetDifference);
    const percentageDifference = absoluteDifference / currentDailyBudget;
    
    return absoluteDifference >= 5 && percentageDifference >= 0.05;
  }, [hasReview, budgetDifference, currentDailyBudget]);
  
  // Determinar se o orçamento precisa de ajuste baseado na média de gasto
  const needsAdjustmentBasedOnAverage = useMemo(() => {
    if (!hasReview || lastFiveDaysSpent === 0) return false;
    
    // Verifica se a diferença é maior que 5 reais ou 5% da média
    const absoluteDifference = Math.abs(budgetDifferenceBasedOnAverage);
    const percentageDifference = lastFiveDaysSpent > 0 ? absoluteDifference / lastFiveDaysSpent : 0;
    
    return absoluteDifference >= 5 && percentageDifference >= 0.05;
  }, [hasReview, budgetDifferenceBasedOnAverage, lastFiveDaysSpent]);
  
  return {
    needsBudgetAdjustment,
    needsAdjustmentBasedOnAverage
  };
};
