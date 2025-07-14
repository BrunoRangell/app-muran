
import { useMemo } from "react";
import { calculateIdealDailyBudget, calculateRemainingDays } from "@/utils/budgetCalculations";

interface BudgetRecommendationResult {
  recommendation: string;
  idealDailyBudget: number;
  suggestedBudgetChange: number;
  remainingDays: number;
  remainingBudget: number;
}

export const useClientBudgetRecommendation = (
  monthlyBudget?: number,
  totalSpent?: number,
  currentDailyBudget?: number,
  customBudgetAmount?: number,
  customBudgetStartDate?: string,
  customBudgetEndDate?: string,
  usingCustomBudget?: boolean
): BudgetRecommendationResult => {
  
  return useMemo(() => {
    // Determinar qual orçamento usar
    const actualBudget = usingCustomBudget && customBudgetAmount 
      ? customBudgetAmount 
      : (monthlyBudget || 0);
    
    const spent = totalSpent || 0;
    const dailyBudget = currentDailyBudget || 0;
    
    // Calcular dias restantes baseado no tipo de orçamento
    const remainingDays = usingCustomBudget 
      ? calculateRemainingDays(customBudgetEndDate, customBudgetStartDate)
      : calculateRemainingDays();
    
    // Calcular orçamento diário ideal
    const idealDailyBudget = calculateIdealDailyBudget(
      actualBudget,
      spent,
      usingCustomBudget ? customBudgetEndDate : undefined,
      usingCustomBudget ? customBudgetStartDate : undefined
    );
    
    const remainingBudget = Math.max(0, actualBudget - spent);
    const suggestedBudgetChange = idealDailyBudget - dailyBudget;
    
    // Gerar recomendação
    let recommendation = "Orçamento adequado";
    
    if (Math.abs(suggestedBudgetChange) >= 5) {
      if (suggestedBudgetChange > 0) {
        recommendation = `Recomendado aumentar orçamento diário em ${Math.abs(suggestedBudgetChange).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`;
      } else {
        recommendation = `Recomendado reduzir orçamento diário em ${Math.abs(suggestedBudgetChange).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`;
      }
    }
    
    console.log(`🔍 DEBUG - Recomendação de orçamento:`, {
      actualBudget,
      spent,
      usingCustomBudget,
      customBudgetPeriod: usingCustomBudget ? `${customBudgetStartDate} - ${customBudgetEndDate}` : 'N/A',
      remainingDays,
      idealDailyBudget,
      currentDailyBudget: dailyBudget,
      suggestedChange: suggestedBudgetChange,
      recommendation
    });
    
    return {
      recommendation,
      idealDailyBudget,
      suggestedBudgetChange,
      remainingDays,
      remainingBudget
    };
  }, [
    monthlyBudget,
    totalSpent,
    currentDailyBudget,
    customBudgetAmount,
    customBudgetStartDate,
    customBudgetEndDate,
    usingCustomBudget
  ]);
};
