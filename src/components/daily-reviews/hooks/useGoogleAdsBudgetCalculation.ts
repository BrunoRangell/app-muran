
import { useMemo } from "react";
import { ClientWithReview, GoogleAccount } from "./types/reviewTypes";

export const useGoogleAdsBudgetCalculation = (client: ClientWithReview) => {
  const hasReview = !!client.lastReview;
  
  const usingCustomBudget = useMemo(() => {
    return hasReview && client.lastReview?.using_custom_budget === true;
  }, [hasReview, client.lastReview]);
  
  const customBudgetAmount = useMemo(() => {
    return usingCustomBudget ? client.lastReview?.custom_budget_amount : null;
  }, [usingCustomBudget, client.lastReview]);
  
  const customBudgetStartDate = useMemo(() => {
    return usingCustomBudget ? client.lastReview?.custom_budget_start_date : null;
  }, [usingCustomBudget, client.lastReview]);
  
  const customBudgetEndDate = useMemo(() => {
    return usingCustomBudget ? client.lastReview?.custom_budget_end_date : null;
  }, [usingCustomBudget, client.lastReview]);

  // Verificar se o aviso foi ignorado hoje
  const warningIgnoredToday = useMemo(() => {
    if (!hasReview || !client.lastReview) return false;
    
    const today = new Date().toISOString().split('T')[0];
    const ignoredDate = client.lastReview.warning_ignored_date;
    const isIgnored = client.lastReview.warning_ignored_today;
    
    return isIgnored && ignoredDate === today;
  }, [hasReview, client.lastReview]);
  
  const calculateTotalGoogleBudget = () => {
    if (usingCustomBudget && customBudgetAmount) {
      return customBudgetAmount;
    }
    
    if (!client.google_accounts || client.google_accounts.length === 0) {
      return client.google_ads_budget || 0;
    }
    
    return client.google_accounts.reduce((sum, account) => {
      return sum + (account.budget_amount || 0);
    }, 0);
  };
  
  const monthlyBudget = calculateTotalGoogleBudget();
  
  const totalSpent = useMemo(() => {
    if (!hasReview) return 0;
    
    if (client.lastReview?.client_account_id) {
      return client.lastReview?.google_total_spent || 0;
    }
    
    if (client.google_reviews && client.google_reviews.length > 0) {
      const currentDate = new Date();
      const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      
      return client.google_reviews
        .filter(review => {
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
    
    if (client.lastReview?.client_account_id) {
      return client.lastReview?.google_last_five_days_spent || 0;
    }
    
    if (client.google_reviews && client.google_reviews.length > 0) {
      const currentDate = new Date();
      const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      
      return client.google_reviews
        .filter(review => {
          const reviewDate = review.review_date ? new Date(review.review_date) : null;
          return reviewDate && reviewDate >= firstDayOfMonth;
        })
        .reduce((sum, review) => {
          return sum + (review.google_last_five_days_spent || 0);
        }, 0);
    }
    
    return client.lastReview?.google_last_five_days_spent || 0;
  }, [hasReview, client.lastReview, client.google_reviews]);
  
  const weightedAverage = useMemo(() => {
    if (!hasReview || !client.lastReview) return 0;
    
    const day1 = client.lastReview.google_day_1_spent || 0; // 5 dias atrás
    const day2 = client.lastReview.google_day_2_spent || 0; // 4 dias atrás
    const day3 = client.lastReview.google_day_3_spent || 0; // 3 dias atrás
    const day4 = client.lastReview.google_day_4_spent || 0; // 2 dias atrás
    const day5 = client.lastReview.google_day_5_spent || 0; // 1 dia atrás
    
    const weightedSum = (day1 * 0.1) + (day2 * 0.15) + (day3 * 0.2) + (day4 * 0.25) + (day5 * 0.3);
    
    return weightedSum;
  }, [hasReview, client.lastReview]);
  
  const currentDailyBudget = useMemo(() => {
    if (!hasReview) return 0;
    
    if (client.lastReview?.client_account_id) {
      return client.lastReview?.google_daily_budget_current || 0;
    }
    
    if (client.google_reviews && client.google_reviews.length > 0) {
      const currentDate = new Date();
      const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      
      return client.google_reviews
        .filter(review => {
          const reviewDate = review.review_date ? new Date(review.review_date) : null;
          return reviewDate && reviewDate >= firstDayOfMonth;
        })
        .reduce((sum, review) => {
          return sum + (review.google_daily_budget_current || 0);
        }, 0);
    }
    
    return client.lastReview?.google_daily_budget_current || 0;
  }, [hasReview, client.lastReview, client.google_reviews]);
  
  const calculatedRemainingDays = useMemo(() => {
    if (usingCustomBudget && customBudgetEndDate) {
      const today = new Date();
      const endDate = new Date(customBudgetEndDate);
      const timeDiff = endDate.getTime() - today.getTime();
      return Math.max(1, Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1);
    } else {
      const currentDate = new Date();
      const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      return lastDayOfMonth.getDate() - currentDate.getDate() + 1;
    }
  }, [usingCustomBudget, customBudgetEndDate]);
  
  const remainingBudget = Math.max(monthlyBudget - totalSpent, 0);
  
  const idealDailyBudget = useMemo(() => {
    return calculatedRemainingDays > 0 ? remainingBudget / calculatedRemainingDays : 0;
  }, [remainingBudget, calculatedRemainingDays]);
  
  const budgetDifference = useMemo(() => {
    if (!hasReview || weightedAverage === 0) return 0;
    
    return idealDailyBudget - weightedAverage;
  }, [hasReview, idealDailyBudget, weightedAverage]);
  
  const budgetDifferenceBasedOnAverage = useMemo(() => {
    if (!hasReview || lastFiveDaysSpent === 0) return 0;
    
    return idealDailyBudget - lastFiveDaysSpent;
  }, [hasReview, idealDailyBudget, lastFiveDaysSpent]);
  
  // MODIFICAÇÃO: Considerar se o aviso foi ignorado
  const needsBudgetAdjustment = useMemo(() => {
    if (!hasReview || weightedAverage === 0 || warningIgnoredToday) return false;
    
    const absoluteDifference = Math.abs(budgetDifference);
    
    console.log(`🔍 DEBUG - Ajuste baseado na média ponderada para ${client.company_name} (CORRIGIDO):`, {
      weightedAverage,
      idealDailyBudget,
      budgetDifference,
      absoluteDifference,
      warningIgnoredToday,
      needsAdjustment: absoluteDifference >= 5,
      method: 'weightedAverage'
    });
    
    return absoluteDifference >= 5;
  }, [hasReview, budgetDifference, weightedAverage, idealDailyBudget, client.company_name, warningIgnoredToday]);
  
  const needsAdjustmentBasedOnAverage = useMemo(() => {
    if (!hasReview || lastFiveDaysSpent === 0 || warningIgnoredToday) return false;
    
    const absoluteDifference = Math.abs(budgetDifferenceBasedOnAverage);
    const percentageDifference = lastFiveDaysSpent > 0 ? absoluteDifference / lastFiveDaysSpent : 0;
    
    return absoluteDifference >= 5 && percentageDifference >= 0.05;
  }, [hasReview, budgetDifferenceBasedOnAverage, lastFiveDaysSpent, warningIgnoredToday]);
  
  return {
    hasReview,
    isCalculating: false,
    monthlyBudget,
    totalSpent,
    lastFiveDaysSpent,
    weightedAverage,
    currentDailyBudget,
    idealDailyBudget,
    budgetDifference,
    budgetDifferenceBasedOnAverage,
    remainingDaysValue: calculatedRemainingDays,
    remainingBudget,
    needsBudgetAdjustment,
    needsAdjustmentBasedOnAverage,
    usingCustomBudget,
    customBudgetAmount,
    customBudgetStartDate,
    customBudgetEndDate,
    warningIgnoredToday
  };
};
