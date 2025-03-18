
import { supabase } from "@/lib/supabase";

/**
 * Verifica se existe um orçamento personalizado ativo para o cliente na data atual
 */
export async function getActiveCustomBudget(clientId: string) {
  const today = new Date().toISOString().split('T')[0];
  
  const { data, error } = await supabase
    .from("meta_custom_budgets")
    .select("*")
    .eq("client_id", clientId)
    .eq("is_active", true)
    .lte("start_date", today)
    .gte("end_date", today)
    .order("created_at", { ascending: false })
    .maybeSingle();
    
  if (error) {
    console.error("Erro ao buscar orçamento personalizado:", error);
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
    custom_budget_amount: customBudget.budget_amount,
    custom_budget_start_date: customBudget.start_date,
    custom_budget_end_date: customBudget.end_date
  } : {
    using_custom_budget: false,
    custom_budget_id: null,
    custom_budget_amount: null,
    custom_budget_start_date: null,
    custom_budget_end_date: null
  };
}
