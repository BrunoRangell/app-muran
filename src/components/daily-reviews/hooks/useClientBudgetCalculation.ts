
import { useEffect } from "react";
import { ClientWithReview } from "./types/reviewTypes";
import { useBudgetFetcher } from "./budget/useBudgetFetcher";
import { useBudgetCalculations } from "./budget/useBudgetCalculations";
import { useTotalSpentCalculator } from "./budget/useTotalSpentCalculator";

export const useClientBudgetCalculation = (client: ClientWithReview, accountId?: string) => {
  // Buscar a conta específica se um ID foi fornecido, caso contrário usar a primeira conta
  const account = accountId 
    ? client.meta_accounts?.find(a => a.id === accountId) 
    : client.meta_accounts?.[0];
    
  const {
    customBudget,
    isLoadingCustomBudget,
    hasReview,
    isUsingCustomBudgetInReview
  } = useBudgetFetcher(client, accountId);
  
  // Calcular orçamento total somando todas as contas ou usar o orçamento da conta específica
  const calculateMonthlyBudget = () => {
    // Se estamos visualizando uma conta específica
    if (accountId && account) {
      return account.budget_amount || 0;
    }
    
    // Se o cliente tem contas configuradas, somar os orçamentos
    if (client.meta_accounts && client.meta_accounts.length > 0) {
      return client.meta_accounts.reduce((sum, acc) => sum + (acc.budget_amount || 0), 0);
    }
    
    // Caso contrário, usar o orçamento legado
    return client.meta_ads_budget || 0;
  };
  
  const monthlyBudget = calculateMonthlyBudget();
  
  // Cálculos de orçamento e recomendações - usando o orçamento personalizado se disponível
  const {
    totalSpent,
    currentDailyBudget,
    idealDailyBudget,
    budgetDifference,
    remainingBudget,
    remainingDays,
    actualBudgetAmount,
    needsBudgetAdjustment
  } = useBudgetCalculations(client, customBudget, isUsingCustomBudgetInReview, hasReview);
  
  // Cálculo manual de total gasto
  const {
    calculatedTotalSpent,
    isCalculating,
    calculationError,
    calculateTotalSpent
  } = useTotalSpentCalculator();

  // Log para diagnóstico
  useEffect(() => {
    if (customBudget || isUsingCustomBudgetInReview) {
      console.log(`Cliente ${client.company_name} - Orçamento Info:`, {
        isUsingCustomBudgetInReview,
        customBudget: customBudget ? {
          valor: customBudget.budget_amount,
          inicio: customBudget.start_date,
          fim: customBudget.end_date,
          isActive: customBudget.is_active
        } : 'Não encontrado',
        customBudgetFromReview: client.lastReview?.custom_budget_amount,
        customBudgetEndDate: client.lastReview?.custom_budget_end_date,
        diasRestantes: remainingDays,
        orcamentoRestante: remainingBudget,
        orcamentoDiarioIdeal: idealDailyBudget,
        needsBudgetAdjustment,
        orçamentoDiárioAtual: currentDailyBudget,
        diferençaOrçamento: budgetDifference
      });
    }
    
    // Atualizar a propriedade needsBudgetAdjustment no objeto client
    if (client && needsBudgetAdjustment !== undefined) {
      client.needsBudgetAdjustment = needsBudgetAdjustment;
    }
  }, [
    customBudget, 
    client, 
    client.company_name, 
    remainingBudget, 
    idealDailyBudget, 
    isUsingCustomBudgetInReview, 
    needsBudgetAdjustment, 
    remainingDays, 
    client.lastReview?.custom_budget_amount,
    client.lastReview?.custom_budget_end_date,
    currentDailyBudget,
    budgetDifference
  ]);

  return {
    hasReview,
    isCalculating,
    calculationError,
    monthlyBudget,
    totalSpent,
    currentDailyBudget,
    idealDailyBudget,
    budgetDifference,
    remainingDaysValue: remainingDays,
    calculateTotalSpent: () => calculateTotalSpent(account?.account_id || null, customBudget),
    customBudget,
    isLoadingCustomBudget,
    remainingBudget,
    isUsingCustomBudgetInReview,
    actualBudgetAmount,
    needsBudgetAdjustment,
    accountName: account?.account_name
  };
};
