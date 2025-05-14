
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { CustomBudget } from './types/reviewTypes';

interface UseUnifiedCustomBudgetProps {
  clientId: string;
  platform: 'meta' | 'google';
  accountId?: string;
}

export const useUnifiedCustomBudget = ({ 
  clientId, 
  platform, 
  accountId 
}: UseUnifiedCustomBudgetProps) => {
  const [isUsingCustomBudgetInReview, setIsUsingCustomBudgetInReview] = useState(false);
  
  // Determinar qual tabela verificar com base na plataforma
  const reviewTable = platform === 'meta' ? 'daily_budget_reviews' : 'google_ads_reviews';
  
  // Busca orçamentos personalizados ativos para o cliente
  const { 
    data: customBudget,
    isLoading: isLoadingCustomBudget,
    error: customBudgetError
  } = useQuery({
    queryKey: ['unified-custom-budget', clientId, platform, accountId],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      
      // Primeiro, tentar buscar na tabela unificada
      const { data, error } = await supabase
        .from('custom_budgets')
        .select('*')
        .eq('client_id', clientId)
        .eq('platform', platform)
        .eq('is_active', true)
        .lte('start_date', today)
        .gte('end_date', today)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error(`Erro ao buscar orçamentos na tabela unificada: ${error.message}`);
        
        // Fallback para a tabela antiga (meta_custom_budgets) se a plataforma for meta
        if (platform === 'meta') {
          const { data: legacyData, error: legacyError } = await supabase
            .from('meta_custom_budgets')
            .select('*')
            .eq('client_id', clientId)
            .eq('is_active', true)
            .lte('start_date', today)
            .gte('end_date', today)
            .order('created_at', { ascending: false });
            
          if (legacyError) throw legacyError;
          
          if (legacyData && legacyData.length > 0) {
            // Converter para o formato unificado
            return {
              ...legacyData[0],
              platform: 'meta'
            };
          }
        }
        
        return null;
      }
      
      // Filtrar por ID da conta se fornecido
      let filteredData = data;
      if (accountId && data && data.length > 0) {
        filteredData = data.filter(budget => 
          !budget.account_id || budget.account_id === accountId
        );
        
        // Se não encontrou orçamento específico para a conta, verificar se há orçamento global
        if (filteredData.length === 0) {
          filteredData = data.filter(budget => !budget.account_id);
        }
      }
      
      return filteredData && filteredData.length > 0 ? filteredData[0] : null;
    },
    enabled: !!clientId
  });
  
  // Verifica se há uma revisão atual usando o orçamento personalizado
  useEffect(() => {
    const checkCurrentReview = async () => {
      if (customBudget) {
        const { data, error } = await supabase
          .from(reviewTable)
          .select('using_custom_budget')
          .eq('client_id', clientId)
          .eq('review_date', new Date().toISOString().split('T')[0])
          .maybeSingle();
          
        if (error) {
          console.error(`Erro ao verificar revisão atual: ${error.message}`);
          return;
        }
        
        setIsUsingCustomBudgetInReview(data?.using_custom_budget || false);
      }
    };
    
    checkCurrentReview();
  }, [customBudget, clientId, reviewTable]);
  
  return {
    customBudget,
    isUsingCustomBudgetInReview,
    isLoadingCustomBudget,
    customBudgetError
  };
};
