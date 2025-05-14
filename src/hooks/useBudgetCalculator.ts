
import { useCallback } from 'react';
import { getDaysInMonth } from 'date-fns';

interface BudgetCalculatorProps {
  monthlyBudget: number;
  totalSpent: number;
  currentDailyBudget: number | null;
  usingCustomBudget?: boolean;
  customBudgetAmount?: number | null;
  customBudgetEndDate?: string | null;
}

interface BudgetCalculation {
  idealDailyBudget: number;
  suggestedChange: number;
  needsBudgetAdjustment: boolean;
  remainingBudget: number;
  remainingDays: number;
  spentPercentage: number;
}

export function useBudgetCalculator() {
  const calculateBudget = useCallback((props: BudgetCalculatorProps): BudgetCalculation => {
    const { 
      monthlyBudget, 
      totalSpent, 
      currentDailyBudget, 
      usingCustomBudget,
      customBudgetAmount,
      customBudgetEndDate
    } = props;
    
    // Definir o orçamento efetivo (mensal regular ou personalizado)
    const effectiveBudgetAmount = usingCustomBudget && customBudgetAmount 
      ? customBudgetAmount 
      : monthlyBudget;
    
    // Calcular o orçamento restante
    const remainingBudget = Math.max(0, effectiveBudgetAmount - totalSpent);
    
    // Calcular os dias restantes
    let remainingDays;
    
    if (usingCustomBudget && customBudgetEndDate) {
      // Calcular dias restantes até a data final do orçamento personalizado
      const today = new Date();
      const endDate = new Date(customBudgetEndDate);
      
      // Adicionar 1 para incluir o dia atual
      remainingDays = Math.max(1, Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) + 1);
    } else {
      // Calcular dias restantes no mês atual
      const today = new Date();
      const currentDay = today.getDate();
      const totalDaysInMonth = getDaysInMonth(today);
      
      // Dias restantes incluindo o dia atual
      remainingDays = totalDaysInMonth - currentDay + 1;
    }
    
    // Calcular o orçamento diário ideal
    const idealDailyBudget = remainingDays > 0 
      ? Math.max(0, remainingBudget / remainingDays)
      : 0;
    
    // Calcular a mudança sugerida
    const actualCurrentDaily = currentDailyBudget || 0;
    const suggestedChange = idealDailyBudget - actualCurrentDaily;
    
    // Determinar se é necessário ajustar o orçamento
    // Consideramos um ajuste necessário se a diferença for maior que 10%
    const needsAdjustment = actualCurrentDaily > 0 
      ? Math.abs(suggestedChange / actualCurrentDaily) > 0.1
      : idealDailyBudget > 0;
      
    // Calcular percentual gasto
    const spentPercentage = effectiveBudgetAmount > 0 
      ? (totalSpent / effectiveBudgetAmount) * 100
      : 0;
    
    return {
      idealDailyBudget,
      suggestedChange,
      needsBudgetAdjustment: needsAdjustment,
      remainingBudget,
      remainingDays,
      spentPercentage
    };
  }, []);
  
  return { calculateBudget };
}
