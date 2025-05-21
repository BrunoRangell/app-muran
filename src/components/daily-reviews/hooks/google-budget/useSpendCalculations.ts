
import { useMemo } from "react";
import { ClientWithReview } from "../types/reviewTypes";

export const useSpendCalculations = (client: ClientWithReview) => {
  const hasReview = !!client.lastReview;
  
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
  
  return {
    totalSpent,
    lastFiveDaysSpent,
    currentDailyBudget,
    hasReview
  };
};
