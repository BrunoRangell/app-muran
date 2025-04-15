
import { useMemo } from "react";
import { ClientWithReview } from "./types/reviewTypes";

export const useGoogleAdsBudgetCalculation = (client: ClientWithReview) => {
  // Verificar se o cliente tem uma revisão
  const hasReview = !!client.lastReview;
  
  // Calcular o orçamento total do Google Ads somando todas as contas
  const calculateTotalGoogleBudget = () => {
    // Se não tiver contas Google configuradas, usar o valor legado
    if (!client.google_accounts || client.google_accounts.length === 0) {
      return client.google_ads_budget || 0;
    }
    
    // Caso contrário, somar o orçamento de todas as contas Google
    return client.google_accounts.reduce((sum, account) => {
      return sum + (account.budget_amount || 0);
    }, 0);
  };
  
  // Extrair valores do orçamento
  const monthlyBudget = calculateTotalGoogleBudget();
  const totalSpent = hasReview ? client.lastReview?.google_total_spent || 0 : 0;
  const lastFiveDaysSpent = hasReview ? client.lastReview?.google_last_five_days_spent || 0 : 0;
  const currentDailyBudget = hasReview ? client.lastReview?.google_daily_budget_current || 0 : 0;
  
  // Calcular orçamento diário ideal
  const currentDate = new Date();
  const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  const remainingDays = lastDayOfMonth.getDate() - currentDate.getDate() + 1;
  
  const remainingBudget = Math.max(monthlyBudget - totalSpent, 0);
  const idealDailyBudget = useMemo(() => {
    return remainingDays > 0 ? remainingBudget / remainingDays : 0;
  }, [remainingBudget, remainingDays]);
  
  // Calcular a diferença entre o orçamento diário atual e o ideal
  const budgetDifference = useMemo(() => {
    if (!hasReview || currentDailyBudget === 0) return 0;
    
    return idealDailyBudget - currentDailyBudget;
  }, [hasReview, idealDailyBudget, currentDailyBudget]);
  
  // Determinar se o orçamento precisa de ajuste
  const needsBudgetAdjustment = useMemo(() => {
    if (!hasReview || currentDailyBudget === 0) return false;
    
    // Verifica se a diferença é maior que 5 reais ou 5% do orçamento atual
    const absoluteDifference = Math.abs(budgetDifference);
    const percentageDifference = absoluteDifference / currentDailyBudget;
    
    return absoluteDifference >= 5 && percentageDifference >= 0.05;
  }, [hasReview, budgetDifference, currentDailyBudget]);
  
  return {
    hasReview,
    isCalculating: false,
    monthlyBudget,
    totalSpent,
    lastFiveDaysSpent,
    currentDailyBudget,
    idealDailyBudget,
    budgetDifference,
    remainingDaysValue: remainingDays,
    needsBudgetAdjustment
  };
};
