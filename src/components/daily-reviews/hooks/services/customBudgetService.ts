
import { supabase } from "@/lib/supabase";

/**
 * Verifica se existe um orçamento personalizado ativo para o cliente na data atual
 * Opcionalmente filtra por accountId específico
 */
export async function getActiveCustomBudget(clientId: string, accountId?: string, platform?: string) {
  const today = new Date().toISOString().split('T')[0];
  
  let query = supabase
    .from("custom_budgets")
    .select("*")
    .eq("client_id", clientId)
    .eq("is_active", true)
    .lte("start_date", today)
    .gte("end_date", today)
    .order("created_at", { ascending: false });
  
  // Se foi fornecido um ID de conta específico, procurar por orçamentos da conta específica
  // ou orçamentos gerais (sem account_id específico)
  if (accountId) {
    query = query.or(`account_id.eq.${accountId},account_id.is.null`);
  }
  
  // Se foi especificada uma plataforma, filtrar por ela
  if (platform) {
    query = query.eq("platform", platform);
  }
  
  const { data, error } = await query.maybeSingle();
    
  if (error) {
    console.error("Erro ao buscar orçamento personalizado:", error);
    return null;
  }
  
  // Se não houver orçamento específico para esta conta, mas houver um geral do cliente,
  // verificar se há outro orçamento específico para esta conta
  if (accountId && data && !data.account_id) {
    // Verificar se existe um orçamento específico para esta conta
    const { data: specificBudget } = await supabase
      .from("custom_budgets")
      .select("*")
      .eq("client_id", clientId)
      .eq("account_id", accountId)
      .eq("is_active", true)
      .lte("start_date", today)
      .gte("end_date", today)
      .maybeSingle();
    
    // Se existir um orçamento específico para esta conta, ele tem prioridade
    if (specificBudget) {
      return specificBudget;
    }
  }
  
  // Retornar o orçamento encontrado (específico ou geral)
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
    custom_budget_account_id: customBudget.account_id
  } : {
    using_custom_budget: false,
    custom_budget_id: null,
    custom_budget_amount: null,
    custom_budget_account_id: null
  };
}
