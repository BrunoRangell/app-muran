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
  
  // Verificar se já está usando orçamento personalizado na revisão
  const isUsingCustomBudgetInReview = hasReview && client.lastReview?.using_custom_budget === true;
  
  useEffect(() => {
    const fetchCustomBudget = async () => {
      try {
        setIsLoadingCustomBudget(true);
        
        // Se já temos a informação do orçamento personalizado na revisão, usamos ela
        if (isUsingCustomBudgetInReview && client.lastReview?.custom_budget_id) {
          const { data, error } = await supabase
            .from("meta_custom_budgets")
            .select("*")
            .eq("id", client.lastReview.custom_budget_id)
            .maybeSingle();
            
          if (error) {
            console.error("Erro ao buscar orçamento personalizado da revisão:", error);
            return;
          }
          
          console.log(`[useClientBudgetCalculation] Orçamento personalizado encontrado para o cliente ${client.company_name}:`, data);
          setCustomBudget(data);
          return;
        }
        
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
        
        console.log(`[useClientBudgetCalculation] Verificando orçamentos personalizados para ${client.company_name}:`, {
          orçamentoEncontrado: data,
          isUsingCustomBudgetInReview,
          custom_budget_id: client.lastReview?.custom_budget_id
        });
        
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
  }, [client.id, isUsingCustomBudgetInReview, client.lastReview]);
  
  // Obter dias restantes no mês usando a função corrigida
  const remainingDaysValue = getRemainingDaysInMonth();
  
  // Calcular valores para exibição
  const monthlyBudget = client.meta_ads_budget || 0;
  const totalSpentFromDB = hasReview ? (client.lastReview?.meta_total_spent || 0) : 0;
  
  // Usar o valor do banco de dados para o total gasto
  const totalSpent = totalSpentFromDB;
  
  // Obter o orçamento baseado no tipo (personalizado ou padrão)
  const getBudgetAmount = () => {
    if (isUsingCustomBudgetInReview && client.lastReview?.custom_budget_amount) {
      console.log("Usando orçamento personalizado da revisão:", client.lastReview.custom_budget_amount);
      return client.lastReview.custom_budget_amount;
    }
    
    if (customBudget) {
      console.log("Usando orçamento personalizado:", customBudget.budget_amount);
      return customBudget.budget_amount;
    }
    
    return monthlyBudget;
  };

  // Obter dias restantes e orçamento ideal com base no tipo de orçamento (regular ou personalizado)
  const getRemainingDays = () => {
    if (customBudget) {
      // Para orçamento personalizado, contar os dias entre hoje e a data de término
      // CORREÇÃO: Incluir o dia atual na contagem
      const today = getCurrentDateInBrasiliaTz();
      const endDate = new Date(customBudget.end_date);
      
      // +1 para incluir o dia atual E o dia final
      const diffTime = endDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      
      // Garantir que retorne pelo menos 1 dia (hoje)
      return Math.max(1, diffDays);
    }
    
    // Para orçamento regular, usar a função padrão
    return remainingDaysValue;
  };
  
  const getBudgetRemaining = () => {
    const budgetAmount = getBudgetAmount();
    return budgetAmount - totalSpent;
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

  // Adicionar propriedade que indica se o cliente precisa de ajuste de orçamento significativo
  // Usado para ordenação de clientes
  const needsBudgetAdjustment = hasReview && Math.abs(budgetDifference) >= 5;

  // Log para diagnóstico
  useEffect(() => {
    if (customBudget || isUsingCustomBudgetInReview) {
      console.log(`Cliente ${client.company_name} - Orçamento Info:`, {
        isUsingCustomBudgetInReview,
        customBudget: customBudget ? {
          valor: customBudget.budget_amount,
          inicio: customBudget.start_date,
          fim: customBudget.end_date
        } : 'Não encontrado',
        customBudgetFromReview: client.lastReview?.custom_budget_amount,
        diasRestantes: getRemainingDays(),
        orcamentoRestante: remainingBudget,
        orcamentoDiarioIdeal: idealDailyBudget,
        needsBudgetAdjustment
      });
    }
  }, [customBudget, client.company_name, remainingBudget, idealDailyBudget, isUsingCustomBudgetInReview, needsBudgetAdjustment]);

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
    remainingBudget,
    // Informações adicionais
    isUsingCustomBudgetInReview,
    actualBudgetAmount: getBudgetAmount(),
    // Nova propriedade para ajudar na ordenação
    needsBudgetAdjustment
  };
};
