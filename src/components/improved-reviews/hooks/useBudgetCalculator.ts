
import { useMemo } from "react";

type BudgetInput = {
  monthlyBudget: number;
  totalSpent: number;
  currentDailyBudget: number;
  lastFiveDaysAverage?: number;
  weightedAverage?: number; // Campo para média ponderada (Google Ads)
  customBudgetEndDate?: string;
};

type BudgetCalculation = {
  idealDailyBudget: number;
  budgetDifference: number;
  budgetDifferenceBasedOnAverage?: number;
  budgetDifferenceBasedOnWeighted?: number;
  remainingDays: number;
  remainingBudget: number;
  needsBudgetAdjustment: boolean;
  needsAdjustmentBasedOnAverage?: boolean;
  needsAdjustmentBasedOnWeighted?: boolean;
  spentPercentage: number;
};

export function useBudgetCalculator() {
  const calculateBudget = useMemo(() => {
    return (input: BudgetInput): BudgetCalculation => {
      const today = new Date();
      
      // Calcular dias restantes
      let remainingDays;
      if (input.customBudgetEndDate) {
        const endDate = new Date(input.customBudgetEndDate);
        const timeDiff = endDate.getTime() - today.getTime();
        remainingDays = Math.max(1, Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1);
        
        console.log(`🔍 DEBUG - Cálculo de dias restantes (orçamento personalizado):`, {
          today: today.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0],
          customBudgetEndDate: input.customBudgetEndDate,
          timeDiff,
          remainingDays,
          calculationUsed: 'customBudget'
        });
      } else {
        const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        remainingDays = lastDayOfMonth.getDate() - today.getDate() + 1;
        
        console.log(`🔍 DEBUG - Cálculo de dias restantes (mês atual):`, {
          today: today.toISOString().split('T')[0],
          lastDayOfMonth: lastDayOfMonth.toISOString().split('T')[0],
          remainingDays,
          calculationUsed: 'monthEnd'
        });
      }
      
      const remainingBudget = Math.max(0, input.monthlyBudget - input.totalSpent);
      const spentPercentage = input.monthlyBudget > 0 
        ? (input.totalSpent / input.monthlyBudget) * 100 
        : 0;
      
      const idealDailyBudget = remainingDays > 0 ? remainingBudget / remainingDays : 0;
      const roundedIdealDailyBudget = Math.round(idealDailyBudget * 100) / 100;
      
      // CORREÇÃO: Priorizar média ponderada para Google Ads
      let primaryBudgetDifference;
      let primaryNeedsAdjustment;
      
      if (input.weightedAverage !== undefined && input.weightedAverage > 0) {
        // Para Google Ads: usar média ponderada como base principal
        primaryBudgetDifference = roundedIdealDailyBudget - input.weightedAverage;
        const absoluteDifference = Math.abs(primaryBudgetDifference);
        primaryNeedsAdjustment = absoluteDifference >= 5;
        
        console.log(`🔍 DEBUG - Usando média ponderada como base principal:`, {
          idealDailyBudget: roundedIdealDailyBudget,
          weightedAverage: input.weightedAverage,
          budgetDifference: primaryBudgetDifference,
          absoluteDifference,
          needsAdjustment: primaryNeedsAdjustment,
          threshold: '≥ R$ 5'
        });
      } else {
        // Para Meta Ads ou quando não há média ponderada: usar método tradicional
        primaryBudgetDifference = roundedIdealDailyBudget - input.currentDailyBudget;
        const absoluteDifference = Math.abs(primaryBudgetDifference);
        primaryNeedsAdjustment = input.currentDailyBudget > 0 && absoluteDifference >= 5;
        
        console.log(`🔍 DEBUG - Usando método tradicional:`, {
          idealDailyBudget: roundedIdealDailyBudget,
          currentDailyBudget: input.currentDailyBudget,
          budgetDifference: primaryBudgetDifference,
          absoluteDifference,
          needsAdjustment: primaryNeedsAdjustment,
          threshold: '≥ R$ 5'
        });
      }
      
      // Cálculos adicionais para compatibilidade
      const budgetDifferenceBasedOnAverage = input.lastFiveDaysAverage !== undefined && input.lastFiveDaysAverage > 0
        ? roundedIdealDailyBudget - input.lastFiveDaysAverage
        : undefined;
      
      const needsAdjustmentBasedOnAverage = budgetDifferenceBasedOnAverage !== undefined
        ? Math.abs(budgetDifferenceBasedOnAverage) >= 5
        : undefined;
      
      const budgetDifferenceBasedOnWeighted = input.weightedAverage !== undefined && input.weightedAverage > 0
        ? roundedIdealDailyBudget - input.weightedAverage
        : undefined;
      
      const needsAdjustmentBasedOnWeighted = budgetDifferenceBasedOnWeighted !== undefined
        ? Math.abs(budgetDifferenceBasedOnWeighted) >= 5
        : undefined;
      
      return {
        idealDailyBudget: roundedIdealDailyBudget,
        budgetDifference: primaryBudgetDifference, // CORREÇÃO: Agora usa a lógica priorizada
        budgetDifferenceBasedOnAverage,
        budgetDifferenceBasedOnWeighted,
        remainingDays,
        remainingBudget,
        needsBudgetAdjustment: primaryNeedsAdjustment, // CORREÇÃO: Agora usa a lógica priorizada
        needsAdjustmentBasedOnAverage,
        needsAdjustmentBasedOnWeighted,
        spentPercentage
      };
    };
  }, []);
  
  return { calculateBudget };
}
