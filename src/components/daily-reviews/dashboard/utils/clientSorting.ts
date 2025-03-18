
import { ClientWithReview } from "../../hooks/types/reviewTypes";
import { calculateBudgetAdjustment, clientNeedsAdjustment } from "./clientFiltering";

/**
 * Ordena clientes com base no critério selecionado
 */
export const sortClients = (
  clients: ClientWithReview[], 
  sortBy: string
): ClientWithReview[] => {
  return [...clients].sort((a, b) => {
    // Primeiro separa clientes com e sem conta Meta
    if (!a.meta_account_id && b.meta_account_id) return 1;
    if (a.meta_account_id && !b.meta_account_id) return -1;
    
    // Se ambos não têm conta Meta, ordena por nome
    if (!a.meta_account_id && !b.meta_account_id) {
      return a.company_name.localeCompare(b.company_name);
    }
    
    // Agora aplica a lógica de ordenação específica
    if (sortBy === "adjustments") {
      const aNeedsAdjustment = clientNeedsAdjustment(a);
      const bNeedsAdjustment = clientNeedsAdjustment(b);
      
      // Clientes que precisam de ajuste vêm primeiro
      if (aNeedsAdjustment && !bNeedsAdjustment) return -1;
      if (!aNeedsAdjustment && bNeedsAdjustment) return 1;
      
      // Se ambos precisam ou não precisam de ajuste, ordena pelo tamanho do ajuste (decrescente)
      if (aNeedsAdjustment && bNeedsAdjustment) {
        const adjustmentA = calculateBudgetAdjustment(a);
        const adjustmentB = calculateBudgetAdjustment(b);
        return adjustmentB - adjustmentA;
      }
      
      // Se nenhum precisa de ajuste, ordena por nome
      return a.company_name.localeCompare(b.company_name);
    } else if (sortBy === "name") {
      return a.company_name.localeCompare(b.company_name);
    } else if (sortBy === "budget") {
      // Para orçamento, considerar o personalizado se estiver ativo
      const budgetA = a.lastReview?.using_custom_budget ? 
        (a.lastReview.custom_budget_amount || 0) : (a.meta_ads_budget || 0);
      
      const budgetB = b.lastReview?.using_custom_budget ? 
        (b.lastReview.custom_budget_amount || 0) : (b.meta_ads_budget || 0);
      
      return budgetB - budgetA;
    } else if (sortBy === "lastReview") {
      const dateA = a.lastReview?.updated_at ? new Date(a.lastReview.updated_at).getTime() : 0;
      const dateB = b.lastReview?.updated_at ? new Date(b.lastReview.updated_at).getTime() : 0;
      return dateB - dateA;
    }
    
    return 0;
  });
};

/**
 * Divide os clientes entre os que têm Meta ID e os que não têm
 */
export const splitClientsByMetaId = (clients: ClientWithReview[]) => {
  const clientsWithMetaId = clients.filter(client => client.meta_account_id);
  const clientsWithoutMetaId = clients.filter(client => !client.meta_account_id);
  
  return { clientsWithMetaId, clientsWithoutMetaId };
};
