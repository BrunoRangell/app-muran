
import { useMemo } from "react";

type BudgetInput = {
  monthlyBudget: number;
  totalSpent: number;
  currentDailyBudget: number;
};

type BudgetCalculation = {
  idealDailyBudget: number;
  budgetDifference: number;
  remainingDays: number;
  remainingBudget: number;
  needsBudgetAdjustment: boolean;
};

export function useBudgetCalculator() {
  const calculateBudget = useMemo(() => {
    return (input: BudgetInput): BudgetCalculation => {
      const today = new Date();
      const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      const remainingDays = lastDayOfMonth.getDate() - today.getDate() + 1;
      
      // Orçamento restante para o mês
      const remainingBudget = Math.max(0, input.monthlyBudget - input.totalSpent);
      
      // Calcular orçamento diário ideal
      const idealDailyBudget = remainingDays > 0 ? remainingBudget / remainingDays : 0;
      
      // Arredondar para 2 casas decimais
      const roundedIdealDailyBudget = Math.round(idealDailyBudget * 100) / 100;
      
      // Diferença entre o orçamento diário atual e o ideal
      const budgetDifference = roundedIdealDailyBudget - input.currentDailyBudget;
      
      // Determinar se precisa de ajuste (diferença > 5)
      const needsBudgetAdjustment = Math.abs(budgetDifference) >= 5;
      
      return {
        idealDailyBudget: roundedIdealDailyBudget,
        budgetDifference,
        remainingDays,
        remainingBudget,
        needsBudgetAdjustment
      };
    };
  }, []);
  
  return { calculateBudget };
}
