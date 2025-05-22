
interface AdjustmentDetectionProps {
  hasReview: boolean;
  currentDailyBudget: number;
  idealDailyBudget: number;
  lastFiveDaysSpent: number;
  budgetDifference: number;
  budgetDifferenceBasedOnAverage: number;
}

interface AdjustmentResult {
  needsBudgetAdjustment: boolean;
  needsAdjustmentBasedOnAverage: boolean;
}

export const useAdjustmentDetection = ({
  hasReview,
  currentDailyBudget,
  idealDailyBudget,
  lastFiveDaysSpent,
  budgetDifference,
  budgetDifferenceBasedOnAverage
}: AdjustmentDetectionProps): AdjustmentResult => {
  // Verificar se é necessário ajuste do orçamento diário atual
  const needsBudgetAdjustment = hasReview && 
                              currentDailyBudget > 0 && 
                              Math.abs(budgetDifference) >= 5 && 
                              (Math.abs(budgetDifference) / currentDailyBudget >= 0.05);
  
  // Verificar se é necessário ajuste baseado na média dos últimos 5 dias
  const needsAdjustmentBasedOnAverage = hasReview && 
                                     lastFiveDaysSpent > 0 && 
                                     Math.abs(budgetDifferenceBasedOnAverage) >= 5 && 
                                     (Math.abs(budgetDifferenceBasedOnAverage) / lastFiveDaysSpent >= 0.05);
  
  return {
    needsBudgetAdjustment,
    needsAdjustmentBasedOnAverage
  };
};
