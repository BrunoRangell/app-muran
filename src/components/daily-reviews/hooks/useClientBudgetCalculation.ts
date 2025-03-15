
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { getMetaAccessToken } from "./useEdgeFunction";
import { getCurrentDateInBrasiliaTz, getRemainingDaysInMonth } from "../summary/utils";
import { ClientWithReview } from "./types/reviewTypes";

export const useClientBudgetCalculation = (client: ClientWithReview) => {
  const [calculatedTotalSpent, setCalculatedTotalSpent] = useState<number | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [calculationError, setCalculationError] = useState<string | null>(null);
  const [calculationAttempted, setCalculationAttempted] = useState(true);
  const [customBudget, setCustomBudget] = useState<any | null>(null);
  const [isLoadingCustomBudget, setIsLoadingCustomBudget] = useState(false);
  
  const hasReview = !!client.lastReview;
  const isUsingCustomBudgetInReview = hasReview && client.lastReview?.using_custom_budget === true;
  
  useEffect(() => {
    const fetchCustomBudget = async () => {
      try {
        setIsLoadingCustomBudget(true);
        
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
  
  const remainingDaysValue = getRemainingDaysInMonth();
  
  const monthlyBudget = client.meta_ads_budget || 0;
  const totalSpentFromDB = hasReview ? (client.lastReview?.meta_total_spent || 0) : 0;
  
  const totalSpent = totalSpentFromDB;
  
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

  const getRemainingDays = () => {
    if (customBudget) {
      const today = getCurrentDateInBrasiliaTz();
      const endDate = new Date(customBudget.end_date);
      
      const diffTime = endDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      
      return Math.max(1, diffDays);
    }
    
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
  
  const idealDailyBudget = getDailyBudgetIdeal();
  
  const currentDailyBudget = hasReview && client.lastReview?.meta_daily_budget_current !== null
    ? client.lastReview.meta_daily_budget_current
    : 0;

  const budgetDifference = idealDailyBudget - currentDailyBudget;

  // Mova esta declaração para ANTES do seu uso em needsBudgetAdjustment
  const hasDailyBudget = hasReview && 
    client.lastReview?.meta_daily_budget_current !== null && 
    client.lastReview?.meta_daily_budget_current !== undefined;

  const needsBudgetAdjustment = hasReview && 
    hasDailyBudget && 
    Math.abs(budgetDifference) >= 5;

  const calculateTotalSpent = async () => {
    if (!client.meta_account_id) {
      setCalculationError("Cliente sem ID de conta Meta configurado");
      setCalculationAttempted(true);
      return;
    }

    try {
      setIsCalculating(true);
      setCalculationError(null);
      
      const accessToken = await getMetaAccessToken();
      
      if (!accessToken) {
        throw new Error("Token de acesso Meta não disponível");
      }
      
      const now = getCurrentDateInBrasiliaTz();
      
      let startDate;
      if (customBudget) {
        startDate = new Date(customBudget.start_date);
        if (startDate > now) {
          throw new Error("A data de início do orçamento é no futuro");
        }
      } else {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      }
      
      const dateRange = {
        start: startDate.toISOString().split('T')[0],
        end: now.toISOString().split('T')[0]
      };
      
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
    calculateTotalSpent,
    customBudget,
    isLoadingCustomBudget,
    remainingBudget,
    isUsingCustomBudgetInReview,
    actualBudgetAmount: getBudgetAmount(),
    hasDailyBudget,
    needsBudgetAdjustment
  };
};
