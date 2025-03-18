
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
  
  // Obter valores da revisão
  const currentDailyBudget = client.lastReview?.meta_daily_budget_current || 0;
  
  // Se o orçamento diário atual for 0, não é possível calcular ajuste
  if (currentDailyBudget === 0) return 0;
  
  // Se estiver usando orçamento personalizado, usar a lógica específica para isso
  if (client.lastReview?.using_custom_budget) {
    // Para orçamentos personalizados, precisamos calcular o orçamento diário ideal
    // com base no período do orçamento personalizado
    const today = new Date();
    
    // Não temos acesso direto à data de término do orçamento personalizado na revisão
    // Vamos buscar isso do orçamento personalizado associado ou usar uma lógica alternativa
    
    // Verificar se temos o ID do orçamento personalizado
    if (!client.lastReview.custom_budget_id) {
      console.log(`Cliente ${client.company_name}: Sem ID de orçamento personalizado.`);
      return 0;
    }
    
    // Não temos a data de término aqui, então precisamos calcular diferentemente
    // Podemos usar um valor aproximado baseado nas informações disponíveis
    
    // Obter valores de orçamento personalizado da revisão
    const customBudgetAmount = client.lastReview.custom_budget_amount || 0;
    const totalSpent = client.lastReview.meta_total_spent || 0;
    const remaining = customBudgetAmount - totalSpent;
    
    // Assumir um período padrão de dias restantes (por exemplo, 30 dias)
    // Isso é uma solução temporária até termos uma forma melhor de obter a data real
    const assumedDaysRemaining = 30;
    
    // Calcular orçamento diário ideal para o período personalizado
    const idealDailyBudget = remaining / assumedDaysRemaining;
    
    console.log(`Cliente ${client.company_name} (Personalizado): Ideal=${idealDailyBudget.toFixed(2)}, Atual=${currentDailyBudget.toFixed(2)}, Diferença=${Math.abs(idealDailyBudget - currentDailyBudget).toFixed(2)}`);
    
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
