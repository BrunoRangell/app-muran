
import { useState, useEffect } from "react";
import { ClientWithReview } from "./types/reviewTypes";

export const useClientBudgetCalculation = (client: ClientWithReview, accountId?: string) => {
  const [isCalculating, setIsCalculating] = useState(true);
  const [calculationError, setCalculationError] = useState<string | null>(null);
  const [accountName, setAccountName] = useState<string | null>(null);
  
  // Estados de orçamento
  const [monthlyBudget, setMonthlyBudget] = useState(0);
  const [totalSpent, setTotalSpent] = useState(0);
  const [currentDailyBudget, setCurrentDailyBudget] = useState(0);
  const [idealDailyBudget, setIdealDailyBudget] = useState(0);
  const [budgetDifference, setBudgetDifference] = useState(0);
  
  // Estados para orçamento personalizado
  const [customBudget, setCustomBudget] = useState<any>(null);
  const [isUsingCustomBudgetInReview, setIsUsingCustomBudgetInReview] = useState(false);
  const [actualBudgetAmount, setActualBudgetAmount] = useState<number | null>(null);
  
  useEffect(() => {
    calculateBudgets();
  }, [client, accountId]);
  
  const calculateBudgets = () => {
    try {
      setIsCalculating(true);
      setCalculationError(null);
      
      // Se não houver cliente, retornar
      if (!client) {
        throw new Error("Cliente não fornecido");
      }
      
      console.log(`Calculando orçamentos para cliente ${client.company_name}${accountId ? ` (conta ID: ${accountId})` : ''}`);
      
      // Verificar se temos uma conta específica ou usamos a configuração principal do cliente
      let selectedAccount = null;
      let budget = client.meta_ads_budget || 0;
      
      // Se um accountId específico foi fornecido, buscar essa conta nas meta_accounts do cliente
      if (accountId && client.meta_accounts && client.meta_accounts.length > 0) {
        selectedAccount = client.meta_accounts.find(account => account.id === accountId);
        
        if (selectedAccount) {
          console.log(`Encontrada conta secundária: ${selectedAccount.account_name} (${selectedAccount.account_id})`);
          budget = selectedAccount.budget_amount || 0;
          setAccountName(selectedAccount.account_name);
        } else {
          console.warn(`Conta com ID ${accountId} não encontrada para o cliente ${client.company_name}`);
        }
      }
      
      setMonthlyBudget(budget);
      
      // Verificar se há revisão
      const hasReview = !!client.lastReview;
      
      if (!hasReview) {
        console.log(`Cliente ${client.company_name} não tem revisão`);
        setIsCalculating(false);
        return;
      }
      
      // Verificar orçamento personalizado na revisão
      const isUsingCustomBudget = client.lastReview?.using_custom_budget || false;
      const customBudgetAmount = client.lastReview?.custom_budget_amount || null;
      
      setIsUsingCustomBudgetInReview(isUsingCustomBudget);
      
      if (isUsingCustomBudget && customBudgetAmount) {
        console.log(`Usando orçamento personalizado da revisão: ${customBudgetAmount}`);
        setCustomBudget({
          valor: customBudgetAmount,
          inicio: client.lastReview?.custom_budget_start_date,
          fim: client.lastReview?.custom_budget_end_date,
          isActive: true
        });
        
        setActualBudgetAmount(customBudgetAmount);
      } else {
        setActualBudgetAmount(budget);
      }
      
      // Extrair valores de gasto e orçamento da revisão
      const totalSpentValue = client.lastReview?.meta_total_spent || 0;
      const currentDailyBudgetValue = client.lastReview?.meta_daily_budget_current || 0;
      
      setTotalSpent(totalSpentValue);
      setCurrentDailyBudget(currentDailyBudgetValue);
      
      // Calcular orçamento diário ideal
      const now = new Date();
      const currentDay = now.getDate();
      const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      const daysRemaining = lastDayOfMonth - currentDay + 1;
      
      // Usar orçamento personalizado ou mensal padrão
      const budgetAmount = isUsingCustomBudget && customBudgetAmount 
        ? customBudgetAmount 
        : budget;
      
      const remainingBudget = budgetAmount - totalSpentValue;
      const idealDailyBudgetValue = remainingBudget > 0 && daysRemaining > 0 
        ? remainingBudget / daysRemaining 
        : 0;
      
      setIdealDailyBudget(idealDailyBudgetValue);
      
      // Calcular diferença entre orçamento atual e ideal
      const differenceValue = idealDailyBudgetValue - currentDailyBudgetValue;
      setBudgetDifference(differenceValue);
      
      // Diagnóstico detalhado para debug
      console.log(`Diagnóstico de orçamento ${isUsingCustomBudget ? 'personalizado' : 'padrão'} para ${client.company_name}:`, {
        orçamentoPersonalizado: isUsingCustomBudget ? customBudgetAmount : budget,
        totalGasto: totalSpentValue,
        orçamentoRestante: remainingBudget,
        diasRestantes: daysRemaining,
        orçamentoDiárioAtual: currentDailyBudgetValue,
        orçamentoDiárioIdeal: idealDailyBudgetValue,
        diferença: differenceValue,
        precisaAjuste: Math.abs(differenceValue) >= 5
      });
      
    } catch (error) {
      console.error(`Erro ao calcular orçamentos para ${client.company_name}:`, error);
      setCalculationError(error instanceof Error ? error.message : String(error));
    } finally {
      setIsCalculating(false);
    }
  };
  
  // Flag para verificar se há uma revisão para este cliente
  const hasReview = !!client?.lastReview;
  
  return {
    hasReview,
    isCalculating,
    calculationError,
    monthlyBudget,
    totalSpent,
    currentDailyBudget,
    idealDailyBudget,
    budgetDifference,
    // Informações sobre orçamento personalizado
    customBudget,
    isUsingCustomBudgetInReview,
    actualBudgetAmount,
    accountName
  };
};
