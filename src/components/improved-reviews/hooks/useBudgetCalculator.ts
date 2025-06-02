
import { useMemo } from "react";

type BudgetInput = {
  monthlyBudget: number;
  totalSpent: number;
  currentDailyBudget: number;
  lastFiveDaysAverage?: number; // Adicionado campo para média dos últimos 5 dias
  customBudgetEndDate?: string; // Novo campo para data de fim do orçamento personalizado
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
      
      // Calcular dias restantes com base no orçamento personalizado ou mês atual
      let remainingDays;
      if (input.customBudgetEndDate) {
        // Se tem orçamento personalizado, calcular até a data de fim
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
        // Caso contrário, usar o cálculo padrão (dias restantes no mês)
        const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        remainingDays = lastDayOfMonth.getDate() - today.getDate() + 1;
        
        console.log(`🔍 DEBUG - Cálculo de dias restantes (mês atual):`, {
          today: today.toISOString().split('T')[0],
          lastDayOfMonth: lastDayOfMonth.toISOString().split('T')[0],
          remainingDays,
          calculationUsed: 'monthEnd'
        });
      }
      
      // Orçamento restante para o período (nunca negativo)
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
        
        // CORREÇÃO: Aplicar apenas o threshold de R$ 5 para consistência
        const absoluteDifferenceAverage = Math.abs(budgetDifferenceBasedOnAverage);
        needsAdjustmentBasedOnAverage = absoluteDifferenceAverage >= 5;

        console.log(`🔍 DEBUG - Ajuste baseado na média (${input.lastFiveDaysAverage}):`, {
          absoluteDifferenceAverage,
          needsAdjustmentBasedOnAverage,
          threshold: '≥ R$ 5'
        });
      }
      
      // CORREÇÃO: Aplicar apenas o threshold de R$ 5 para consistência
      const absoluteDifference = Math.abs(budgetDifference);
      const needsBudgetAdjustment = 
        input.currentDailyBudget > 0 && // só considera se tem orçamento atual
        absoluteDifference >= 5; // APENAS diferença absoluta de 5 reais

      console.log(`🔍 DEBUG - Cálculo de ajuste orçamentário:`, {
        absoluteDifference,
        needsBudgetAdjustment,
        threshold: '≥ R$ 5',
        currentDailyBudget: input.currentDailyBudget,
        idealDailyBudget: roundedIdealDailyBudget
      });
      
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
