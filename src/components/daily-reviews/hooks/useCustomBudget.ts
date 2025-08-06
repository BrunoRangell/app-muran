
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { formatDateBr } from '@/utils/dateFormatter';

export const useCustomBudget = (clientId: string) => {
  const [isUsingCustomBudgetInReview, setIsUsingCustomBudgetInReview] = useState(false);
  
  // Busca orçamentos personalizados ativos para o cliente - VERSÃO UNIFICADA
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
        .from('custom_budgets')
        .select('*')
        .eq('client_id', clientId)
        .eq('platform', 'meta')
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
          .from('budget_reviews')
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
  
  // Formatar as datas do orçamento personalizado para exibição
  const formattedCustomBudget = customBudget ? {
    ...customBudget,
    formatted_start_date: formatDateBr(customBudget.start_date),
    formatted_end_date: formatDateBr(customBudget.end_date)
  } : null;
  
  return {
    customBudget: formattedCustomBudget,
    isUsingCustomBudgetInReview,
    isLoadingCustomBudget,
    customBudgetError
  };
};
