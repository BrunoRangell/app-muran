
import { useState, useEffect } from "react";
import { getDaysInMonth } from 'date-fns';
import { getCurrentDateInBrasiliaTz } from "../summary/utils";
import { BudgetInfo } from "./types/budgetTypes";

/**
 * Hook para calcular recomendações de orçamento
 */
export const useClientBudgetRecommendation = (
  clientBudget: number | null | undefined,
  totalSpent: number | null | undefined,
  currentDailyBudget: number | null | undefined,
  customBudgetAmount?: number | null,
  customBudgetEndDate?: string | null,
  usingCustomBudget: boolean = false
) => {
  const [recommendation, setRecommendation] = useState<string | null>(null);
  const [idealDailyBudget, setIdealDailyBudget] = useState<number | null>(null);
  const [suggestedBudgetChange, setSuggestedBudgetChange] = useState<number | null>(null);
  const [remainingDays, setRemainingDays] = useState<number | null>(null);
  const [remainingBudget, setRemainingBudget] = useState<number | null>(null);
  
  useEffect(() => {
    if ((clientBudget || customBudgetAmount) && 
        totalSpent !== undefined && totalSpent !== null && 
        currentDailyBudget !== undefined && currentDailyBudget !== null) {
      try {
        // Data atual para o cálculo (usando fuso horário de Brasília)
        const saoPauloDate = getCurrentDateInBrasiliaTz();
        
        console.log("Data atual utilizada para cálculo (São Paulo):", saoPauloDate.toLocaleDateString('pt-BR'));
        
        // Determinar qual orçamento usar (personalizado ou mensal)
        const effectiveBudget = usingCustomBudget && customBudgetAmount ? 
          Number(customBudgetAmount) : 
          Number(clientBudget || 0);
          
        const totalSpentValue = Number(totalSpent);
        const currentDailyBudgetValue = Number(currentDailyBudget);
        
        console.log("Orçamento efetivo usado:", effectiveBudget);
        console.log("Usando orçamento personalizado:", usingCustomBudget);
        console.log("Total gasto até agora:", totalSpentValue);
        console.log("Orçamento diário atual:", currentDailyBudgetValue);
        
        // Calculando dias restantes
        let remainingDaysValue;
        
        if (usingCustomBudget && customBudgetEndDate) {
          // Se for orçamento personalizado, calcular dias até a data final
          const endDate = new Date(customBudgetEndDate);
          const diffTime = endDate.getTime() - saoPauloDate.getTime();
          remainingDaysValue = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          console.log("Dias restantes até o fim do orçamento personalizado:", remainingDaysValue);
        } else {
          // Caso contrário, calcular dias restantes no mês
          const daysInMonth = getDaysInMonth(saoPauloDate);
          const currentDay = saoPauloDate.getDate();
          remainingDaysValue = daysInMonth - currentDay + 1;
          console.log("Dias restantes no mês:", remainingDaysValue);
        }
        
        setRemainingDays(remainingDaysValue);
        
        // Calcular orçamento restante
        const remainingBudgetValue = effectiveBudget - totalSpentValue;
        setRemainingBudget(remainingBudgetValue);
        console.log("Orçamento restante:", remainingBudgetValue);
        
        // Calcular orçamento diário ideal baseado no orçamento restante e dias restantes
        const idealDaily = remainingDaysValue > 0 ? remainingBudgetValue / remainingDaysValue : 0;
        console.log("Orçamento diário ideal calculado:", idealDaily);
        setIdealDailyBudget(idealDaily);
        
        // Calcular diferença entre orçamento atual e ideal para recomendação
        const budgetDifference = idealDaily - currentDailyBudgetValue;
        setSuggestedBudgetChange(budgetDifference);
        console.log("Diferença de orçamento:", budgetDifference);
        
        // Gerar recomendação baseada na diferença
        // Usar um threshold pequeno (R$5.00) para decidir se a mudança vale a pena
        const thresholdValue = 5.00;
        
        if (budgetDifference > thresholdValue) {
          setRecommendation(`Aumentar R$${budgetDifference.toFixed(2)}`);
        } else if (budgetDifference < -thresholdValue) {
          setRecommendation(`Diminuir R$${Math.abs(budgetDifference).toFixed(2)}`);
        } else {
          setRecommendation("Manter o orçamento diário atual");
        }
      } catch (error) {
        console.error("Erro ao calcular orçamento ideal:", error);
      }
    }
  }, [clientBudget, totalSpent, currentDailyBudget, customBudgetAmount, customBudgetEndDate, usingCustomBudget]);

  return {
    recommendation,
    idealDailyBudget,
    suggestedBudgetChange,
    remainingDays,
    remainingBudget
  };
};
