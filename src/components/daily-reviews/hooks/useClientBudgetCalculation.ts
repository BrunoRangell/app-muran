
import { useState, useEffect } from "react";
import { ClientWithReview } from "./types/reviewTypes";
import { supabase } from "@/lib/supabase";
import { callEdgeFunction } from "./useEdgeFunction";
import { getActiveCustomBudget } from "./services/customBudgetService";

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
        // Inclui lógica para considerar orçamentos específicos de conta
        const customBudget = await getActiveCustomBudget(client.id, accountId, 'meta');
        
        // Se o cliente tem uma revisão, calcular o orçamento diário ideal
        let currentDailyBudget = 0;
        let idealDailyBudget = 0;
        let totalSpent = 0;
        let remainingDaysValue = 0;
        
        if (review) {
          // Usar os valores da revisão
          currentDailyBudget = review.meta_daily_budget_current || 0;
          totalSpent = review.meta_total_spent || 0;
          
          // Verificar se a revisão está usando um orçamento personalizado
          const isUsingCustomBudgetInReview = review.using_custom_budget || false;
          
          // Calcular o orçamento diário ideal (baseado em dias restantes no mês)
          const currentDate = new Date();
          const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
          remainingDaysValue = lastDayOfMonth.getDate() - currentDate.getDate() + 1;
          
          // Determinar qual orçamento usar para calcular o orçamento diário ideal
          // Prioridade:
          // 1. Orçamento personalizado específico para a conta
          // 2. Orçamento personalizado geral do cliente
          // 3. Orçamento padrão da conta
          // 4. Orçamento padrão do cliente
          let actualBudgetAmount = monthlyBudget;
          let usingCustomBudget = false;
          
          // Verificar se temos um orçamento personalizado ativo hoje
          if (customBudget) {
            actualBudgetAmount = customBudget.budget_amount;
            usingCustomBudget = true;
          } 
          // Se não, verificar se a revisão está usando um orçamento personalizado
          else if (isUsingCustomBudgetInReview && review.custom_budget_amount) {
            actualBudgetAmount = review.custom_budget_amount;
            usingCustomBudget = true;
          }
          
          // Calcular orçamento diário ideal
          idealDailyBudget = remainingDaysValue > 0
            ? (actualBudgetAmount - totalSpent) / remainingDaysValue
            : 0;
            
          // Diagnóstico
          console.info(`Cliente ${client.company_name} - Diagnóstico Meta:`, {
            hasReview: !!review,
            hasCustomBudget: customBudget || false,
            orçamentoMensal: monthlyBudget,
            orçamentoPersonalizado: customBudget ? customBudget.budget_amount : "Não está usando",
            orçamentoExibido: actualBudgetAmount,
            orçamentoDiárioAtual: currentDailyBudget,
            orçamentoDiárioIdeal: idealDailyBudget,
            diferençaNecessária: idealDailyBudget - currentDailyBudget,
            precisaAjuste: Math.abs(idealDailyBudget - currentDailyBudget) >= 5,
            tipoAjuste: idealDailyBudget > currentDailyBudget ? "Aumentar" : "Diminuir",
            contaEspecífica: specificAccountId ? "Sim" : "Não",
            orçamentoPersonalizadoEspecífico: customBudget?.account_id ? "Sim" : "Não"
          });
        }
        
        // Armazenar o resultado da análise
        setResult({
          hasReview: !!review,
          monthlyBudget,
          totalSpent,
          currentDailyBudget,
          idealDailyBudget,
          budgetDifference: idealDailyBudget - currentDailyBudget,
          customBudget,
          isUsingCustomBudgetInReview: customBudget ? true : (review?.using_custom_budget || false),
          isLoadingCustomBudget: false,
          actualBudgetAmount: customBudget ? customBudget.budget_amount : (review?.custom_budget_amount || monthlyBudget),
          accountName,
          remainingDaysValue,
          needsBudgetAdjustment: Math.abs(idealDailyBudget - currentDailyBudget) >= 5,
          // Função auxiliar para calcular gasto total
          calculateTotalSpent: async () => totalSpent
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
