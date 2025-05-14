
import { useMemo } from "react";

type BudgetInput = {
  monthlyBudget: number;
  totalSpent: number;
  currentDailyBudget: number;
  lastFiveDaysAverage?: number; // Adicionado campo para média dos últimos 5 dias
};

type BudgetCalculation = {
  idealDailyBudget: number;
  budgetDifference: number;
  budgetDifferenceBasedOnAverage?: number; // Nova propriedade para diferença baseada na média
  remainingDays: number;
  remainingBudget: number;
  needsBudgetAdjustment: boolean;
  needsAdjustmentBasedOnAverage?: boolean; // Nova propriedade para indicar se precisa ajuste baseado na média
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
      
      // Diferença baseada na média dos últimos 5 dias (se disponível)
      let budgetDifferenceBasedOnAverage;
      let needsAdjustmentBasedOnAverage;
      
      if (input.lastFiveDaysAverage !== undefined && input.lastFiveDaysAverage > 0) {
        budgetDifferenceBasedOnAverage = roundedIdealDailyBudget - input.lastFiveDaysAverage;
        
        // Determinar se precisa de ajuste baseado na média (diferença de 5 reais ou 5%)
        const absoluteDifferenceAverage = Math.abs(budgetDifferenceBasedOnAverage);
        const percentageDifferenceAverage = input.lastFiveDaysAverage > 0 
          ? absoluteDifferenceAverage / input.lastFiveDaysAverage 
          : 0;
          
        needsAdjustmentBasedOnAverage = 
          (absoluteDifferenceAverage >= 5) || // diferença absoluta de 5 reais
          (percentageDifferenceAverage >= 0.05 && absoluteDifferenceAverage >= 1); // ou 5% com pelo menos 1 real de diferença
      }
      
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
        budgetDifferenceBasedOnAverage,
        remainingDays,
        remainingBudget,
        needsBudgetAdjustment,
        needsAdjustmentBasedOnAverage,
        spentPercentage
      };
    };
  }, []);
  
  return { calculateBudget };
}
