
import { useMemo } from "react";
import { CustomBudgetState } from "./types";

export const useRemainingDaysCalculation = (customBudgetState: CustomBudgetState): number => {
  const { usingCustomBudget, customBudgetEndDate } = customBudgetState;
  
  return useMemo(() => {
    if (usingCustomBudget && customBudgetEndDate) {
      // Se tiver um orçamento personalizado com data de término, calcular dias restantes até essa data
      const today = new Date();
      const endDate = new Date(customBudgetEndDate);
      const timeDiff = endDate.getTime() - today.getTime();
      return Math.max(1, Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1);
    } else {
      // Caso contrário, usar o cálculo padrão (dias restantes no mês)
      const currentDate = new Date();
      const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      return lastDayOfMonth.getDate() - currentDate.getDate() + 1;
    }
  }, [usingCustomBudget, customBudgetEndDate]);
};
