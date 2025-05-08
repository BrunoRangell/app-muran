
import { supabase } from "@/lib/supabase";

/**
 * Busca um orçamento personalizado ativo para um cliente/conta específico
 */
export async function findActiveCustomBudget(clientId: string, accountId?: string, platform: 'meta'|'google' = 'meta') {
  const today = new Date().toISOString().split('T')[0];
  
  let query = supabase
    .from("custom_budgets")
    .select("*")
    .eq("client_id", clientId)
    .eq("is_active", true)
    .eq("platform", platform)
    .lte("start_date", today)
    .gte("end_date", today);
    
  // Se tiver um ID de conta específico, filtrar por ele
  if (accountId) {
    query = query.eq("account_id", accountId);
  } else {
    query = query.is("account_id", null);
  }
  
  const { data, error } = await query.order("created_at", { ascending: false }).maybeSingle();
    
  if (error) {
    console.error(`Erro ao buscar orçamento personalizado para ${platform}:`, error);
    return null;
  }
  
  return data;
}

/**
 * Prepara o objeto com as informações de orçamento personalizado
 * para incluir nas chamadas de API
 */
export function prepareCustomBudgetInfo(customBudget: any | null) {
  return customBudget ? {
    using_custom_budget: true,
    custom_budget_id: customBudget.id,
    custom_budget_amount: customBudget.budget_amount
  } : {
    using_custom_budget: false,
    custom_budget_id: null,
    custom_budget_amount: null
  };
}
