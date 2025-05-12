
import { useMemo } from "react";
import { getCurrentDateInBrasiliaTz } from "@/utils/dateUtils";
import { BudgetInfo } from "../types/budgetTypes";

interface BudgetCalculatorInput {
  monthlyBudget?: number | null;
  totalSpent?: number | null;
  currentDailyBudget?: number | null;
  lastFiveDaysAverage?: number | null;
  customBudgetAmount?: number | null;
  customBudgetEndDate?: string | null;
  usingCustomBudget?: boolean;
}

export function useBudgetCalculator() {
  const calculate = useMemo(() => {
    return (input: BudgetCalculatorInput): BudgetInfo => {
      // Valores padrão para evitar NaN
      const monthlyBudget = input.monthlyBudget || 0;
      const totalSpent = input.totalSpent || 0;
      const currentDailyBudget = input.currentDailyBudget || 0;
      const lastFiveDaysAverage = input.lastFiveDaysAverage;
      
      // Data atual (usando fuso horário de Brasília)
      const today = getCurrentDateInBrasiliaTz();
      
      // Determinar o orçamento a ser usado (personalizado ou mensal)
      let effectiveBudget = monthlyBudget;
      let lastDayOfPeriod = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      
      // Se estamos usando orçamento personalizado
      if (input.usingCustomBudget && input.customBudgetAmount && input.customBudgetEndDate) {
        effectiveBudget = input.customBudgetAmount;
        const endDate = new Date(input.customBudgetEndDate);
        if (endDate > today) {
          lastDayOfPeriod = endDate;
        }
      }
      
      // Calcular dias restantes no período
      const diffTime = Math.abs(lastDayOfPeriod.getTime() - today.getTime());
      const remainingDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      
      // Calcular orçamento restante
      const remainingBudget = Math.max(0, effectiveBudget - totalSpent);
      
      // Calcular orçamento diário ideal
      const idealDailyBudget = remainingDays > 0 ? remainingBudget / remainingDays : 0;
      const roundedIdealDailyBudget = Math.round(idealDailyBudget * 100) / 100;
      
      // Calcular porcentagem gasta
      const spentPercentage = effectiveBudget > 0 
        ? Math.round((totalSpent / effectiveBudget) * 100) 
        : 0;
      
      // Calcular diferença entre orçamentos
      const budgetDifference = currentDailyBudget > 0 
        ? roundedIdealDailyBudget - currentDailyBudget 
        : 0;
      
      // Determinar se precisa de ajuste (diferença absoluta >= 5 reais)
      const needsBudgetAdjustment = 
        currentDailyBudget > 0 && Math.abs(budgetDifference) >= 5;
      
      // Calcular diferença baseada na média dos últimos 5 dias, se disponível
      let budgetDifferenceBasedOnAverage;
      let needsAdjustmentBasedOnAverage;
      
      if (lastFiveDaysAverage !== undefined && lastFiveDaysAverage > 0) {
        budgetDifferenceBasedOnAverage = roundedIdealDailyBudget - lastFiveDaysAverage;
        needsAdjustmentBasedOnAverage = Math.abs(budgetDifferenceBasedOnAverage) >= 5;
      }
      
      return {
        monthlyBudget: effectiveBudget,
        totalSpent,
        currentDailyBudget,
        idealDailyBudget: roundedIdealDailyBudget,
        lastFiveDaysAverage,
        budgetDifference,
        budgetDifferenceBasedOnAverage,
        remainingBudget,
        remainingDays,
        needsBudgetAdjustment,
        needsAdjustmentBasedOnAverage,
        spentPercentage
      };
    };
  }, []);

  return { calculate };
}
