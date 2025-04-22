
import { useState, useEffect } from "react";
import { ClientWithReview } from "./types/reviewTypes";
import { useBudgetCalculations } from "./budget/useBudgetCalculations";

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
  const [remainingDays, setRemainingDays] = useState(0);
  
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
      
      console.log(`CÁLCULO ORÇAMENTO [${client.company_name}]:`, {
        accountId_recebido: accountId, 
        tem_meta_accounts: Boolean(client.meta_accounts),
        é_array: Array.isArray(client.meta_accounts),
        num_contas: Array.isArray(client.meta_accounts) ? client.meta_accounts.length : 'N/A'
      });
      
      // Verificar se temos uma conta específica ou usamos a configuração principal do cliente
      let selectedAccount = null;
      let budget = client.meta_ads_budget || 0;
      
      // Se um accountId específico foi fornecido, buscar essa conta nas meta_accounts do cliente
      if (accountId && Array.isArray(client.meta_accounts) && client.meta_accounts.length > 0) {
        console.log(`BUSCANDO CONTA [${client.company_name}]:`, {
          accountId_buscando: accountId,
          contas_disponíveis: client.meta_accounts.map(acc => ({
            id: acc.id,
            nome: acc.account_name
          }))
        });
        
        selectedAccount = client.meta_accounts.find(account => account.id === accountId);
        
        if (selectedAccount) {
          console.log(`CONTA ENCONTRADA [${client.company_name}]:`, {
            account_name: selectedAccount.account_name,
            account_id: selectedAccount.id,
            budget: selectedAccount.budget_amount
          });
          budget = selectedAccount.budget_amount || 0;
          setAccountName(selectedAccount.account_name);
        } else {
          console.warn(`CONTA NÃO ENCONTRADA [${client.company_name}]:`, {
            accountId_buscado: accountId,
            contas_disponíveis: client.meta_accounts.map(acc => ({
              id: acc.id,
              nome: acc.account_name
            }))
          });
        }
      }
      
      setMonthlyBudget(budget);
      
      // Verificar se há revisão
      const hasReview = !!client.lastReview;
      
      if (!hasReview) {
        console.log(`SEM REVISÃO [${client.company_name}]`);
        setIsCalculating(false);
        return;
      }
      
      // Verificar orçamento personalizado na revisão
      const isUsingCustomBudget = client.lastReview?.using_custom_budget || false;
      const customBudgetAmount = client.lastReview?.custom_budget_amount || null;
      
      setIsUsingCustomBudgetInReview(isUsingCustomBudget);
      
      if (isUsingCustomBudget && customBudgetAmount) {
        console.log(`ORÇAMENTO PERSONALIZADO [${client.company_name}]:`, customBudgetAmount);
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
      
      // Definir os dias restantes
      setRemainingDays(daysRemaining);
      
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
      console.log(`RESULTADO CÁLCULO [${client.company_name}]:`, {
        orçamentoUtilizado: isUsingCustomBudget ? 'personalizado' : 'padrão',
        valor: isUsingCustomBudget ? customBudgetAmount : budget,
        totalGasto: totalSpentValue,
        orçamentoRestante: remainingBudget,
        diasRestantes: daysRemaining,
        orçamentoDiárioAtual: currentDailyBudgetValue,
        orçamentoDiárioIdeal: idealDailyBudgetValue,
        diferença: differenceValue,
        precisaAjuste: Math.abs(differenceValue) >= 5,
        accountName: accountName,
        accountId: accountId
      });
      
    } catch (error) {
      console.error(`ERRO NO CÁLCULO [${client?.company_name || 'desconhecido'}]:`, error);
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
    accountName,
    // Adicionando a propriedade restante
    remainingDaysValue: remainingDays
  };
};
