
import { useState, useEffect } from "react";
import { ClientWithReview } from "./types/reviewTypes";
import { getRemainingDaysInMonth } from "../summary/utils";

export const useGoogleAdsBudgetCalculation = (client: ClientWithReview) => {
  const [hasReview, setHasReview] = useState<boolean>(false);
  const [monthlyBudget, setMonthlyBudget] = useState<number>(0);
  const [totalSpent, setTotalSpent] = useState<number>(0);
  const [currentDailyBudget, setCurrentDailyBudget] = useState<number>(0);
  const [idealDailyBudget, setIdealDailyBudget] = useState<number>(0);
  const [budgetDifference, setBudgetDifference] = useState<number>(0);
  const [isCalculating, setIsCalculating] = useState<boolean>(true);
  const [remainingDaysValue, setRemainingDaysValue] = useState<number>(0);
  const [needsBudgetAdjustment, setNeedsBudgetAdjustment] = useState<boolean>(false);
  const [calculationError, setCalculationError] = useState<string | null>(null);
  const [last5DaysAvg, setLast5DaysAvg] = useState<number>(0);

  useEffect(() => {
    const calculateBudget = () => {
      try {
        // Verificar se temos a revisão e orçamento mensal
        const review = client.lastReview;
        setHasReview(!!review);

        // Obter o orçamento mensal
        const budget = client.google_ads_budget || 0;
        setMonthlyBudget(budget);

        // Se não temos revisão ou orçamento, não podemos calcular
        if (!review || budget <= 0) {
          setIsCalculating(false);
          return;
        }

        // Obter gasto total e orçamento diário atual da revisão
        const spent = review.google_total_spent || 0;
        const daily = review.google_daily_budget_current || 0;
        setTotalSpent(spent);
        setCurrentDailyBudget(daily);

        // Obter a média dos últimos 5 dias (se existir na revisão)
        const avgLast5Days = review.google_last_5_days_avg || 0;
        setLast5DaysAvg(avgLast5Days);

        // Calcular dias restantes no mês
        const remainingDays = getRemainingDaysInMonth();
        setRemainingDaysValue(remainingDays);

        // Calcular orçamento restante
        const remainingBudget = Math.max(budget - spent, 0);

        // Calcular orçamento diário ideal
        const ideal = remainingDays > 0 ? remainingBudget / remainingDays : 0;
        setIdealDailyBudget(ideal);

        // Calcular diferença entre ideal e atual
        const diff = ideal - daily;
        setBudgetDifference(diff);

        // Determinar se precisa de ajuste (diferença maior ou igual a R$5 ou 5%)
        const needsAdjustment = 
          Math.abs(diff) >= 5 && 
          (daily === 0 || Math.abs(diff / daily) >= 0.05);
        setNeedsBudgetAdjustment(needsAdjustment);

        setIsCalculating(false);
      } catch (error) {
        console.error("Erro ao calcular orçamento Google Ads:", error);
        setCalculationError("Erro ao calcular orçamento");
        setIsCalculating(false);
      }
    };

    calculateBudget();
  }, [client]);

  return {
    hasReview,
    monthlyBudget,
    totalSpent,
    currentDailyBudget,
    idealDailyBudget,
    budgetDifference,
    isCalculating,
    remainingDaysValue,
    needsBudgetAdjustment,
    calculationError,
    last5DaysAvg
  };
};
