
import { useMemo } from "react";
import { ClientWithReview, GoogleAccount } from "./types/reviewTypes";

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
  
  // Para total gasto e orçamento diário atual, precisamos usar os valores da revisão
  // Se o cliente tiver múltiplas contas, precisamos agregar os valores
  const totalSpent = useMemo(() => {
    if (!hasReview) return 0;
    
    // Se tivermos uma revisão específica para uma conta
    if (client.lastReview?.client_account_id) {
      return client.lastReview?.google_total_spent || 0;
    }
    
    // Se temos várias revisões para diferentes contas, precisamos somar
    if (client.google_reviews && client.google_reviews.length > 0) {
      // Verificar se são revisões do mês atual
      const currentDate = new Date();
      const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      
      return client.google_reviews
        .filter(review => {
          // Considerar apenas revisões do mês atual
          const reviewDate = review.review_date ? new Date(review.review_date) : null;
          return reviewDate && reviewDate >= firstDayOfMonth;
        })
        .reduce((sum, review) => {
          return sum + (review.google_total_spent || 0);
        }, 0);
    }
    
    return client.lastReview?.google_total_spent || 0;
  }, [hasReview, client.lastReview, client.google_reviews]);
  
  const lastFiveDaysSpent = useMemo(() => {
    if (!hasReview) return 0;
    
    // Se tivermos uma revisão específica para uma conta
    if (client.lastReview?.client_account_id) {
      return client.lastReview?.google_last_five_days_spent || 0;
    }
    
    // Se temos várias revisões para diferentes contas, precisamos somar
    if (client.google_reviews && client.google_reviews.length > 0) {
      // Verificar se são revisões do mês atual
      const currentDate = new Date();
      const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      
      return client.google_reviews
        .filter(review => {
          // Considerar apenas revisões do mês atual
          const reviewDate = review.review_date ? new Date(review.review_date) : null;
          return reviewDate && reviewDate >= firstDayOfMonth;
        })
        .reduce((sum, review) => {
          return sum + (review.google_last_five_days_spent || 0);
        }, 0);
    }
    
    return client.lastReview?.google_last_five_days_spent || 0;
  }, [hasReview, client.lastReview, client.google_reviews]);
  
  const currentDailyBudget = useMemo(() => {
    if (!hasReview) return 0;
    
    // Se tivermos uma revisão específica para uma conta
    if (client.lastReview?.client_account_id) {
      return client.lastReview?.google_daily_budget_current || 0;
    }
    
    // Se temos várias revisões para diferentes contas, precisamos somar
    if (client.google_reviews && client.google_reviews.length > 0) {
      // Verificar se são revisões do mês atual
      const currentDate = new Date();
      const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      
      return client.google_reviews
        .filter(review => {
          // Considerar apenas revisões do mês atual
          const reviewDate = review.review_date ? new Date(review.review_date) : null;
          return reviewDate && reviewDate >= firstDayOfMonth;
        })
        .reduce((sum, review) => {
          return sum + (review.google_daily_budget_current || 0);
        }, 0);
    }
    
    return client.lastReview?.google_daily_budget_current || 0;
  }, [hasReview, client.lastReview, client.google_reviews]);
  
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
  
  // Calcular a diferença entre a média dos últimos 5 dias e o ideal
  const budgetDifferenceBasedOnAverage = useMemo(() => {
    if (!hasReview || lastFiveDaysSpent === 0) return 0;
    
    return idealDailyBudget - lastFiveDaysSpent;
  }, [hasReview, idealDailyBudget, lastFiveDaysSpent]);
  
  // Determinar se o orçamento precisa de ajuste baseado no orçamento atual
  const needsBudgetAdjustment = useMemo(() => {
    if (!hasReview || currentDailyBudget === 0) return false;
    
    // Verifica se a diferença é maior que 5 reais ou 5% do orçamento atual
    const absoluteDifference = Math.abs(budgetDifference);
    const percentageDifference = absoluteDifference / currentDailyBudget;
    
    // Alterado para usar OU (||) em vez de E (&&)
    return absoluteDifference >= 5 || percentageDifference >= 0.05;
  }, [hasReview, budgetDifference, currentDailyBudget]);
  
  // Determinar se o orçamento precisa de ajuste baseado na média de gasto
  const needsAdjustmentBasedOnAverage = useMemo(() => {
    if (!hasReview || lastFiveDaysSpent === 0) return false;
    
    // Verifica se a diferença é maior que 5 reais ou 5% da média
    const absoluteDifference = Math.abs(budgetDifferenceBasedOnAverage);
    const percentageDifference = lastFiveDaysSpent > 0 ? absoluteDifference / lastFiveDaysSpent : 0;
    
    // Alterado para usar OU (||) em vez de E (&&)
    return absoluteDifference >= 5 || percentageDifference >= 0.05;
  }, [hasReview, budgetDifferenceBasedOnAverage, lastFiveDaysSpent]);

  console.log(`[DEBUG] Cliente: ${client.company_name} - lastFiveDaysSpent: ${lastFiveDaysSpent}, budgetDifferenceBasedOnAverage: ${budgetDifferenceBasedOnAverage}, needsAdjustmentBasedOnAverage: ${needsAdjustmentBasedOnAverage}`);
  
  return {
    hasReview,
    isCalculating: false,
    monthlyBudget,
    totalSpent,
    lastFiveDaysSpent,
    currentDailyBudget,
    idealDailyBudget,
    budgetDifference,
    budgetDifferenceBasedOnAverage,
    remainingDaysValue: remainingDays,
    remainingBudget,
    needsBudgetAdjustment,
    needsAdjustmentBasedOnAverage
  };
};
