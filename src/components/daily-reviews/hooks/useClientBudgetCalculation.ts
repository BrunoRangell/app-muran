
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { getMetaAccessToken } from "./useEdgeFunction";
import { getCurrentDateInBrasiliaTz, getRemainingDaysInMonth } from "../summary/utils";
import { ClientWithReview } from "./types/reviewTypes";

export const useClientBudgetCalculation = (client: ClientWithReview) => {
  const [calculatedTotalSpent, setCalculatedTotalSpent] = useState<number | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [calculationError, setCalculationError] = useState<string | null>(null);
  const [calculationAttempted, setCalculationAttempted] = useState(true); // Iniciar como true para evitar cálculo automático
  const [customBudget, setCustomBudget] = useState<any | null>(null);
  const [isLoadingCustomBudget, setIsLoadingCustomBudget] = useState(false);
  
  // Verificar se o cliente tem uma revisão recente
  const hasReview = !!client.lastReview;
  
  useEffect(() => {
    const fetchCustomBudget = async () => {
      try {
        setIsLoadingCustomBudget(true);
        
        // Buscar orçamento personalizado ativo para a data atual
        const today = new Date().toISOString().split('T')[0];
        const { data, error } = await supabase
          .from("meta_custom_budgets")
          .select("*")
          .eq("client_id", client.id)
          .eq("is_active", true)
          .lte("start_date", today)
          .gte("end_date", today)
          .order("created_at", { ascending: false })
          .maybeSingle();
          
        if (error) {
          console.error("Erro ao buscar orçamento personalizado:", error);
          return;
        }
        
        setCustomBudget(data);
      } catch (error) {
        console.error("Erro ao buscar orçamento personalizado:", error);
      } finally {
        setIsLoadingCustomBudget(false);
      }
    };
    
    if (client?.id) {
      fetchCustomBudget();
    }
  }, [client.id]);
  
  // Obter dias restantes no mês usando a função corrigida
  const remainingDaysValue = getRemainingDaysInMonth();
  
  // Calcular valores para exibição
  const monthlyBudget = client.meta_ads_budget || 0;
  const totalSpentFromDB = hasReview ? (client.lastReview?.meta_total_spent || 0) : 0;
  // Sempre usar o valor do banco de dados, ignorando o cálculo automático
  const totalSpent = totalSpentFromDB;
  
  // Obter dias restantes e orçamento ideal com base no tipo de orçamento (regular ou personalizado)
  const getRemainingDays = () => {
    if (customBudget) {
      // Para orçamento personalizado, contar os dias entre hoje e a data de término
      const today = getCurrentDateInBrasiliaTz();
      const endDate = new Date(customBudget.end_date);
      // +1 para incluir o dia atual
      return Math.floor((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    }
    
    // Para orçamento regular, usar a função padrão
    return remainingDaysValue;
  };
  
  const getBudgetRemaining = () => {
    if (customBudget) {
      return customBudget.budget_amount - totalSpent;
    }
    
    return monthlyBudget - totalSpent;
  };
  
  const getDailyBudgetIdeal = () => {
    const remaining = getBudgetRemaining();
    const days = getRemainingDays();
    
    return days > 0 ? remaining / days : 0;
  };
  
  const remainingBudget = getBudgetRemaining();
  
  // Calcular o orçamento diário ideal com base no orçamento restante e dias restantes
  const idealDailyBudget = getDailyBudgetIdeal();

  // Verificar se o cliente tem valor de orçamento diário atual
  const currentDailyBudget = hasReview && client.lastReview?.meta_daily_budget_current !== null
    ? client.lastReview.meta_daily_budget_current
    : 0;

  // Gerar recomendação com base nos orçamentos
  const budgetDifference = idealDailyBudget - currentDailyBudget;

  // Função para calcular total gasto manualmente (só será chamada quando solicitado)
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
      return metaTotalSpent;
    } catch (error) {
      console.error(`[useClientBudgetCalculation] Erro ao calcular total gasto para ${client.company_name}:`, error);
      setCalculationError(error instanceof Error ? error.message : "Erro desconhecido");
      throw error;
    } finally {
      setIsCalculating(false);
      setCalculationAttempted(true);
    }
  };

  return {
    hasReview,
    isCalculating,
    calculationError,
    monthlyBudget,
    totalSpent,
    currentDailyBudget,
    idealDailyBudget,
    budgetDifference,
    remainingDaysValue: getRemainingDays(),
    // Expor a função de cálculo manual para ser chamada pelos botões "analisar"
    calculateTotalSpent,
    // Informações sobre orçamento personalizado
    customBudget,
    isLoadingCustomBudget,
    remainingBudget
  };
};
