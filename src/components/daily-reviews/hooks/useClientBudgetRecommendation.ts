
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
  currentDailyBudget: number | null | undefined
) => {
  const [recommendation, setRecommendation] = useState<string | null>(null);
  const [idealDailyBudget, setIdealDailyBudget] = useState<number | null>(null);
  const [suggestedBudgetChange, setSuggestedBudgetChange] = useState<number | null>(null);
  const [remainingDays, setRemainingDays] = useState<number | null>(null);
  const [remainingBudget, setRemainingBudget] = useState<number | null>(null);
  
  useEffect(() => {
    if (clientBudget && totalSpent !== undefined && totalSpent !== null && currentDailyBudget !== undefined && currentDailyBudget !== null) {
      try {
        // Data atual para o cálculo (usando fuso horário de Brasília)
        const saoPauloDate = getCurrentDateInBrasiliaTz();
        
        console.log("Data atual utilizada para cálculo (São Paulo):", saoPauloDate.toLocaleDateString('pt-BR'));
        
        // Obter valores do orçamento e gastos
        const monthlyBudget = Number(clientBudget);
        const totalSpentValue = Number(totalSpent);
        const currentDailyBudgetValue = Number(currentDailyBudget);
        
        console.log("Orçamento mensal do cliente:", monthlyBudget);
        console.log("Total gasto até agora:", totalSpentValue);
        console.log("Orçamento diário atual:", currentDailyBudgetValue);
        
        // Calculando dias restantes no mês
        const daysInMonth = getDaysInMonth(saoPauloDate);
        const currentDay = saoPauloDate.getDate();
        const remainingDaysValue = daysInMonth - currentDay + 1; // +1 para incluir o dia atual
        setRemainingDays(remainingDaysValue);
        
        console.log("Dias no mês:", daysInMonth);
        console.log("Dia atual (São Paulo):", currentDay);
        console.log("Dias restantes:", remainingDaysValue);
        
        // Calcular orçamento restante
        const remainingBudgetValue = monthlyBudget - totalSpentValue;
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
  }, [clientBudget, totalSpent, currentDailyBudget]);

  return {
    recommendation,
    idealDailyBudget,
    suggestedBudgetChange,
    remainingDays,
    remainingBudget
  };
};
