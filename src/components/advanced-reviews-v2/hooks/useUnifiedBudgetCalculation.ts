
import { useMemo } from 'react';
import { ClientWithReview } from '@/components/daily-reviews/hooks/types/reviewTypes';

interface BudgetCalculationProps {
  client: ClientWithReview;
  platform: 'meta' | 'google';
}

export function useUnifiedBudgetCalculation({ client, platform }: BudgetCalculationProps) {
  const result = useMemo(() => {
    // Definir variáveis com base na plataforma
    const lastReview = client.lastReview;
    const budgetField = platform === 'meta' ? 'meta_ads_budget' : 'google_ads_budget';
    const totalSpentField = platform === 'meta' ? 'meta_total_spent' : 'google_total_spent';
    const dailyBudgetField = platform === 'meta' ? 'meta_daily_budget_current' : 'google_daily_budget_current';

    // Verificar se tem revisão
    const hasReview = !!lastReview;

    if (!hasReview || !client[budgetField]) {
      return {
        hasReview: false,
        monthlyBudget: client[budgetField] || 0,
        totalSpent: 0,
        currentDailyBudget: 0,
        idealDailyBudget: 0,
        remainingBudget: 0,
        remainingDays: 0,
        needsAdjustment: false,
        isCustomBudget: false,
        customBudgetEndDate: null
      };
    }

    // Determinar qual orçamento usar (personalizado ou regular)
    let isCustomBudget = lastReview.using_custom_budget;
    let monthlyBudget = isCustomBudget && lastReview.custom_budget_amount 
      ? lastReview.custom_budget_amount 
      : client[budgetField] || 0;

    // Calcular orçamento atual e ideal
    const totalSpent = lastReview[totalSpentField] || 0;
    const currentDailyBudget = lastReview[dailyBudgetField] || 0;

    // Calcular dias restantes no mês
    const currentDate = new Date();
    const lastDayOfMonth = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() + 1,
      0
    );
    const remainingDays = lastDayOfMonth.getDate() - currentDate.getDate() + 1;

    // Calcular orçamento diário ideal
    const remainingBudget = monthlyBudget - totalSpent;
    const idealDailyBudget = remainingDays > 0
      ? remainingBudget / remainingDays
      : 0;

    // Determinar se precisa de ajuste (diferença maior que 5)
    const needsAdjustment = Math.abs(idealDailyBudget - currentDailyBudget) >= 5;

    return {
      hasReview,
      monthlyBudget,
      totalSpent,
      currentDailyBudget,
      idealDailyBudget,
      remainingBudget,
      remainingDays,
      needsAdjustment,
      isCustomBudget,
      customBudgetEndDate: lastReview.custom_budget_end_date || null
    };
  }, [client, platform]);

  return result;
}
