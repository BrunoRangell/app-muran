
interface AdjustmentDetectionProps {
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
}: AdjustmentDetectionProps) => {
  // Para detecção baseada no orçamento atual
  const needsBudgetAdjustment = hasReview && currentDailyBudget > 0 && (
    // Verificar se a diferença absoluta é significativa (>= 5)
    (Math.abs(budgetDifference) >= 5) && 
    // E se a diferença percentual é significativa (>= 5%)
    (Math.abs(budgetDifference) / currentDailyBudget >= 0.05)
  );
  
  // Para detecção baseada na média dos últimos 5 dias (apenas para Google)
  const needsAdjustmentBasedOnAverage = hasReview && lastFiveDaysSpent > 0 && (
    // Verificar se a diferença absoluta é significativa (>= 5)
    (Math.abs(budgetDifferenceBasedOnAverage) >= 5) && 
    // E se a diferença percentual é significativa (>= 5%)
    (Math.abs(budgetDifferenceBasedOnAverage) / lastFiveDaysSpent >= 0.05)
  );
  
  return {
    needsBudgetAdjustment,
    needsAdjustmentBasedOnAverage
  };
};
