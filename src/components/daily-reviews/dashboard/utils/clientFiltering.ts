
import { ClientWithReview } from "../../hooks/types/reviewTypes";

/**
 * Filtra clientes por nome
 */
export const filterClientsByName = (
  clients: ClientWithReview[], 
  searchQuery: string
): ClientWithReview[] => {
  if (!searchQuery.trim()) return clients;
  
  return clients.filter(client => 
    client.company_name.toLowerCase().includes(searchQuery.toLowerCase())
  );
};

/**
 * Verifica se um cliente precisa de ajuste (diferença >= 5)
 */
export const clientNeedsAdjustment = (client: ClientWithReview): boolean => {
  if (!client.lastReview) return false;
  
  const adjustment = calculateBudgetAdjustment(client);
  return adjustment >= 5;
};

/**
 * Filtra apenas clientes que precisam de ajuste
 */
export const filterClientsByAdjustment = (
  clients: ClientWithReview[], 
  showOnlyAdjustments: boolean
): ClientWithReview[] => {
  if (!showOnlyAdjustments) return clients;
  
  return clients.filter(client => clientNeedsAdjustment(client));
};

/**
 * Calcula o ajuste de orçamento necessário para cada cliente
 */
export const calculateBudgetAdjustment = (client: ClientWithReview): number => {
  // Se não tem revisão ou ID de conta Meta, retorna 0
  if (!client.lastReview || !client.meta_account_id) return 0;
  
  // Obtem valores da revisão
  const currentDailyBudget = client.lastReview?.meta_daily_budget_current || 0;
  
  // Se estiver usando orçamento personalizado, usa os valores do orçamento personalizado
  if (client.lastReview?.using_custom_budget) {
    // Valida se há orçamento diário ideal
    if (!client.lastReview || currentDailyBudget === 0) return 0;
    
    // Ideal diário para orçamento personalizado
    const idealDailyBudget = client.lastReview.idealDailyBudget || 0;
    
    // Retorna a diferença absoluta
    return Math.abs(idealDailyBudget - currentDailyBudget);
  } else {
    // Para orçamento regular
    const today = new Date();
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    const dayOfMonth = today.getDate();
    const daysRemaining = daysInMonth - dayOfMonth + 1;
    
    const monthlyBudget = client.meta_ads_budget || 0;
    const totalSpent = client.lastReview.meta_total_spent || 0;
    const remaining = monthlyBudget - totalSpent;
    const idealDailyBudget = daysRemaining > 0 ? remaining / daysRemaining : 0;
    
    return Math.abs(idealDailyBudget - currentDailyBudget);
  }
};
