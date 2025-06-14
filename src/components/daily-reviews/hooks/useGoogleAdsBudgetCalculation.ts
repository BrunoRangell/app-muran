import { useMemo } from "react";
import { ClientWithReview, GoogleAccount } from "./types/reviewTypes";

export const useGoogleAdsBudgetCalculation = (client: ClientWithReview) => {
  // Verificar se o cliente tem uma revisão
  const hasReview = !!client.lastReview;
  
  // Verificar se está usando orçamento personalizado
  const usingCustomBudget = useMemo(() => {
    return hasReview && client.lastReview?.using_custom_budget === true;
  }, [hasReview, client.lastReview]);
  
  // Informações de orçamento personalizado
  const customBudgetAmount = useMemo(() => {
    return usingCustomBudget ? client.lastReview?.custom_budget_amount : null;
  }, [usingCustomBudget, client.lastReview]);
  
  const customBudgetStartDate = useMemo(() => {
    return usingCustomBudget ? client.lastReview?.custom_budget_start_date : null;
  }, [usingCustomBudget, client.lastReview]);
  
  const customBudgetEndDate = useMemo(() => {
    return usingCustomBudget ? client.lastReview?.custom_budget_end_date : null;
  }, [usingCustomBudget, client.lastReview]);
  
  // Calcular o orçamento total do Google Ads somando todas as contas
  const calculateTotalGoogleBudget = () => {
    // Se estiver usando orçamento personalizado, usar esse valor
    if (usingCustomBudget && customBudgetAmount) {
      return customBudgetAmount;
    }
    
    // Se não tiver contas Google configuradas, usar o valor legado
    if (!client.google_accounts || client.google_accounts.length === 0) {
      return client.google_ads_budget || 0;
    }
    
    // Caso contrário, somar o orçamento de todas as contas Google
    return client.google_accounts.reduce((sum, account) => {
      return sum + (account.budget_amount || 0);
    }, 0);
  };
  
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
  
  // Calcular média ponderada dos últimos 5 dias
  const weightedAverage = useMemo(() => {
    if (!hasReview || !client.lastReview) return 0;
    
    const day1 = client.lastReview.google_day_1_spent || 0; // 5 dias atrás
    const day2 = client.lastReview.google_day_2_spent || 0; // 4 dias atrás
    const day3 = client.lastReview.google_day_3_spent || 0; // 3 dias atrás
    const day4 = client.lastReview.google_day_4_spent || 0; // 2 dias atrás
    const day5 = client.lastReview.google_day_5_spent || 0; // 1 dia atrás
    
    // Fórmula da média ponderada: peso crescente para dias mais recentes
    const weightedSum = (day1 * 0.1) + (day2 * 0.15) + (day3 * 0.2) + (day4 * 0.25) + (day5 * 0.3);
    
    return weightedSum;
  }, [hasReview, client.lastReview]);
  
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
  const calculatedRemainingDays = useMemo(() => {
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
  
  const remainingBudget = Math.max(monthlyBudget - totalSpent, 0);
  
  const idealDailyBudget = useMemo(() => {
    return calculatedRemainingDays > 0 ? remainingBudget / calculatedRemainingDays : 0;
  }, [remainingBudget, calculatedRemainingDays]);
  
  // MODIFICAÇÃO: Calcular a diferença usando a média ponderada em vez do orçamento diário atual
  const budgetDifference = useMemo(() => {
    if (!hasReview || weightedAverage === 0) return 0;
    
    return idealDailyBudget - weightedAverage; // MUDANÇA: usar weightedAverage
  }, [hasReview, idealDailyBudget, weightedAverage]);
  
  const budgetDifferenceBasedOnAverage = useMemo(() => {
    if (!hasReview || lastFiveDaysSpent === 0) return 0;
    
    return idealDailyBudget - lastFiveDaysSpent;
  }, [hasReview, idealDailyBudget, lastFiveDaysSpent]);
  
  // MODIFICAÇÃO: Usar a média ponderada para determinar se precisa de ajuste
  const needsBudgetAdjustment = useMemo(() => {
    if (!hasReview || weightedAverage === 0) return false;
    
    // Verifica se a diferença é maior que 5 reais
    const absoluteDifference = Math.abs(budgetDifference);
    
    console.log(`🔍 DEBUG - Ajuste baseado na média ponderada para ${client.company_name}:`, {
      weightedAverage,
      idealDailyBudget,
      budgetDifference,
      absoluteDifference,
      needsAdjustment: absoluteDifference >= 5
    });
    
    return absoluteDifference >= 5;
  }, [hasReview, budgetDifference, weightedAverage, idealDailyBudget, client.company_name]);
  
  const needsAdjustmentBasedOnAverage = useMemo(() => {
    if (!hasReview || lastFiveDaysSpent === 0) return false;
    
    // Verifica se a diferença é maior que 5 reais ou 5% da média
    const absoluteDifference = Math.abs(budgetDifferenceBasedOnAverage);
    const percentageDifference = lastFiveDaysSpent > 0 ? absoluteDifference / lastFiveDaysSpent : 0;
    
    return absoluteDifference >= 5 && percentageDifference >= 0.05;
  }, [hasReview, budgetDifferenceBasedOnAverage, lastFiveDaysSpent]);
  
  return {
    hasReview,
    isCalculating: false,
    monthlyBudget,
    totalSpent,
    lastFiveDaysSpent,
    weightedAverage, // Nova métrica: Média Ponderada
    currentDailyBudget,
    idealDailyBudget,
    budgetDifference, // AGORA baseado na média ponderada
    budgetDifferenceBasedOnAverage,
    remainingDaysValue: calculatedRemainingDays,
    remainingBudget,
    needsBudgetAdjustment, // AGORA baseado na média ponderada
    needsAdjustmentBasedOnAverage,
    usingCustomBudget,
    customBudgetAmount,
    customBudgetStartDate,
    customBudgetEndDate
  };
};
