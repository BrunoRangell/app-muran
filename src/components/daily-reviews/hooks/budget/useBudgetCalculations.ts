
import { getCurrentDateInBrasiliaTz, getRemainingDaysInMonth } from "../../summary/utils";
import { ClientWithReview } from "../types/reviewTypes";

/**
 * Hook com utilitários para cálculos de orçamento
 */
export const useBudgetCalculations = (
  client: ClientWithReview, 
  customBudget: any | null, 
  isUsingCustomBudgetInReview: boolean,
  hasReview: boolean
) => {
  const monthlyBudget = client.meta_ads_budget || 0;
  const totalSpentFromDB = hasReview ? (client.lastReview?.meta_total_spent || 0) : 0;
  
  // Usar o valor do banco de dados para o total gasto
  const totalSpent = totalSpentFromDB;
  
  // Determinar se está usando orçamento personalizado
  const isUsingCustomBudget = isUsingCustomBudgetInReview || !!customBudget;
  
  // Obter o orçamento correto com base no tipo (personalizado ou padrão)
  const getBudgetAmount = () => {
    // Se está usando orçamento personalizado, SOMENTE ele deve ser considerado
    if (isUsingCustomBudget) {
      // Se está usando orçamento personalizado na revisão, priorizar esse valor
      if (isUsingCustomBudgetInReview && client.lastReview?.custom_budget_amount) {
        console.log("Usando orçamento personalizado da revisão:", client.lastReview.custom_budget_amount);
        return client.lastReview.custom_budget_amount;
      }
      
      // Se há um orçamento personalizado ativo, usar ele
      if (customBudget) {
        console.log("Usando orçamento personalizado:", customBudget.budget_amount);
        return customBudget.budget_amount;
      }
    }
    
    // Somente usar o orçamento mensal padrão se não existir orçamento personalizado
    console.log("Usando orçamento mensal padrão:", monthlyBudget);
    return monthlyBudget;
  };

  // Obter dias restantes com base no tipo de orçamento
  const getRemainingDays = () => {
    // Se está usando orçamento personalizado
    if (isUsingCustomBudget) {
      // Usar dados do objeto customBudget se disponível
      if (customBudget) {
        // Para orçamento personalizado, contar os dias entre hoje e a data de término
        const today = getCurrentDateInBrasiliaTz();
        const endDate = new Date(customBudget.end_date);
        
        // +1 para incluir o dia atual
        const diffTime = endDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        
        // Garantir que retorne pelo menos 1 dia (hoje)
        return Math.max(1, diffDays);
      }
    }
    
    // Para orçamento regular, usar a função padrão
    return getRemainingDaysInMonth();
  };
  
  // Calcular orçamento restante
  const getBudgetRemaining = () => {
    const budgetAmount = getBudgetAmount();
    return budgetAmount - totalSpent;
  };
  
  // Calcular orçamento diário ideal
  const getDailyBudgetIdeal = () => {
    const remaining = getBudgetRemaining();
    const days = getRemainingDays();
    
    return days > 0 ? remaining / days : 0;
  };
  
  const remainingBudget = getBudgetRemaining();
  const remainingDays = getRemainingDays();
  const idealDailyBudget = getDailyBudgetIdeal();
  const actualBudgetAmount = getBudgetAmount();
  
  // Verificar se o cliente tem valor de orçamento diário atual
  const currentDailyBudget = hasReview && client.lastReview?.meta_daily_budget_current !== null
    ? client.lastReview.meta_daily_budget_current
    : 0;

  // Gerar recomendação com base nos orçamentos
  const budgetDifference = idealDailyBudget - currentDailyBudget;
  
  // Verificar se o cliente precisa de ajuste de orçamento significativo
  const needsBudgetAdjustment = hasReview && Math.abs(budgetDifference) >= 5;
  
  return {
    monthlyBudget,
    totalSpent,
    currentDailyBudget,
    idealDailyBudget,
    budgetDifference,
    remainingBudget,
    remainingDays,
    actualBudgetAmount,
    needsBudgetAdjustment,
    isUsingCustomBudget
  };
};
