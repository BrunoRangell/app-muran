
import { supabase } from "@/lib/supabase";

/**
 * Verifica se existe um orçamento personalizado ativo para o cliente na data atual
 */
export async function getActiveCustomBudget(clientId: string, accountId?: string) {
  const today = new Date().toISOString().split('T')[0];
  
  // Primeiro tenta buscar um orçamento específico para a conta (se fornecida)
  if (accountId) {
    const { data: specificBudget, error: specificError } = await supabase
      .from("custom_budgets")
      .select("*")
      .eq("client_id", clientId)
      .eq("is_active", true)
      .eq("platform", "meta")
      .eq("account_id", accountId)
      .lte("start_date", today)
      .gte("end_date", today)
      .order("created_at", { ascending: false })
      .maybeSingle();
      
    if (!specificError && specificBudget) {
      console.log(`[getActiveCustomBudget] Encontrado orçamento específico para conta ${accountId}`);
      return specificBudget;
    }
    
    if (specificError) {
      console.error("Erro ao buscar orçamento personalizado específico:", specificError);
    }
  }
  
  // Se não encontrar um específico para a conta, busca um orçamento geral
  const { data, error } = await supabase
    .from("custom_budgets")
    .select("*")
    .eq("client_id", clientId)
    .eq("is_active", true)
    .eq("platform", "meta")
    .is("account_id", null)
    .lte("start_date", today)
    .gte("end_date", today)
    .order("created_at", { ascending: false })
    .maybeSingle();
    
  if (error) {
    console.error("Erro ao buscar orçamento personalizado geral:", error);
    return null;
  }
  
  return data;
}

/**
 * Adiciona informações de orçamento personalizado ao payload
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
