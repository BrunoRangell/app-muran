const TAX_RATE = 0.1215;

export interface NeedsAdjustmentOptions {
  considerTaxes?: boolean;
  budgetCalculationMode?: "weighted" | "current";
}

export interface NeedsAdjustmentResult {
  needsAdjustment: boolean;
  warningIgnoredToday: boolean;
  budgetDifference: number;
  idealDailyBudget: number;
  comparisonValue: number;
}

/**
 * Replica a mesma lógica do CircularBudgetCard para determinar se um cliente
 * precisa de ajuste de orçamento, considerando tributos e modo de cálculo.
 */
export function computeNeedsAdjustment(
  client: any,
  platform: "meta" | "google",
  options: NeedsAdjustmentOptions = {}
): NeedsAdjustmentResult {
  const { considerTaxes = false, budgetCalculationMode = "weighted" } = options;

  // Tributos só se aplicam a contas Meta Ads (alinhado ao ClientGroupCard)
  const applyTaxes = considerTaxes && platform === "meta";

  const budgetAmount = client?.budget_amount || 0;
  const spentAmount = client?.review?.total_spent || 0;
  const remainingDays = client?.budgetCalculation?.remainingDays || 0;
  const originalIdealDailyBudget = client?.budgetCalculation?.idealDailyBudget || 0;
  const currentDailyBudget = client?.review?.daily_budget_current || 0;
  const weightedAverage = client?.weightedAverage || 0;

  const effectiveBudget = applyTaxes ? budgetAmount * (1 - TAX_RATE) : budgetAmount;

  const idealDailyBudget = applyTaxes
    ? Math.max(effectiveBudget - spentAmount, 0) / Math.max(remainingDays, 1)
    : originalIdealDailyBudget;

  const comparisonValue =
    platform === "google" && budgetCalculationMode === "weighted" && weightedAverage > 0
      ? weightedAverage
      : currentDailyBudget;

  const budgetDifference = idealDailyBudget - comparisonValue;
  const needsAdjustment = Math.abs(budgetDifference) >= 5;
  const warningIgnoredToday = !!client?.budgetCalculation?.warningIgnoredToday;

  return {
    needsAdjustment,
    warningIgnoredToday,
    budgetDifference,
    idealDailyBudget,
    comparisonValue,
  };
}
