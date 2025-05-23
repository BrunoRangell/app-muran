
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export const useCustomBudget = (clientId: string) => {
  const [isUsingCustomBudgetInReview, setIsUsingCustomBudgetInReview] = useState(false);
  
  // Busca orçamentos personalizados ativos para o cliente
  const { 
    data: customBudget,
    isLoading: isLoadingCustomBudget,
    error: customBudgetError
  } = useQuery({
    queryKey: ['custom-budget', clientId],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      
      // Buscar orçamentos personalizados que estejam ativos e dentro do período de validade
      const { data, error } = await supabase
        .from('meta_custom_budgets')
        .select('*')
        .eq('client_id', clientId)
        .eq('is_active', true)
        .lte('start_date', today)
        .gte('end_date', today)
        .order('created_at', { ascending: false })
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!clientId
  });
  
  // Verifica se há uma revisão atual usando o orçamento personalizado
  useEffect(() => {
    const checkCurrentReview = async () => {
      if (customBudget) {
        const { data, error } = await supabase
          .from('daily_budget_reviews')
          .select('using_custom_budget')
          .eq('client_id', clientId)
          .eq('review_date', new Date().toISOString().split('T')[0])
          .maybeSingle();
          
        if (error) {
          console.error('Erro ao verificar revisão atual:', error);
          return;
        }
        
        setIsUsingCustomBudgetInReview(data?.using_custom_budget || false);
      }
    };
    
    checkCurrentReview();
  }, [customBudget, clientId]);
  
  return {
    customBudget,
    isUsingCustomBudgetInReview,
    isLoadingCustomBudget,
    customBudgetError
  };
};
