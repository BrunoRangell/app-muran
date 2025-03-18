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
 * Verifica se um cliente precisa de ajuste com base no flag na revisão
 */
export const clientNeedsAdjustment = (client: ClientWithReview): boolean => {
  // Verificação simplificada: utiliza o campo needsBudgetAdjustment da última revisão
  return client.lastReview?.needsBudgetAdjustment === true;
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
 * Nota: Mantido para compatibilidade, mas não é mais usado na ordenação e filtragem
 */
export const calculateBudgetAdjustment = (client: ClientWithReview): number => {
  // Se não tem revisão ou ID de conta Meta, retorna 0
  if (!client.lastReview || !client.meta_account_id) return 0;
  
  // Obter valores da revisão
  const currentDailyBudget = client.lastReview?.meta_daily_budget_current || 0;
  
  // Se o orçamento diário atual for 0, não é possível calcular ajuste
  if (currentDailyBudget === 0) return 0;
  
  // Se estiver usando orçamento personalizado, usar a lógica específica para isso
  if (client.lastReview?.using_custom_budget) {
    // Para orçamentos personalizados, precisamos calcular o orçamento diário ideal
    // com base no período do orçamento personalizado
    const today = new Date();
    
    // Verificar se temos o ID do orçamento personalizado
    if (!client.lastReview.custom_budget_id) {
      console.log(`Cliente ${client.company_name}: Sem ID de orçamento personalizado.`);
      return 0;
    }
    
    // Obter valores de orçamento personalizado da revisão
    const customBudgetAmount = client.lastReview.custom_budget_amount || 0;
    const totalSpent = client.lastReview.meta_total_spent || 0;
    const remaining = customBudgetAmount - totalSpent;
    
    // Calcular ajuste baseado no orçamento personalizado
    let daysRemaining;
    
    // Se temos as datas de início e fim no objeto de revisão
    if (client.lastReview.custom_budget_end_date) {
      const endDate = new Date(client.lastReview.custom_budget_end_date);
      // Calcular dias restantes do período personalizado
      const diffTime = endDate.getTime() - today.getTime();
      daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 para incluir o dia atual
      daysRemaining = Math.max(1, daysRemaining); // Garantir pelo menos 1 dia restante
    } else {
      // Se não temos as datas no objeto de revisão, usar um valor padrão
      // Isso será melhorado quando tivermos essas informações disponíveis
      daysRemaining = 30;
    }
    
    // Calcular orçamento diário ideal para o período personalizado
    const idealDailyBudget = daysRemaining > 0 ? remaining / daysRemaining : 0;
    
    console.log(`Cliente ${client.company_name} (Personalizado): Ideal=${idealDailyBudget.toFixed(2)}, Atual=${currentDailyBudget.toFixed(2)}, Diferença=${Math.abs(idealDailyBudget - currentDailyBudget).toFixed(2)}, Dias restantes=${daysRemaining}`);
    
    // Retornar a diferença absoluta
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
    
    console.log(`Cliente ${client.company_name} (Regular): Ideal=${idealDailyBudget.toFixed(2)}, Atual=${currentDailyBudget.toFixed(2)}, Diferença=${Math.abs(idealDailyBudget - currentDailyBudget).toFixed(2)}`);
    
    return Math.abs(idealDailyBudget - currentDailyBudget);
  }
};
