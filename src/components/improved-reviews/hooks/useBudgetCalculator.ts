
import { useState } from 'react';
import { formatCurrency } from '@/utils/formatters';
import { getCurrentDateInBrasiliaTz } from '@/components/daily-reviews/summary/utils';
import { getDaysInMonth } from 'date-fns';

interface BudgetCalculationParams {
  monthlyBudget: number;
  totalSpent: number;
  currentDailyBudget: number;
  lastFiveDaysAverage?: number; // Média de gasto dos últimos 5 dias (opcional, para Google Ads)
}

interface BudgetCalculationResult {
  remainingBudget: number;
  remainingDays: number;
  idealDailyBudget: number;
  budgetDifference: number;
  needsBudgetAdjustment: boolean;
  
  // Campos específicos para Google Ads
  lastFiveDaysAverage?: number;
  idealDailyBudgetBasedOnAverage?: number;
  budgetDifferenceBasedOnAverage?: number;
  needsAdjustmentBasedOnAverage?: boolean;
}

export function useBudgetCalculator() {
  const calculateBudget = ({
    monthlyBudget,
    totalSpent,
    currentDailyBudget,
    lastFiveDaysAverage
  }: BudgetCalculationParams): BudgetCalculationResult => {
    // Log para debug
    console.log(`Calculando orçamento: orçamento mensal = ${formatCurrency(monthlyBudget)}, gasto = ${formatCurrency(totalSpent)}, orçamento diário atual = ${formatCurrency(currentDailyBudget)}, média 5 dias = ${lastFiveDaysAverage ? formatCurrency(lastFiveDaysAverage) : 'N/A'}`);
    console.log(`Está usando orçamento personalizado? ${monthlyBudget !== 0 ? 'Sim, com valor: ' + formatCurrency(monthlyBudget) : 'Não'}`);
    
    // Obter data atual e calcular dias restantes no mês
    const today = getCurrentDateInBrasiliaTz();
    const daysInMonth = getDaysInMonth(today);
    const currentDay = today.getDate();
    // Incluir o dia atual na contagem de dias restantes
    const remainingDays = daysInMonth - currentDay + 1;
    
    // Calcular orçamento restante
    const remainingBudget = Math.max(0, monthlyBudget - totalSpent);
    
    // Calcular orçamento diário ideal baseado no orçamento restante
    const idealDailyBudget = remainingDays > 0 ? remainingBudget / remainingDays : 0;
    
    // Diferença entre orçamento diário ideal e atual
    const budgetDifference = Math.round((idealDailyBudget - currentDailyBudget) * 100) / 100;
    
    // Determinar se precisa de ajuste (limiar de 5.00)
    const needsBudgetAdjustment = Math.abs(budgetDifference) > 5;
    
    // Resultado básico da calculadora de orçamento
    const result: BudgetCalculationResult = {
      remainingBudget,
      remainingDays,
      idealDailyBudget,
      budgetDifference,
      needsBudgetAdjustment
    };
    
    // Cálculos adicionais específicos para Google Ads, baseados na média dos últimos 5 dias
    if (lastFiveDaysAverage !== undefined && lastFiveDaysAverage > 0) {
      // Calcular quanto tempo o orçamento restante duraria com o gasto médio atual
      const daysRemainingWithCurrentSpending = remainingBudget / lastFiveDaysAverage;
      
      // Calcular se o orçamento diário precisa ser ajustado com base na média de gasto
      const idealDailyBudgetBasedOnAverage = 
        daysRemainingWithCurrentSpending < remainingDays 
          ? lastFiveDaysAverage * (remainingDays / daysRemainingWithCurrentSpending) 
          : lastFiveDaysAverage;
      
      // Diferença entre orçamento baseado em média e orçamento diário atual
      const budgetDifferenceBasedOnAverage = Math.round((idealDailyBudgetBasedOnAverage - currentDailyBudget) * 100) / 100;
      
      // Determinar se precisa de ajuste baseado na média (limiar de 5.00)
      const needsAdjustmentBasedOnAverage = Math.abs(budgetDifferenceBasedOnAverage) > 5;
      
      // Adicionar dados específicos do Google Ads ao resultado
      result.lastFiveDaysAverage = lastFiveDaysAverage;
      result.idealDailyBudgetBasedOnAverage = idealDailyBudgetBasedOnAverage;
      result.budgetDifferenceBasedOnAverage = budgetDifferenceBasedOnAverage;
      result.needsAdjustmentBasedOnAverage = needsAdjustmentBasedOnAverage;
    }
    
    return result;
  };
  
  return { calculateBudget };
}
