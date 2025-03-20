
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
  
  // Verifica se o cliente tem ajuste significativo
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
  
  // Obtém valores da revisão
  const currentDailyBudget = client.lastReview?.meta_daily_budget_current || 0;
  
  // Se estiver usando orçamento personalizado, usa APENAS os valores do orçamento personalizado
  if (client.lastReview?.using_custom_budget) {
    console.log(`Calculando ajuste para cliente com orçamento personalizado: ${client.company_name}`);
    
    // Verificar se há valor ideal calculado na revisão
    if (client.lastReview.idealDailyBudget) {
      const idealDailyBudget = client.lastReview.idealDailyBudget;
      console.log(`Cliente ${client.company_name} - Orçamento personalizado:`, {
        orçamentoDiárioAtual: currentDailyBudget,
        orçamentoDiárioIdeal: idealDailyBudget,
        diferença: Math.abs(idealDailyBudget - currentDailyBudget)
      });
      return Math.abs(idealDailyBudget - currentDailyBudget);
    }
    
    // Se não tiver valor ideal calculado, calcula com base no orçamento personalizado
    if (client.lastReview.custom_budget_amount && client.lastReview.custom_budget_end_date) {
      const customBudgetAmount = client.lastReview.custom_budget_amount;
      const endDate = new Date(client.lastReview.custom_budget_end_date);
      const today = new Date();
      
      // Calcular dias restantes (+1 para incluir o dia atual)
      const diffTime = Math.abs(endDate.getTime() - today.getTime());
      const remainingDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      
      const totalSpent = client.lastReview.meta_total_spent || 0;
      const remainingBudget = customBudgetAmount - totalSpent;
      
      // Se não houver dias restantes ou orçamento restante negativo, retorna 0
      if (remainingDays <= 0 || remainingBudget <= 0) return 0;
      
      const idealDailyBudget = remainingBudget / remainingDays;
      
      console.log(`Cliente ${client.company_name} - Orçamento personalizado calculado:`, {
        orçamentoPersonalizado: customBudgetAmount,
        diasRestantes: remainingDays,
        orçamentoDiárioAtual: currentDailyBudget,
        orçamentoDiárioIdeal: idealDailyBudget,
        diferença: Math.abs(idealDailyBudget - currentDailyBudget)
      });
      
      return Math.abs(idealDailyBudget - currentDailyBudget);
    }
    
    return 0;
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
