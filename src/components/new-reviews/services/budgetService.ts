
import { supabase } from "@/lib/supabase";
import { getCurrentDateInBrasiliaTz } from "@/utils/dateUtils";
import { CustomBudget } from "../types/budgetTypes";

/**
 * Busca orçamento personalizado ativo para um cliente e plataforma específicos
 */
export async function getActiveCustomBudget(
  clientId: string, 
  platform: 'meta' | 'google' = 'meta',
  accountId?: string
): Promise<CustomBudget | null> {
  const today = getCurrentDateInBrasiliaTz().toISOString().split('T')[0];
  
  // Buscar na tabela unificada de orçamentos personalizados
  const { data, error } = await supabase
    .from("custom_budgets")
    .select("*")
    .eq("client_id", clientId)
    .eq("platform", platform)
    .eq("is_active", true)
    .lte("start_date", today)
    .gte("end_date", today)
    .order("created_at", { ascending: false });
    
  if (error) {
    console.error("Erro ao buscar orçamento personalizado:", error.message);
    return null;
  }
  
  if (!data || data.length === 0) {
    // Se não há orçamentos personalizados, retorna null
    return null;
  }
  
  // Se temos um accountId específico, filtrar por ele
  if (accountId) {
    // Primeiro, verificar orçamentos específicos para esta conta
    const accountSpecificBudget = data.filter(budget => 
      budget.account_id === accountId
    );
    
    if (accountSpecificBudget.length > 0) {
      return accountSpecificBudget[0];
    }
    
    // Se não encontrou específico, verificar orçamentos globais (sem account_id)
    const globalBudget = data.filter(budget => !budget.account_id);
    if (globalBudget.length > 0) {
      return globalBudget[0];
    }
  }
  
  // Caso contrário, retorna o primeiro orçamento encontrado
  return data[0];
}

/**
 * Adiciona informações de orçamento personalizado a um payload
 */
export function prepareCustomBudgetInfo(customBudget: CustomBudget | null) {
  if (!customBudget) {
    return {
      using_custom_budget: false,
      custom_budget_id: null,
      custom_budget_amount: null,
      custom_budget_start_date: null,
      custom_budget_end_date: null
    };
  }
  
  return {
    using_custom_budget: true,
    custom_budget_id: customBudget.id,
    custom_budget_amount: customBudget.budget_amount,
    custom_budget_start_date: customBudget.start_date,
    custom_budget_end_date: customBudget.end_date
  };
}

/**
 * Verifica se há algum orçamento personalizado conflitante para o período
 */
export async function checkForConflictingBudgets(
  clientId: string,
  platform: 'meta' | 'google',
  startDate: string,
  endDate: string,
  accountId?: string | null,
  currentBudgetId?: string
): Promise<boolean> {
  let query = supabase
    .from("custom_budgets")
    .select("*")
    .eq("client_id", clientId)
    .eq("platform", platform)
    .eq("is_active", true)
    // Verificar sobreposição de datas
    .or(`start_date.lte.${endDate},end_date.gte.${startDate}`);
  
  // Se há um ID de conta específico, verificar apenas orçamentos para essa conta ou globais
  if (accountId) {
    query = query.or(`account_id.eq.${accountId},account_id.is.null`);
  }
  
  // Se estamos editando um orçamento existente, excluí-lo da verificação
  if (currentBudgetId) {
    query = query.neq("id", currentBudgetId);
  }
  
  const { data, error } = await query;
  
  if (error) {
    console.error("Erro ao verificar orçamentos conflitantes:", error);
    return false;
  }
  
  return data && data.length > 0;
}

/**
 * Cria um novo orçamento personalizado
 */
export async function createCustomBudget(budgetData: Omit<CustomBudget, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from("custom_budgets")
    .insert(budgetData)
    .select();
    
  if (error) {
    throw new Error(`Erro ao criar orçamento personalizado: ${error.message}`);
  }
  
  return data?.[0] || null;
}

/**
 * Atualiza um orçamento personalizado existente
 */
export async function updateCustomBudget(
  id: string,
  budgetData: Partial<Omit<CustomBudget, 'id' | 'created_at' | 'updated_at'>>
) {
  const { data, error } = await supabase
    .from("custom_budgets")
    .update(budgetData)
    .eq("id", id)
    .select();
    
  if (error) {
    throw new Error(`Erro ao atualizar orçamento personalizado: ${error.message}`);
  }
  
  return data?.[0] || null;
}

/**
 * Exclui um orçamento personalizado
 */
export async function deleteCustomBudget(id: string) {
  const { error } = await supabase
    .from("custom_budgets")
    .delete()
    .eq("id", id);
    
  if (error) {
    throw new Error(`Erro ao excluir orçamento personalizado: ${error.message}`);
  }
  
  return true;
}

/**
 * Ativa ou desativa um orçamento personalizado
 */
export async function toggleCustomBudgetStatus(id: string, isActive: boolean) {
  const { data, error } = await supabase
    .from("custom_budgets")
    .update({ is_active: isActive })
    .eq("id", id)
    .select();
    
  if (error) {
    throw new Error(`Erro ao alterar status do orçamento personalizado: ${error.message}`);
  }
  
  return data?.[0] || null;
}
