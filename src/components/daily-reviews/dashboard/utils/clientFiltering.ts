
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
  // Verificar se a propriedade needsBudgetAdjustment já está presente
  if (client.needsBudgetAdjustment !== undefined) {
    return client.needsBudgetAdjustment;
  }
  
  // Se não tiver revisão ou ID de conta Meta, retorna falso
  if (!client.lastReview || !client.meta_account_id) return false;
  
  // Verificar se a diferença de orçamento é significativa (≥ 5)
  const currentBudget = client.lastReview.google_daily_budget_current || 0;
  
  // Calcular o orçamento ideal (se não estiver já calculado)
  let idealBudget = client.lastReview.idealDailyBudget;
  
  if (idealBudget === undefined) {
    // Se estiver usando orçamento personalizado, usar o valor adequado
    if (client.lastReview.using_custom_budget && client.lastReview.custom_budget_amount) {
      // Aqui precisamos calcular o orçamento ideal com base no orçamento personalizado
      // Usar valores salvos ou fazer o cálculo em tempo real
      const totalSpent = client.lastReview.google_total_spent || 0;
      const budgetAmount = client.lastReview.custom_budget_amount || client.meta_ads_budget || 0;
      
      // Cálculo básico (similar ao que seria feito no backend)
      const today = new Date();
      const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      const remainingDays = lastDayOfMonth.getDate() - today.getDate() + 1;
      
      idealBudget = remainingDays > 0 ? (budgetAmount - totalSpent) / remainingDays : 0;
    } else {
      // Para orçamento regular
      const totalSpent = client.lastReview.google_total_spent || 0;
      const budgetAmount = client.meta_ads_budget || 0;
      
      const today = new Date();
      const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      const remainingDays = lastDayOfMonth.getDate() - today.getDate() + 1;
      
      idealBudget = remainingDays > 0 ? (budgetAmount - totalSpent) / remainingDays : 0;
    }
  }
  
  const budgetDiff = Math.abs(idealBudget - currentBudget);
  console.log(`Cliente ${client.company_name}: orçamento atual ${currentBudget}, ideal ${idealBudget}, diferença ${budgetDiff}`);
  
  return budgetDiff >= 5;
};

/**
 * Filtra apenas clientes que precisam de ajuste
 */
export const filterClientsByAdjustment = (
  clients: ClientWithReview[], 
  showOnlyAdjustments: boolean
): ClientWithReview[] => {
  if (!showOnlyAdjustments) return clients;
  
  const filteredClients = clients.filter(client => {
    const needsAdjustment = clientNeedsAdjustment(client);
    
    if (needsAdjustment) {
      console.log(`Cliente filtrado que precisa de ajuste: ${client.company_name}`, {
        budgetDifference: client.lastReview?.idealDailyBudget !== undefined
          ? Math.abs((client.lastReview.idealDailyBudget || 0) - (client.lastReview.google_daily_budget_current || 0))
          : "N/A",
        usingCustomBudget: client.lastReview?.using_custom_budget || false
      });
    }
    
    return needsAdjustment;
  });
  
  console.log(`Clientes filtrados por ajuste: ${filteredClients.length} de ${clients.length}`);
  return filteredClients;
};

/**
 * Calcula o ajuste de orçamento necessário para cada cliente
 */
export const calculateBudgetAdjustment = (client: ClientWithReview): number => {
  // Se não tem revisão ou ID de conta Meta, retorna 0
  if (!client.lastReview || !client.meta_account_id) return 0;
  
  // Obtém valores da revisão
  const currentDailyBudget = client.lastReview?.google_daily_budget_current || 0;
  
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
      
      const totalSpent = client.lastReview.google_total_spent || 0;
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
    const totalSpent = client.lastReview.google_total_spent || 0;
    const remaining = monthlyBudget - totalSpent;
    const idealDailyBudget = daysRemaining > 0 ? remaining / daysRemaining : 0;
    
    return Math.abs(idealDailyBudget - currentDailyBudget);
  }
};
