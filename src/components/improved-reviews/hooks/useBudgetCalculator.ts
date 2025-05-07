
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
  spentPercentage: number;
};

export function useBudgetCalculator() {
  const calculateBudget = useMemo(() => {
    return (input: BudgetInput): BudgetCalculation => {
      const today = new Date();
      const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      const remainingDays = lastDayOfMonth.getDate() - today.getDate() + 1;
      
      // Orçamento restante para o mês (nunca negativo)
      const remainingBudget = Math.max(0, input.monthlyBudget - input.totalSpent);
      
      // Calcular porcentagem gasta do orçamento
      const spentPercentage = input.monthlyBudget > 0 
        ? (input.totalSpent / input.monthlyBudget) * 100 
        : 0;
      
      // Calcular orçamento diário ideal
      const idealDailyBudget = remainingDays > 0 ? remainingBudget / remainingDays : 0;
      
      // Arredondar para 2 casas decimais
      const roundedIdealDailyBudget = Math.round(idealDailyBudget * 100) / 100;
      
      // Diferença entre o orçamento diário atual e o ideal
      const budgetDifference = roundedIdealDailyBudget - input.currentDailyBudget;
      
      // Determinar se precisa de ajuste (diferença de 5 reais ou 5%)
      const absoluteDifference = Math.abs(budgetDifference);
      const percentageDifference = input.currentDailyBudget > 0 
        ? absoluteDifference / input.currentDailyBudget 
        : 0;
        
      const needsBudgetAdjustment = 
        input.currentDailyBudget > 0 && // só considera se tem orçamento atual
        ((absoluteDifference >= 5) || // diferença absoluta de 5 reais
        (percentageDifference >= 0.05 && absoluteDifference >= 1)); // ou 5% com pelo menos 1 real de diferença
      
      return {
        idealDailyBudget: roundedIdealDailyBudget,
        budgetDifference,
        remainingDays,
        remainingBudget,
        needsBudgetAdjustment,
        spentPercentage
      };
    };
  }, []);
  
  return { calculateBudget };
}
