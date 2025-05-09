
import { useMemo } from "react";

type BudgetInput = {
  monthlyBudget: number;
  totalSpent: number;
  currentDailyBudget: number;
  lastFiveDaysAverage?: number;
  customBudgetAmount?: number | null;
  customBudgetStartDate?: string | null;
  customBudgetEndDate?: string | null;
  isUsingCustomBudget?: boolean;
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
  isUsingCustomBudget: boolean;
  customBudgetDetails?: {
    amount: number;
    startDate?: string;
    endDate?: string;
  } | null;
};

export function useBudgetCalculator() {
  const calculateBudget = useMemo(() => {
    return (input: BudgetInput): BudgetCalculation => {
      const today = new Date();
      
      // Determinar se está usando orçamento personalizado
      const isUsingCustomBudget = input.isUsingCustomBudget || !!input.customBudgetAmount;
      
      // Se estiver usando orçamento personalizado, calcular dias restantes com base no período específico
      let remainingDays = 0;
      if (isUsingCustomBudget && input.customBudgetEndDate) {
        const endDate = new Date(input.customBudgetEndDate);
        // Calcular diferença de dias entre hoje e a data final (+1 para incluir o dia atual)
        const timeDiff = endDate.getTime() - today.getTime();
        remainingDays = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1;
        
        // Garantir que temos pelo menos 1 dia
        remainingDays = Math.max(1, remainingDays);
      } else {
        // Se não for orçamento personalizado, usar dias restantes do mês
        const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        remainingDays = lastDayOfMonth.getDate() - today.getDate() + 1;
      }
      
      // Determinar o orçamento a ser usado (personalizado ou mensal)
      const effectiveBudget = isUsingCustomBudget && input.customBudgetAmount 
        ? input.customBudgetAmount 
        : input.monthlyBudget;
      
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
      
      // Apenas diferença absoluta >= R$5 determina necessidade de ajuste
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
        
        // Apenas diferença absoluta >= R$5 determina necessidade de ajuste
        needsAdjustmentBasedOnAverage = absoluteDifferenceAverage >= 5;
      }
      
      // Construir detalhes do orçamento personalizado se aplicável
      const customBudgetDetails = isUsingCustomBudget ? {
        amount: input.customBudgetAmount || 0,
        startDate: input.customBudgetStartDate || undefined,
        endDate: input.customBudgetEndDate || undefined
      } : null;
      
      console.log(`[DEBUG] Budget Calculator - Custom Budget: ${isUsingCustomBudget}, Amount: ${input.customBudgetAmount}, Dias restantes: ${remainingDays}, Orçamento diário ideal: ${roundedIdealDailyBudget}`);
      
      return {
        idealDailyBudget: roundedIdealDailyBudget,
        budgetDifference,
        budgetDifferenceBasedOnAverage,
        remainingDays,
        remainingBudget,
        needsBudgetAdjustment,
        needsAdjustmentBasedOnAverage,
        spentPercentage,
        isUsingCustomBudget,
        customBudgetDetails
      };
    };
  }, []);
  
  return { calculateBudget };
}
