
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
      
      console.log(`[useUnifiedCustomBudget] Buscando orçamento personalizado para cliente ${clientId}, plataforma ${platform}`);
      
      // Buscar na tabela unificada custom_budgets
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
        console.error(`[useUnifiedCustomBudget] Erro ao buscar orçamentos na tabela unificada: ${error.message}`);
        
        // Fallback para a tabela antiga (meta_custom_budgets) se a plataforma for meta
        if (platform === 'meta') {
          console.log('[useUnifiedCustomBudget] Tentando fallback para tabela meta_custom_budgets');
          
          const { data: legacyData, error: legacyError } = await supabase
            .from('meta_custom_budgets')
            .select('*')
            .eq('client_id', clientId)
            .eq('is_active', true)
            .lte('start_date', today)
            .gte('end_date', today)
            .order('created_at', { ascending: false });
            
          if (legacyError) {
            console.error(`[useUnifiedCustomBudget] Erro no fallback: ${legacyError.message}`);
            throw legacyError;
          }
          
          if (legacyData && legacyData.length > 0) {
            console.log(`[useUnifiedCustomBudget] Encontrado orçamento no fallback: ${JSON.stringify(legacyData[0])}`);
            
            // Converter para o formato unificado
            return {
              ...legacyData[0],
              platform: 'meta'
            };
          }
        }
        
        return null;
      }
      
      // Se temos dados, filtrar por ID da conta se fornecido
      if (data && data.length > 0) {
        console.log(`[useUnifiedCustomBudget] Encontrados ${data.length} orçamentos personalizados`);
        
        let filteredData = data;
        
        if (accountId) {
          console.log(`[useUnifiedCustomBudget] Filtrando por account_id: ${accountId}`);
          
          // Primeiro, procurar por orçamentos específicos para a conta
          const accountSpecificBudgets = data.filter(budget => 
            budget.account_id === accountId
          );
          
          if (accountSpecificBudgets.length > 0) {
            console.log(`[useUnifiedCustomBudget] Encontrado orçamento específico para a conta ${accountId}`);
            filteredData = accountSpecificBudgets;
          } else {
            // Se não encontrou orçamento específico, procurar por orçamentos globais (sem account_id)
            console.log(`[useUnifiedCustomBudget] Procurando por orçamentos globais`);
            const globalBudgets = data.filter(budget => !budget.account_id);
            
            if (globalBudgets.length > 0) {
              console.log(`[useUnifiedCustomBudget] Encontrado orçamento global`);
              filteredData = globalBudgets;
            }
          }
        }
        
        // Ordenar por data de criação (mais recente primeiro) e pegar o primeiro
        const selectedBudget = filteredData.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )[0];
        
        console.log(`[useUnifiedCustomBudget] Orçamento selecionado: ${JSON.stringify(selectedBudget)}`);
        return selectedBudget;
      }
      
      console.log(`[useUnifiedCustomBudget] Nenhum orçamento personalizado encontrado`);
      return null;
    },
    enabled: !!clientId
  });
  
  // Verifica se há uma revisão atual usando o orçamento personalizado
  useEffect(() => {
    const checkCurrentReview = async () => {
      if (customBudget) {
        console.log(`[useUnifiedCustomBudget] Verificando se a revisão atual usa orçamento personalizado`);
        
        const today = new Date().toISOString().split('T')[0];
        
        const { data, error } = await supabase
          .from(reviewTable)
          .select('using_custom_budget, custom_budget_id')
          .eq('client_id', clientId)
          .eq('review_date', today)
          .maybeSingle();
          
        if (error) {
          console.error(`[useUnifiedCustomBudget] Erro ao verificar revisão atual: ${error.message}`);
          return;
        }
        
        const isUsingCustom = data?.using_custom_budget || false;
        console.log(`[useUnifiedCustomBudget] Revisão atual ${isUsingCustom ? 'está' : 'não está'} usando orçamento personalizado`);
        
        setIsUsingCustomBudgetInReview(isUsingCustom);
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
