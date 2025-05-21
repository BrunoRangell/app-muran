
import { useMemo } from "react";
import { ClientWithReview } from "../types/reviewTypes";
import { CustomBudgetState } from "./types";

export const useTotalBudgetCalculation = (
  client: ClientWithReview, 
  customBudgetState: CustomBudgetState
): number => {
  const { usingCustomBudget, customBudgetAmount } = customBudgetState;
  
  // Calcular o orçamento total do Google Ads somando todas as contas
  return useMemo(() => {
    // Se estiver usando orçamento personalizado, usar esse valor
    if (usingCustomBudget && customBudgetAmount) {
      return customBudgetAmount;
    }
    
    // Se não tiver contas Google configuradas, usar o valor legado
    if (!client.google_accounts || client.google_accounts.length === 0) {
      return client.google_ads_budget || 0;
    }
    
    // Caso contrário, somar o orçamento de todas as contas Google
    return client.google_accounts.reduce((sum, account) => {
      return sum + (account.budget_amount || 0);
    }, 0);
  }, [client, usingCustomBudget, customBudgetAmount]);
};
