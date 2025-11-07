import { useState, useEffect } from "react";
import { formatDateInBrasiliaTz } from "@/utils/dateUtils";
import { getDaysInMonth } from "date-fns";

interface BudgetCalculationResult {
  hasReview: boolean;
  monthlyBudget: number | null;
  totalSpent: number | null;
  lastFiveDaysSpent: number | null;
  weightedAverage: number | null;
  currentDailyBudget: number | null;
  idealDailyBudget: number | null;
  budgetDifference: number | null;
  isCalculating: boolean;
  remainingDaysValue: number | null;
  needsBudgetAdjustment: boolean;
  usingCustomBudget: boolean;
  customBudgetAmount: number | null;
  customBudgetStartDate: string | null;
  customBudgetEndDate: string | null;
}

interface UseBudgetCalculationProps {
  client: any;
}

export const useBudgetCalculations = ({ client }: UseBudgetCalculationProps): BudgetCalculationResult => {
  const [hasReview, setHasReview] = useState<boolean>(false);
  const [monthlyBudget, setMonthlyBudget] = useState<number | null>(null);
  const [totalSpent, setTotalSpent] = useState<number | null>(null);
  const [lastFiveDaysSpent, setLastFiveDaysSpent] = useState<number | null>(null);
  const [weightedAverage, setWeightedAverage] = useState<number | null>(null);
  const [currentDailyBudget, setCurrentDailyBudget] = useState<number | null>(null);
  const [idealDailyBudget, setIdealDailyBudget] = useState<number | null>(null);
  const [budgetDifference, setBudgetDifference] = useState<number | null>(null);
  const [isCalculating, setIsCalculating] = useState<boolean>(true);
  const [remainingDaysValue, setRemainingDaysValue] = useState<number | null>(null);
  const [needsBudgetAdjustment, setNeedsBudgetAdjustment] = useState<boolean>(false);
  const [usingCustomBudget, setUsingCustomBudget] = useState<boolean>(false);
  const [customBudgetAmount, setCustomBudgetAmount] = useState<number | null>(null);
  const [customBudgetStartDate, setCustomBudgetStartDate] = useState<string | null>(null);
  const [customBudgetEndDate, setCustomBudgetEndDate] = useState<string | null>(null);

  useEffect(() => {
    setIsCalculating(true);

    if (client) {
      // Verificar se o cliente tem um orçamento personalizado ativo
      if (client.custom_budgets && client.custom_budgets.length > 0) {
        const today = new Date();
        const activeBudget = client.custom_budgets.find(budget => {
          const startDate = new Date(budget.start_date);
          const endDate = new Date(budget.end_date);
          return startDate <= today && endDate >= today;
        });

        if (activeBudget) {
          setUsingCustomBudget(true);
          setCustomBudgetAmount(activeBudget.budget_amount);
          setCustomBudgetStartDate(activeBudget.start_date);
          setCustomBudgetEndDate(activeBudget.end_date);
        } else {
          setUsingCustomBudget(false);
          setCustomBudgetAmount(null);
          setCustomBudgetStartDate(null);
          setCustomBudgetEndDate(null);
        }
      } else {
        setUsingCustomBudget(false);
        setCustomBudgetAmount(null);
        setCustomBudgetStartDate(null);
        setCustomBudgetEndDate(null);
      }

      // Calcular valores
      const review = client.lastReview;
      setHasReview(!!review);

      const clientMonthlyBudget = client.meta_ads_budget || 0;
      setMonthlyBudget(clientMonthlyBudget);

      const clientTotalSpent = review?.meta_total_spent || 0;
      setTotalSpent(clientTotalSpent);

      const clientLastFiveDaysSpent = review?.meta_last_5_days_spent || 0;
      setLastFiveDaysSpent(clientLastFiveDaysSpent);

      const clientWeightedAverage = review?.meta_weighted_average || 0;
      setWeightedAverage(clientWeightedAverage);

      const clientCurrentDailyBudget = review?.meta_daily_budget_current || 0;
      setCurrentDailyBudget(clientCurrentDailyBudget);

      // Lógica para orçamento ideal
      const today = new Date();
      const daysInMonth = getDaysInMonth(today);
      const currentDay = today.getDate();
      const remainingDays = daysInMonth - currentDay + 1;
      setRemainingDaysValue(remainingDays);

      const remainingBudget = clientMonthlyBudget - clientTotalSpent;
      const calculatedIdealDailyBudget = remainingBudget / remainingDays;
      setIdealDailyBudget(calculatedIdealDailyBudget);

      const calculatedBudgetDifference = calculatedIdealDailyBudget - clientCurrentDailyBudget;
      setBudgetDifference(calculatedBudgetDifference);

      // Determinar se o orçamento precisa de ajuste (threshold de R$ 5)
      setNeedsBudgetAdjustment(Math.abs(calculatedBudgetDifference) >= 5);
    }

    setIsCalculating(false);
  }, [client]);

  return {
    hasReview,
    monthlyBudget,
    totalSpent,
    lastFiveDaysSpent,
    weightedAverage,
    currentDailyBudget,
    idealDailyBudget,
    budgetDifference,
    isCalculating,
    remainingDaysValue,
    needsBudgetAdjustment,
    usingCustomBudget,
    customBudgetAmount,
    customBudgetStartDate,
    customBudgetEndDate
  };
};
