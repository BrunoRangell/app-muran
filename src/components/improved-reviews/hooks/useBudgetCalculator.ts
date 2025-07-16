
import { useMemo } from "react";
import { calculateIdealDailyBudget, calculateRemainingDays } from "@/utils/budgetCalculations";

type BudgetInput = {
  monthlyBudget: number;
  totalSpent: number;
  currentDailyBudget: number;
  lastFiveDaysAverage?: number;
  weightedAverage?: number; // Campo para média ponderada (Google Ads)
  customBudgetEndDate?: string;
  customBudgetStartDate?: string; // CORREÇÃO: Garantir que este campo está presente
  customBudgetAmount?: number;
  usingCustomBudget?: boolean;
  warningIgnoredToday?: boolean; // Campo para controlar avisos ignorados
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
  warningIgnoredToday?: boolean; // Retornar o status do aviso ignorado
};

export function useBudgetCalculator() {
  const calculateBudget = useMemo(() => {
    return (input: BudgetInput): BudgetCalculation => {
      // Determinar qual orçamento usar
      const actualBudget = input.usingCustomBudget && input.customBudgetAmount 
        ? input.customBudgetAmount 
        : input.monthlyBudget;
      
      // CORREÇÃO: Calcular dias restantes baseado no tipo de orçamento com ambas as datas
      const remainingDays = input.usingCustomBudget || (input.customBudgetEndDate && input.customBudgetStartDate)
        ? calculateRemainingDays(input.customBudgetEndDate, input.customBudgetStartDate)
        : calculateRemainingDays();
      
      console.log(`🔍 DEBUG - Cálculo de dias restantes:`, {
        usingCustomBudget: input.usingCustomBudget,
        customBudgetStartDate: input.customBudgetStartDate,
        customBudgetEndDate: input.customBudgetEndDate,
        remainingDays,
        actualBudget,
        calculationMethod: (input.usingCustomBudget || (input.customBudgetEndDate && input.customBudgetStartDate)) ? 'customBudget' : 'monthEnd'
      });
      
      const remainingBudget = Math.max(0, actualBudget - input.totalSpent);
      const spentPercentage = actualBudget > 0 
        ? (input.totalSpent / actualBudget) * 100 
        : 0;
      
      // CORREÇÃO: Calcular orçamento diário ideal com ambas as datas
      const idealDailyBudget = calculateIdealDailyBudget(
        actualBudget,
        input.totalSpent,
        input.customBudgetEndDate,
        input.customBudgetStartDate // CORREÇÃO: Passar também a data de início
      );
      
      // CORREÇÃO: Priorizar média ponderada para Google Ads
      let primaryBudgetDifference;
      let primaryNeedsAdjustment;
      
      if (input.weightedAverage !== undefined && input.weightedAverage > 0) {
        // Para Google Ads: usar média ponderada como base principal
        primaryBudgetDifference = idealDailyBudget - input.weightedAverage;
        const absoluteDifference = Math.abs(primaryBudgetDifference);
        primaryNeedsAdjustment = !input.warningIgnoredToday && absoluteDifference >= 5;
        
        console.log(`🔍 DEBUG - Usando média ponderada como base principal:`, {
          idealDailyBudget,
          weightedAverage: input.weightedAverage,
          budgetDifference: primaryBudgetDifference,
          absoluteDifference,
          warningIgnoredToday: input.warningIgnoredToday,
          needsAdjustment: primaryNeedsAdjustment,
          threshold: '≥ R$ 5'
        });
      } else {
        // Para Meta Ads ou quando não há média ponderada: usar método tradicional
        primaryBudgetDifference = idealDailyBudget - input.currentDailyBudget;
        const absoluteDifference = Math.abs(primaryBudgetDifference);
        primaryNeedsAdjustment = !input.warningIgnoredToday && input.currentDailyBudget > 0 && absoluteDifference >= 5;
        
        console.log(`🔍 DEBUG - Usando método tradicional:`, {
          idealDailyBudget,
          currentDailyBudget: input.currentDailyBudget,
          budgetDifference: primaryBudgetDifference,
          absoluteDifference,
          warningIgnoredToday: input.warningIgnoredToday,
          needsAdjustment: primaryNeedsAdjustment,
          threshold: '≥ R$ 5'
        });
      }
      
      // Cálculos adicionais para compatibilidade
      const budgetDifferenceBasedOnAverage = input.lastFiveDaysAverage !== undefined && input.lastFiveDaysAverage > 0
        ? idealDailyBudget - input.lastFiveDaysAverage
        : undefined;
      
      const needsAdjustmentBasedOnAverage = budgetDifferenceBasedOnAverage !== undefined
        ? !input.warningIgnoredToday && Math.abs(budgetDifferenceBasedOnAverage) >= 5
        : undefined;
      
      // CORREÇÃO: Garantir que needsAdjustmentBasedOnWeighted seja calculado corretamente
      const budgetDifferenceBasedOnWeighted = input.weightedAverage !== undefined && input.weightedAverage > 0
        ? idealDailyBudget - input.weightedAverage
        : undefined;
      
      const needsAdjustmentBasedOnWeighted = budgetDifferenceBasedOnWeighted !== undefined
        ? !input.warningIgnoredToday && Math.abs(budgetDifferenceBasedOnWeighted) >= 5
        : undefined;
      
      // LOG DETALHADO para debugging
      console.log(`🔍 DEBUG FINAL - Resultado do cálculo:`, {
        idealDailyBudget,
        primaryBudgetDifference,
        primaryNeedsAdjustment,
        budgetDifferenceBasedOnWeighted,
        needsAdjustmentBasedOnWeighted,
        warningIgnoredToday: input.warningIgnoredToday,
        usingCustomBudget: input.usingCustomBudget,
        customBudgetPeriod: (input.customBudgetStartDate && input.customBudgetEndDate) ? `${input.customBudgetStartDate} - ${input.customBudgetEndDate}` : 'N/A',
        remainingDays: remainingDays,
        input: {
          monthlyBudget: input.monthlyBudget,
          customBudgetAmount: input.customBudgetAmount,
          actualBudget,
          totalSpent: input.totalSpent,
          weightedAverage: input.weightedAverage,
          currentDailyBudget: input.currentDailyBudget
        }
      });
      
      return {
        idealDailyBudget,
        budgetDifference: primaryBudgetDifference,
        budgetDifferenceBasedOnAverage,
        budgetDifferenceBasedOnWeighted,
        remainingDays,
        remainingBudget,
        needsBudgetAdjustment: primaryNeedsAdjustment,
        needsAdjustmentBasedOnAverage,
        needsAdjustmentBasedOnWeighted,
        spentPercentage,
        warningIgnoredToday: input.warningIgnoredToday || false
      };
    };
  }, []);
  
  return { calculateBudget };
}
