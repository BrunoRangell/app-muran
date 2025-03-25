
import { useMemo } from "react";
import { getRemainingDaysInMonth } from "../summary/utils";
import { ClientWithReview } from "./types/reviewTypes";

export const useClientBudgetCalculation = (client: ClientWithReview, accountIdField = "meta_account_id") => {
  // Determinar o tipo de orçamento a ser usado
  const monthlyBudgetField = accountIdField === "meta_account_id" ? "meta_ads_budget" : "google_ads_budget";
  const dailyBudgetField = accountIdField === "meta_account_id" 
    ? "meta_daily_budget_current" 
    : "google_ads_daily_budget_current";
  const totalSpentField = accountIdField === "meta_account_id" 
    ? "meta_total_spent" 
    : "google_ads_total_spent";
  
  const calculationResults = useMemo(() => {
    // Verificar se temos um review
    const hasReview = !!client.lastReview;
    const isCustomBudget = hasReview && client.lastReview?.using_custom_budget;
    
    // Obter o valor do orçamento mensal, quer seja personalizado ou padrão
    let monthlyBudget = 0;
    if (isCustomBudget && client.lastReview?.custom_budget_amount) {
      monthlyBudget = client.lastReview.custom_budget_amount;
    } else {
      monthlyBudget = client[monthlyBudgetField] || 0;
    }
    
    // Verificar se temos dados de gasto e orçamento diário
    // Se não, retornar valores default
    if (!hasReview) {
      return {
        hasReview,
        isCalculating: false,
        calculationError: null,
        monthlyBudget,
        totalSpent: 0,
        currentDailyBudget: 0,
        idealDailyBudget: 0,
        budgetDifference: 0,
        isCustomBudget
      };
    }
    
    // Calcular os valores reais de gasto e orçamento diário
    const totalSpent = parseFloat(client.lastReview[totalSpentField]?.toString() || "0");
    const currentDailyBudget = parseFloat(client.lastReview[dailyBudgetField]?.toString() || "0");
    
    // Calcular o orçamento diário ideal baseado no restante do orçamento
    // e nos dias restantes no mês
    const remainingDays = getRemainingDaysInMonth();
    const remainingBudget = Math.max(0, monthlyBudget - totalSpent);
    const idealDailyBudget = parseFloat((remainingBudget / Math.max(1, remainingDays)).toFixed(2));
    
    // Calcular a diferença percentual
    let budgetDifference = 0;
    if (currentDailyBudget > 0 && idealDailyBudget > 0) {
      budgetDifference = parseFloat(
        (((idealDailyBudget - currentDailyBudget) / currentDailyBudget) * 100).toFixed(0)
      );
    }
    
    return {
      hasReview,
      isCalculating: false,
      calculationError: null,
      monthlyBudget,
      totalSpent,
      currentDailyBudget,
      idealDailyBudget,
      budgetDifference,
      isCustomBudget
    };
  }, [client, monthlyBudgetField, dailyBudgetField, totalSpentField]);
  
  return calculationResults;
};
