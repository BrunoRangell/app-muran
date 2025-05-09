
import { useState } from "react";

interface BudgetCalculatorOptions {
  monthlyBudget: number;
  totalSpent: number;
  currentDailyBudget: number;
  lastFiveDaysAverage?: number;
}

interface BudgetCalculation {
  idealDailyBudget: number;
  budgetDifference: number;
  needsBudgetAdjustment: boolean;
  needsAdjustmentBasedOnAverage?: boolean;
  dailyBudgetRecommendation: number;
  spentPercentage: number;
  remainingBudget: number;
  remainingDays: number;
}

export const useBudgetCalculator = () => {
  const [calculation, setCalculation] = useState<BudgetCalculation | null>(null);

  const calculateBudget = ({
    monthlyBudget,
    totalSpent,
    currentDailyBudget,
    lastFiveDaysAverage = 0
  }: BudgetCalculatorOptions): BudgetCalculation => {
    // Calcular dias restantes no mês
    const today = new Date();
    const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    const remainingDays = lastDayOfMonth.getDate() - today.getDate() + 1;
    
    // Calcular orçamento restante
    const remainingBudget = Math.max(0, monthlyBudget - totalSpent);
    
    // Calcular orçamento diário ideal
    const idealDailyBudget = remainingDays > 0 ? remainingBudget / remainingDays : 0;
    
    // Calcular diferença entre orçamento atual e ideal
    const budgetDifference = idealDailyBudget - currentDailyBudget;
    
    // Verificar se o orçamento precisa de ajuste (diferença de 5 ou mais)
    const needsBudgetAdjustment = Math.abs(budgetDifference) >= 5;
    
    // Verificar se precisa de ajuste baseado na média dos últimos 5 dias
    const needsAdjustmentBasedOnAverage = 
      lastFiveDaysAverage > 0 && 
      Math.abs(lastFiveDaysAverage - idealDailyBudget) >= 5;

    // Calcular porcentagem gasta do orçamento
    const spentPercentage = monthlyBudget > 0 ? (totalSpent / monthlyBudget) * 100 : 0;
    
    // Determinar a recomendação final de orçamento diário
    let dailyBudgetRecommendation = idealDailyBudget;
    
    // Se estamos no final do mês (menos de 5 dias) e há orçamento sobrando, podemos ser mais agressivos
    if (remainingDays <= 5 && remainingBudget > 0) {
      dailyBudgetRecommendation = Math.max(dailyBudgetRecommendation, remainingBudget / remainingDays);
    }
    
    // Arredondar valores para duas casas decimais para melhor apresentação
    const result = {
      idealDailyBudget: Math.round(idealDailyBudget * 100) / 100,
      budgetDifference: Math.round(budgetDifference * 100) / 100,
      needsBudgetAdjustment,
      needsAdjustmentBasedOnAverage,
      dailyBudgetRecommendation: Math.round(dailyBudgetRecommendation * 100) / 100,
      spentPercentage: Math.round(spentPercentage * 100) / 100,
      remainingBudget: Math.round(remainingBudget * 100) / 100,
      remainingDays
    };
    
    setCalculation(result);
    return result;
  };

  return {
    calculation,
    calculateBudget
  };
};
