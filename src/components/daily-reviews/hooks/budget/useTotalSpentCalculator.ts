
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { getMetaAccessToken } from "../useEdgeFunction";
import { getCurrentDateInBrasiliaTz } from "../../summary/utils";

/**
 * Hook para calcular o gasto total de um cliente no Meta Ads
 */
export const useTotalSpentCalculator = () => {
  const [calculatedTotalSpent, setCalculatedTotalSpent] = useState<number | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [calculationError, setCalculationError] = useState<string | null>(null);
  const [calculationAttempted, setCalculationAttempted] = useState(true);
  
  /**
   * Calcula o gasto total de um cliente no Meta Ads
   */
  const calculateTotalSpent = async (metaAccountId: string | null, customBudget: any | null) => {
    if (!metaAccountId) {
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
      
      // Preparar datas para o período
      const now = getCurrentDateInBrasiliaTz();
      
      // Se existe orçamento personalizado, usar as datas dele
      let startDate;
      if (customBudget) {
        startDate = new Date(customBudget.start_date);
        // Garantir que não buscamos dados anteriores à data de início
        if (startDate > now) {
          throw new Error("A data de início do orçamento é no futuro");
        }
      } else {
        // Caso contrário, usar o primeiro dia do mês atual
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      }
      
      const dateRange = {
        start: startDate.toISOString().split('T')[0],
        end: now.toISOString().split('T')[0]
      };
      
      // Chamar função de borda para obter insights
      const { data, error } = await supabase.functions.invoke("meta-budget-calculator", {
        body: {
          accountId: metaAccountId,
          accessToken,
          dateRange: dateRange,
          fetchSeparateInsights: true
        }
      });
      
      if (error) {
        console.error(`[useTotalSpentCalculator] Erro ao calcular total gasto:`, error);
        throw new Error(`Erro ao calcular total gasto: ${error.message}`);
      }
      
      if (!data) {
        throw new Error("Resposta vazia da API");
      }
      
      // Extrair o total gasto da resposta
      const metaTotalSpent = data.totalSpent || 0;
      
      setCalculatedTotalSpent(metaTotalSpent);
      return metaTotalSpent;
    } catch (error) {
      console.error(`[useTotalSpentCalculator] Erro ao calcular total gasto:`, error);
      setCalculationError(error instanceof Error ? error.message : "Erro desconhecido");
      throw error;
    } finally {
      setIsCalculating(false);
      setCalculationAttempted(true);
    }
  };
  
  return {
    calculatedTotalSpent,
    isCalculating,
    calculationError,
    calculationAttempted,
    calculateTotalSpent
  };
};
