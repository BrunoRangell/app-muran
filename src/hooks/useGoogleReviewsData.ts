
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useBudgetCalculator } from '@/hooks/useBudgetCalculator';
import { ClientMetrics } from './useMetaReviewsData';

const initialMetrics: ClientMetrics = {
  totalClients: 0,
  clientsNeedingAdjustment: 0,
  totalBudget: 0,
  totalSpent: 0,
  spentPercentage: 0
};

export function useGoogleReviewsData() {
  const [metrics, setMetrics] = useState<ClientMetrics>(initialMetrics);
  const { calculateBudget } = useBudgetCalculator();

  const { 
    data, 
    isLoading, 
    error, 
    refetch 
  } = useQuery({
    queryKey: ['google-reviews-data'],
    queryFn: async () => {
      try {
        // 1. Buscar clientes ativos
        const { data: clients, error: clientsError } = await supabase
          .from('clients')
          .select(`
            id,
            company_name,
            google_ads_budget,
            google_account_id,
            status
          `)
          .eq('status', 'active');

        if (clientsError) throw clientsError;

        // 2. Buscar contas Google dos clientes
        const { data: googleAccounts, error: accountsError } = await supabase
          .from('client_google_accounts')
          .select('*')
          .eq('status', 'active');

        if (accountsError) throw accountsError;

        // 3. Buscar revisões mais recentes
        const today = new Date().toISOString().split('T')[0];
        const { data: reviews, error: reviewsError } = await supabase
          .from('google_ads_reviews')
          .select('*')
          .eq('review_date', today);

        if (reviewsError) throw reviewsError;
        
        // 4. Buscar orçamentos personalizados ativos
        const { data: customBudgets, error: customBudgetsError } = await supabase
          .from('custom_budgets')
          .select('*')
          .eq('platform', 'google')
          .eq('is_active', true)
          .lte('start_date', today)
          .gte('end_date', today);

        if (customBudgetsError) throw customBudgetsError;

        // 5. Combinar dados e calcular métricas
        const processedClients = clients.map(client => {
          // Encontrar as revisões deste cliente
          const clientReviews = reviews.filter(review => review.client_id === client.id);
          const latestReview = clientReviews.length > 0 
            ? clientReviews.sort((a, b) => 
                new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
              )[0] 
            : null;
          
          // Encontrar orçamentos personalizados
          const clientCustomBudget = customBudgets?.find(budget => 
            budget.client_id === client.id && (!budget.account_id || budget.account_id === client.google_account_id)
          );
          
          // Verificar se está usando orçamento personalizado
          const isUsingCustomBudget = latestReview?.using_custom_budget || false;
          const budgetAmount = isUsingCustomBudget 
            ? (latestReview?.custom_budget_amount || clientCustomBudget?.budget_amount || client.google_ads_budget || 0)
            : (client.google_ads_budget || 0);
            
          const customBudgetEndDate = latestReview?.custom_budget_end_date || clientCustomBudget?.end_date;
          
          // Calcular orçamento ideal
          const budgetCalc = calculateBudget({
            monthlyBudget: budgetAmount,
            totalSpent: latestReview?.google_total_spent || 0,
            currentDailyBudget: latestReview?.google_daily_budget_current || 0,
            usingCustomBudget: isUsingCustomBudget,
            customBudgetAmount: clientCustomBudget?.budget_amount,
            customBudgetEndDate: customBudgetEndDate
          });
          
          return {
            id: client.id,
            company_name: client.company_name,
            budget_amount: budgetAmount,
            review: latestReview,
            budgetCalculation: budgetCalc,
            needsAdjustment: budgetCalc.needsBudgetAdjustment,
            customBudget: clientCustomBudget,
            isUsingCustomBudget
          };
        });
        
        // Calcular métricas
        const totalBudget = processedClients.reduce((sum, client) => sum + (client.budget_amount || 0), 0);
        const totalSpent = processedClients.reduce((sum, client) => sum + (client.review?.google_total_spent || 0), 0);
        const needingAdjustment = processedClients.filter(client => client.needsAdjustment).length;
        
        const newMetrics = {
          totalClients: processedClients.length,
          clientsNeedingAdjustment: needingAdjustment,
          totalBudget,
          totalSpent,
          spentPercentage: totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0
        };
        
        setMetrics(newMetrics);
        
        return processedClients;
      } catch (error) {
        console.error('Erro ao buscar dados de revisões Google:', error);
        throw error;
      }
    },
    refetchOnWindowFocus: false
  });

  return {
    data,
    isLoading,
    error,
    metrics,
    refresh: refetch
  };
}
