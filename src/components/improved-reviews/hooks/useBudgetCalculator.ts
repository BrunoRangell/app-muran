
import { useMemo } from "react";

type BudgetInput = {
  monthlyBudget: number;
  totalSpent: number;
  currentDailyBudget: number;
  lastFiveDaysAverage?: number;
  customBudgetAmount?: number;
  customBudgetEndDate?: string;
  usingCustomBudget?: boolean;
};

type BudgetCalculation = {
  idealDailyBudget: number;
  budgetDifference: number;
  budgetDifferenceBasedOnAverage?: number;
  remainingDays: number;
  remainingBudget: number;
  needsBudgetAdjustment: boolean;
  needsAdjustmentBasedOnAverage?: boolean;
  spentPercentage: number;
};

export function useBudgetCalculator() {
  const calculateBudget = useMemo(() => {
    return (input: BudgetInput): BudgetCalculation => {
      const today = new Date();
      
      // Se temos um orçamento personalizado com data de término, usar essa data
      let lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      let effectiveBudget = input.monthlyBudget;
      
      // Verificar se estamos usando orçamento personalizado
      if (input.usingCustomBudget && input.customBudgetAmount && input.customBudgetEndDate) {
        // Usar o valor do orçamento personalizado
        effectiveBudget = input.customBudgetAmount;
        
        // Usar a data de término do orçamento personalizado
        const endDate = new Date(input.customBudgetEndDate);
        if (endDate > today) {
          lastDayOfMonth = endDate;
        }
      }
      
      const remainingDays = lastDayOfMonth.getDate() - today.getDate() + 1;
      
      // Orçamento restante para o mês (nunca negativo)
      const remainingBudget = Math.max(0, effectiveBudget - input.totalSpent);
      
      // Calcular porcentagem gasta do orçamento
      const spentPercentage = effectiveBudget > 0 
        ? (input.totalSpent / effectiveBudget) * 100 
        : 0;
      
      // Calcular orçamento diário ideal
      const idealDailyBudget = remainingDays > 0 ? remainingBudget / remainingDays : 0;
      
      // Arredondar para 2 casas decimais
      const roundedIdealDailyBudget = Math.round(idealDailyBudget * 100) / 100;
      
      // Diferença entre o orçamento diário atual e o ideal
      const budgetDifference = input.currentDailyBudget > 0 
        ? roundedIdealDailyBudget - input.currentDailyBudget
        : 0;
      
      // Determinar se precisa de ajuste (apenas diferença absoluta de 5 reais ou mais)
      const absoluteDifference = Math.abs(budgetDifference);
      
      // MODIFICADO: Agora considera apenas a diferença absoluta >= R$5
      const needsBudgetAdjustment = 
        input.currentDailyBudget > 0 && // só considera se tem orçamento atual
        absoluteDifference >= 5; // apenas diferença absoluta de 5 reais ou mais
      
      // Inicializar valores opcionais
      let budgetDifferenceBasedOnAverage;
      let needsAdjustmentBasedOnAverage;
      
      // Calcular a diferença baseada na média dos últimos 5 dias somente se fornecida
      // e se o valor for maior que zero (evitar mostrar recomendação quando não há dados)
      if (input.lastFiveDaysAverage !== undefined && input.lastFiveDaysAverage > 0) {
        budgetDifferenceBasedOnAverage = roundedIdealDailyBudget - input.lastFiveDaysAverage;
        
        // Determinar se precisa de ajuste baseado na média (apenas diferença absoluta de 5 reais ou mais)
        const absoluteDifferenceAverage = Math.abs(budgetDifferenceBasedOnAverage);
        
        // MODIFICADO: Agora considera apenas a diferença absoluta >= R$5
        needsAdjustmentBasedOnAverage = absoluteDifferenceAverage >= 5;
      }
      
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
