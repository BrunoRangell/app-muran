
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { getMetaAccessToken } from "./useEdgeFunction";
import { getCurrentDateInBrasiliaTz, getRemainingDaysInMonth } from "../summary/utils";
import { ClientWithReview } from "./types/reviewTypes";

export const useClientBudgetCalculation = (client: ClientWithReview) => {
  const [calculatedTotalSpent, setCalculatedTotalSpent] = useState<number | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [calculationError, setCalculationError] = useState<string | null>(null);
  const [calculationAttempted, setCalculationAttempted] = useState(false);
  
  // Verificar se o cliente tem uma revisão recente
  const hasReview = !!client.lastReview;
  
  // Obter dias restantes no mês usando a função corrigida
  const remainingDaysValue = getRemainingDaysInMonth();
  
  // Calcular valores para exibição
  const monthlyBudget = client.meta_ads_budget || 0;
  const totalSpentFromDB = hasReview ? (client.lastReview?.meta_total_spent || 0) : 0;
  const totalSpent = calculatedTotalSpent !== null ? calculatedTotalSpent : totalSpentFromDB;
  const remainingBudget = monthlyBudget - totalSpent;
  
  // Calcular o orçamento diário ideal com base no orçamento restante e dias restantes
  const idealDailyBudget = remainingDaysValue > 0 ? remainingBudget / remainingDaysValue : 0;

  // Verificar se o cliente tem valor de orçamento diário atual
  const currentDailyBudget = hasReview && client.lastReview?.meta_daily_budget_current !== null
    ? client.lastReview.meta_daily_budget_current
    : 0;

  // Gerar recomendação com base nos orçamentos
  const budgetDifference = idealDailyBudget - currentDailyBudget;

  // Calcular total gasto diretamente do Meta Ads API
  useEffect(() => {
    const calculateTotalSpent = async () => {
      if (!client.meta_account_id) {
        setCalculationError("Cliente sem ID de conta Meta configurado");
        setCalculationAttempted(true);
        return;
      }

      try {
        setIsCalculating(true);
        setCalculationError(null);
        
        // Obter token de acesso
        const accessToken = await getMetaAccessToken();
        
        if (!accessToken) {
          throw new Error("Token de acesso Meta não disponível");
        }
        
        // Preparar datas para o período (primeiro dia do mês até hoje)
        const now = getCurrentDateInBrasiliaTz();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        
        const dateRange = {
          start: firstDayOfMonth.toISOString().split('T')[0],
          end: now.toISOString().split('T')[0]
        };
        
        // Chamar função de borda para obter insights
        const { data, error } = await supabase.functions.invoke("meta-budget-calculator", {
          body: {
            accountId: client.meta_account_id,
            accessToken,
            dateRange: dateRange,
            fetchSeparateInsights: true
          }
        });
        
        if (error) {
          console.error(`[useClientBudgetCalculation] Erro ao calcular total gasto para ${client.company_name}:`, error);
          throw new Error(`Erro ao calcular total gasto: ${error.message}`);
        }
        
        if (!data) {
          throw new Error("Resposta vazia da API");
        }
        
        // Extrair o total gasto da resposta
        const metaTotalSpent = data.totalSpent || 0;
        
        setCalculatedTotalSpent(metaTotalSpent);
      } catch (error) {
        console.error(`[useClientBudgetCalculation] Erro ao calcular total gasto para ${client.company_name}:`, error);
        setCalculationError(error instanceof Error ? error.message : "Erro desconhecido");
      } finally {
        setIsCalculating(false);
        setCalculationAttempted(true);
      }
    };
    
    // Calcular apenas quando o cartão é renderizado e não foi calculado anteriormente
    if (client.meta_account_id && !calculatedTotalSpent && !isCalculating && !calculationAttempted) {
      calculateTotalSpent();
    }
  }, [client, calculatedTotalSpent, isCalculating, calculationAttempted]);

  return {
    hasReview,
    isCalculating,
    calculationError,
    monthlyBudget,
    totalSpent,
    currentDailyBudget,
    idealDailyBudget,
    budgetDifference,
    remainingDaysValue
  };
};
