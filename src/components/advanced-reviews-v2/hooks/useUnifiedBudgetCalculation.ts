
import { useState, useEffect, useMemo } from "react";
import { ClientWithReview } from "@/components/daily-reviews/hooks/types/reviewTypes";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentDateInBrasiliaTz } from "@/components/daily-reviews/summary/utils";
import { addDays, differenceInDays } from "date-fns";

interface BudgetCalculationResult {
  monthlyBudget: number;
  totalSpent: number;
  currentDailyBudget: number;
  idealDailyBudget: number;
  budgetDifference: number;
  remainingBudget: number;
  remainingDays: number;
  needsAdjustment: boolean;
  isCustomBudget: boolean;
  customBudgetId: string | null;
  customBudgetAmount: number | null;
  customBudgetStartDate: string | null;
  customBudgetEndDate: string | null;
  hasReview: boolean;
  isCalculating: boolean;
  calculationError: string | null;
}

interface UseUnifiedBudgetCalculationProps {
  client: ClientWithReview;
  specificAccountId?: string;
  platform: "meta" | "google";
}

export const useUnifiedBudgetCalculation = ({
  client,
  specificAccountId,
  platform
}: UseUnifiedBudgetCalculationProps): BudgetCalculationResult => {
  const [isCalculating, setIsCalculating] = useState(false);
  const [calculationError, setCalculationError] = useState<string | null>(null);
  const [budgetData, setBudgetData] = useState<Partial<BudgetCalculationResult>>({});
  
  // Identificar qual conta usar
  const accountId = specificAccountId || client?.[`${platform}_account_id`];
  
  // Determinar qual revisão usar
  const review = platform === "meta" 
    ? client?.lastReview 
    : client?.google_reviews?.[0];

  // Efeito para calcular orçamento quando o cliente muda
  useEffect(() => {
    const calculateBudget = async () => {
      if (!client?.id) return;
      
      try {
        setIsCalculating(true);
        setCalculationError(null);
        
        // Obter o orçamento mensal padrão baseado na plataforma
        let monthlyBudget = client?.[`${platform}_ads_budget`] || 0;
        let accountName = "Conta Principal";
        
        // Se temos um ID de conta específico, buscamos as informações dessa conta
        if (specificAccountId) {
          const { data: accountData, error: accountError } = await supabase
            .from(`client_${platform}_accounts`)
            .select('*')
            .eq('client_id', client.id)
            .eq('account_id', specificAccountId)
            .maybeSingle();
            
          if (!accountError && accountData) {
            monthlyBudget = accountData.budget_amount;
            accountName = accountData.account_name;
          }
        }
        
        // Data atual no formato correto
        const today = new Date().toISOString().split('T')[0];
        
        // Buscar orçamento personalizado ativo (se houver)
        const { data: customBudget, error: budgetError } = await supabase
          .from(platform === "meta" ? "meta_custom_budgets" : "custom_budgets")
          .select('*')
          .eq('client_id', client.id)
          .eq('is_active', true)
          .lte('start_date', today)
          .gte('end_date', today)
          .order('created_at', { ascending: false })
          .maybeSingle();
        
        if (budgetError) {
          console.error(`Erro ao buscar orçamento personalizado ${platform}:`, budgetError);
        }
        
        // Variáveis para o cálculo do orçamento
        let currentDailyBudget = 0;
        let totalSpent = 0;
        let customBudgetAmount = null;
        let actualBudgetAmount = monthlyBudget;
        let isUsingCustomBudget = false;
        let customBudgetStartDate = null;
        let customBudgetEndDate = null;
        
        // Se temos um orçamento personalizado ativo, usamos ele
        if (customBudget) {
          customBudgetAmount = customBudget.budget_amount;
          customBudgetStartDate = customBudget.start_date;
          customBudgetEndDate = customBudget.end_date;
          actualBudgetAmount = customBudgetAmount;
          isUsingCustomBudget = true;
        }
        
        if (review) {
          // Usar os valores da revisão
          currentDailyBudget = review[`${platform}_daily_budget_current`] || 0;
          totalSpent = review[`${platform}_total_spent`] || 0;
          
          // Se a revisão está usando um orçamento personalizado e temos o valor
          if (review.using_custom_budget && review.custom_budget_amount) {
            actualBudgetAmount = review.custom_budget_amount;
            isUsingCustomBudget = true;
            
            // Se a revisão tem datas de orçamento personalizado, usar essas
            if (review.custom_budget_start_date) {
              customBudgetStartDate = review.custom_budget_start_date;
            }
            
            if (review.custom_budget_end_date) {
              customBudgetEndDate = review.custom_budget_end_date;
            }
          }
        }
        
        // Calcular dias restantes baseado no tipo de orçamento
        let remainingDaysValue = 0;
        
        if (isUsingCustomBudget && customBudgetEndDate) {
          // Para orçamentos personalizados, usar a data de término
          const endDate = new Date(customBudgetEndDate);
          const currentDate = getCurrentDateInBrasiliaTz();
          remainingDaysValue = differenceInDays(endDate, currentDate) + 1; // +1 para incluir o dia atual
        } else {
          // Para orçamentos mensais, calcular dias restantes no mês
          const currentDate = getCurrentDateInBrasiliaTz();
          const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
          remainingDaysValue = differenceInDays(lastDayOfMonth, currentDate) + 1; // +1 para incluir o dia atual
        }
        
        // Calcular orçamento restante
        const remainingBudget = actualBudgetAmount - totalSpent;
        
        // Calcular orçamento diário ideal
        const idealDailyBudget = remainingDaysValue > 0 
          ? remainingBudget / remainingDaysValue 
          : 0;
          
        // Calcular diferença entre orçamento atual e ideal
        const budgetDifference = idealDailyBudget - currentDailyBudget;
        
        // Determinar se precisa de ajuste (diferença maior que 5)
        const needsAdjustment = Math.abs(budgetDifference) >= 5;
        
        // Atualizar estado com os resultados
        setBudgetData({
          monthlyBudget: actualBudgetAmount,
          totalSpent,
          currentDailyBudget,
          idealDailyBudget,
          budgetDifference,
          remainingBudget,
          remainingDays: remainingDaysValue,
          needsAdjustment,
          isCustomBudget: isUsingCustomBudget,
          customBudgetId: customBudget?.id || null,
          customBudgetAmount,
          customBudgetStartDate,
          customBudgetEndDate,
          hasReview: !!review
        });
        
      } catch (error: any) {
        console.error(`Erro ao calcular orçamento ${platform}:`, error);
        setCalculationError(error.message || `Erro ao calcular orçamento ${platform}`);
      } finally {
        setIsCalculating(false);
      }
    };
    
    calculateBudget();
  }, [client, accountId, specificAccountId, platform]);
  
  // Retornar os dados do orçamento com valores padrão para propriedades não definidas
  return useMemo(() => {
    return {
      monthlyBudget: budgetData.monthlyBudget || 0,
      totalSpent: budgetData.totalSpent || 0,
      currentDailyBudget: budgetData.currentDailyBudget || 0,
      idealDailyBudget: budgetData.idealDailyBudget || 0,
      budgetDifference: budgetData.budgetDifference || 0,
      remainingBudget: budgetData.remainingBudget || 0,
      remainingDays: budgetData.remainingDays || 0,
      needsAdjustment: budgetData.needsAdjustment || false,
      isCustomBudget: budgetData.isCustomBudget || false,
      customBudgetId: budgetData.customBudgetId || null,
      customBudgetAmount: budgetData.customBudgetAmount || null,
      customBudgetStartDate: budgetData.customBudgetStartDate || null,
      customBudgetEndDate: budgetData.customBudgetEndDate || null,
      hasReview: budgetData.hasReview || false,
      isCalculating,
      calculationError
    };
  }, [budgetData, isCalculating, calculationError]);
};
