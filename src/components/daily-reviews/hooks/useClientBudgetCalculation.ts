
import { useState, useEffect } from "react";
import { ClientWithReview } from "./types/reviewTypes";
import { supabase } from "@/lib/supabase";
import { callEdgeFunction } from "./useEdgeFunction";

export const useClientBudgetCalculation = (client: ClientWithReview, specificAccountId?: string) => {
  const [isCalculating, setIsCalculating] = useState(false);
  const [calculationError, setCalculationError] = useState<Error | null>(null);
  const [result, setResult] = useState<any>(null);
  
  // Determinando qual é a conta a ser usada (padrão ou específica)
  const accountId = specificAccountId || client?.meta_account_id;
  
  // Identificar qual revisão usar com base na conta
  const review = client?.lastReview; // Usa a revisão mais recente por padrão
  
  useEffect(() => {
    // Resetar estado quando o cliente ou conta mudar
    setIsCalculating(false);
    setCalculationError(null);
    setResult(null);
    
    // Realizamos análises básicas de orçamento cliente/específico sem chamar a API
    const analyzeClientBudget = async () => {
      try {
        setIsCalculating(true);
        setCalculationError(null);
        
        // Obter o orçamento mensal baseado na conta específica ou na configuração padrão do cliente
        let monthlyBudget = client?.meta_ads_budget || 0;
        let accountName = "Conta Principal";
        
        // Se temos um ID de conta específico, buscamos as informações dessa conta
        if (specificAccountId) {
          const { data: accountData, error: accountError } = await supabase
            .from('client_meta_accounts')
            .select('*')
            .eq('client_id', client.id)
            .eq('account_id', specificAccountId)
            .maybeSingle();
            
          if (!accountError && accountData) {
            monthlyBudget = accountData.budget_amount;
            accountName = accountData.account_name;
          }
        }
        
        // Buscar orçamento personalizado ativo (se houver)
        const today = new Date().toISOString().split('T')[0];
        
        // Verificar na tabela unificada primeiro
        const { data: unifiedCustomBudget, error: unifiedBudgetError } = await supabase
          .from('custom_budgets')
          .select('*')
          .eq('client_id', client.id)
          .eq('platform', 'meta')
          .eq('is_active', true)
          .lte('start_date', today)
          .gte('end_date', today)
          .order('created_at', { ascending: false })
          .maybeSingle();
        
        let customBudget = unifiedCustomBudget;
        
        // Fallback para tabela antiga se necessário
        if (unifiedBudgetError || !customBudget) {
          const { data: legacyCustomBudget, error: legacyBudgetError } = await supabase
            .from('meta_custom_budgets')
            .select('*')
            .eq('client_id', client.id)
            .eq('is_active', true)
            .lte('start_date', today)
            .gte('end_date', today)
            .order('created_at', { ascending: false })
            .maybeSingle();
            
          if (!legacyBudgetError) {
            customBudget = legacyCustomBudget;
          }
        }
        
        if (unifiedBudgetError && !customBudget) {
          console.error("Erro ao buscar orçamento personalizado:", unifiedBudgetError);
        }
        
        // Filtrar orçamento personalizado por conta específica se necessário
        if (customBudget && specificAccountId && customBudget.account_id && 
            customBudget.account_id !== specificAccountId) {
          // Este orçamento é para uma conta específica e não é a que estamos analisando
          customBudget = null;
        }
        
        // Se o cliente tem uma revisão, calcular o orçamento diário ideal
        let currentDailyBudget = 0;
        let idealDailyBudget = 0;
        let totalSpent = 0;
        let remainingDaysValue = 0;
        let isUsingCustomBudgetInReview = false;
        let actualBudgetAmount = monthlyBudget;
        
        if (review) {
          // Usar os valores da revisão
          currentDailyBudget = review.meta_daily_budget_current || 0;
          totalSpent = review.meta_total_spent || 0;
          
          // Verificar se a revisão está usando um orçamento personalizado
          isUsingCustomBudgetInReview = review.using_custom_budget || false;
          
          // Data para calcular dias restantes
          const currentDate = new Date();
          let lastDayOfPeriod = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
          
          // Se estiver usando orçamento personalizado na revisão, usar sua data de término
          if (isUsingCustomBudgetInReview && review.custom_budget_end_date) {
            const endDate = new Date(review.custom_budget_end_date);
            if (endDate > currentDate) {
              lastDayOfPeriod = endDate;
            }
          } else if (customBudget) {
            // Se temos um orçamento personalizado disponível mas não está sendo usado na revisão
            const endDate = new Date(customBudget.end_date);
            if (endDate > currentDate) {
              lastDayOfPeriod = endDate;
            }
          }
          
          // Calcular dias restantes
          remainingDaysValue = Math.round((lastDayOfPeriod.getTime() - currentDate.getTime()) / 
                                         (1000 * 60 * 60 * 24)) + 1;
                                         
          // Verificar qual orçamento usar para calcular o orçamento diário ideal
          if (isUsingCustomBudgetInReview && review.custom_budget_amount) {
            actualBudgetAmount = review.custom_budget_amount;
          } else if (customBudget) {
            // Temos um orçamento personalizado disponível mas não está sendo usado na revisão
            actualBudgetAmount = customBudget.budget_amount;
          }
          
          // Calcular orçamento diário ideal
          idealDailyBudget = remainingDaysValue > 0
            ? (actualBudgetAmount - totalSpent) / remainingDaysValue
            : 0;
            
          // MODIFICADO: Agora usando apenas a diferença absoluta >= R$5
          const budgetDifference = idealDailyBudget - currentDailyBudget;
          const needsAdjustment = Math.abs(budgetDifference) >= 5;
            
          // Diagnóstico
          console.info(`Cliente ${client.company_name} - Diagnóstico:`, {
            hasReview: !!review,
            hasCustomBudget: !!customBudget,
            orçamentoMensal: monthlyBudget,
            orçamentoPersonalizado: customBudget ? customBudget.budget_amount : "Não está usando",
            orçamentoExibido: actualBudgetAmount,
            orçamentoDiárioAtual: currentDailyBudget,
            orçamentoDiárioIdeal: idealDailyBudget,
            diferençaNecessária: budgetDifference,
            precisaAjuste: needsAdjustment,
            tipoAjuste: idealDailyBudget > currentDailyBudget ? "Aumentar" : "Diminuir",
            diasRestantes: remainingDaysValue
          });
        }
        
        // Armazenar o resultado da análise
        setResult({
          hasReview: !!review,
          monthlyBudget: actualBudgetAmount,
          totalSpent,
          currentDailyBudget,
          idealDailyBudget,
          budgetDifference: idealDailyBudget - currentDailyBudget,
          customBudget,
          isUsingCustomBudgetInReview,
          actualBudgetAmount,
          accountName,
          remainingDaysValue
        });
      } catch (error) {
        console.error("Erro ao calcular orçamento:", error);
        setCalculationError(error as Error);
      } finally {
        setIsCalculating(false);
      }
    };
    
    if (client?.id) {
      analyzeClientBudget();
    }
  }, [client, accountId, specificAccountId]);
  
  return {
    ...result,
    isCalculating,
    calculationError,
  };
};
