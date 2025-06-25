
import { useMemo } from "react";

interface BudgetCalculationParams {
  monthlyBudget: number;
  totalSpent: number;
  currentDailyBudget?: number;
  customBudgetEndDate?: string | null;
  warningIgnoredToday?: boolean; // NOVO PARÂMETRO
}

interface BudgetCalculation {
  idealDailyBudget: number;
  budgetDifference: number;
  remainingDays: number;
  remainingBudget: number;
  needsBudgetAdjustment: boolean;
  spentPercentage: number;
  warningIgnoredToday?: boolean; // INCLUIR NO RESULTADO
}

export const useBudgetCalculator = () => {
  const calculateBudget = useMemo(() => {
    return ({
      monthlyBudget,
      totalSpent,
      currentDailyBudget = 0,
      customBudgetEndDate = null,
      warningIgnoredToday = false // NOVO PARÂMETRO COM DEFAULT
    }: BudgetCalculationParams): BudgetCalculation => {
      try {
        const currentDate = new Date();
        let endDate: Date;
        
        // Determinar data de fim (orçamento personalizado ou fim do mês)
        if (customBudgetEndDate) {
          endDate = new Date(customBudgetEndDate);
          console.log(`🔍 DEBUG - useBudgetCalculator: usando customBudgetEndDate = ${customBudgetEndDate}`);
        } else {
          endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
          console.log(`🔍 DEBUG - useBudgetCalculator: usando fim do mês = ${endDate.toISOString().split('T')[0]}`);
        }
        
        // Calcular dias restantes (incluindo hoje)
        const remainingDays = Math.max(0, Math.ceil((endDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24)) + 1);
        
        // Calcular orçamento restante
        const remainingBudget = Math.max(0, monthlyBudget - totalSpent);
        
        // Calcular orçamento diário ideal
        const idealDailyBudget = remainingDays > 0 ? remainingBudget / remainingDays : 0;
        
        // Calcular diferença do orçamento atual
        const budgetDifference = idealDailyBudget - currentDailyBudget;
        
        // Calcular porcentagem gasta
        const spentPercentage = monthlyBudget > 0 ? (totalSpent / monthlyBudget) * 100 : 0;
        
        // LÓGICA ATUALIZADA: Considerar warnings ignorados
        // Se o warning foi ignorado hoje, não precisa de ajuste
        const needsBudgetAdjustment = warningIgnoredToday 
          ? false 
          : Math.abs(budgetDifference) >= 5;
        
        console.log(`📊 Cálculo de orçamento:`, {
          monthlyBudget,
          totalSpent,
          currentDailyBudget,
          idealDailyBudget,
          budgetDifference,
          remainingDays,
          remainingBudget,
          spentPercentage,
          needsBudgetAdjustment,
          warningIgnoredToday, // LOG
          customBudgetEndDate
        });
        
        return {
          idealDailyBudget,
          budgetDifference,
          remainingDays,
          remainingBudget,
          needsBudgetAdjustment,
          spentPercentage,
          warningIgnoredToday // INCLUIR NO RESULTADO
        };
      } catch (error) {
        console.error("Erro no cálculo de orçamento:", error);
        return {
          idealDailyBudget: 0,
          budgetDifference: 0,
          remainingDays: 0,
          remainingBudget: 0,
          needsBudgetAdjustment: false,
          spentPercentage: 0,
          warningIgnoredToday: false
        };
      }
    };
  }, []);

  return { calculateBudget };
};
