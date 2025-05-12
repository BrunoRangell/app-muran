
import { supabase } from "@/lib/supabase";

/**
 * Verifica se existe um orçamento personalizado ativo para o cliente na data atual
 */
export async function getActiveCustomBudget(clientId: string, platform = 'meta', accountId?: string) {
  const today = new Date().toISOString().split('T')[0];
  
  console.log(`[customBudgetService] Buscando orçamento personalizado para cliente ${clientId}, plataforma ${platform}, conta ${accountId || 'todas'}`);
  
  // Buscar na tabela unificada
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
    console.error("[customBudgetService] Erro ao buscar orçamento personalizado:", error);
    
    // Fallback para tabela antiga se for Meta
    if (platform === 'meta') {
      console.log("[customBudgetService] Tentando fallback para tabela meta_custom_budgets");
      
      const { data: legacyData, error: legacyError } = await supabase
        .from("meta_custom_budgets")
        .select("*")
        .eq("client_id", clientId)
        .eq("is_active", true)
        .lte("start_date", today)
        .gte("end_date", today)
        .order("created_at", { ascending: false });
        
      if (legacyError) {
        console.error("[customBudgetService] Erro ao buscar orçamento personalizado (legacy):", legacyError);
        return null;
      }
      
      // Se temos dados e uma conta específica foi solicitada
      if (accountId && legacyData && legacyData.length > 0) {
        console.log(`[customBudgetService] Filtrando orçamentos legados por account_id: ${accountId}`);
        
        // Primeiro, procurar por orçamentos específicos para a conta
        const accountSpecificBudget = legacyData.filter(budget => 
          budget.account_id === accountId
        );
        
        if (accountSpecificBudget.length > 0) {
          console.log(`[customBudgetService] Encontrado orçamento legado específico para a conta ${accountId}`);
          return accountSpecificBudget[0];
        }
        
        // Verificar se há orçamento global (sem account_id específico)
        const globalBudget = legacyData.filter(budget => !budget.account_id);
        if (globalBudget.length > 0) {
          console.log(`[customBudgetService] Encontrado orçamento legado global`);
          return globalBudget[0];
        }
      }
      
      return legacyData?.[0] || null;
    }
    
    return null;
  }
  
  // Se não temos dados, retornar null
  if (!data || data.length === 0) {
    console.log("[customBudgetService] Nenhum orçamento personalizado encontrado");
    return null;
  }
  
  // Se temos dados e uma conta específica foi solicitada
  if (accountId && data.length > 0) {
    console.log(`[customBudgetService] Filtrando ${data.length} orçamentos por account_id: ${accountId}`);
    
    // Primeiro, procurar por orçamentos específicos para a conta
    const accountSpecificBudget = data.filter(budget => 
      budget.account_id === accountId
    );
    
    if (accountSpecificBudget.length > 0) {
      console.log(`[customBudgetService] Encontrado orçamento específico para a conta ${accountId}`);
      return accountSpecificBudget[0];
    }
    
    // Verificar se há orçamento global (sem account_id específico)
    const globalBudget = data.filter(budget => !budget.account_id);
    if (globalBudget.length > 0) {
      console.log(`[customBudgetService] Encontrado orçamento global`);
      return globalBudget[0];
    }
  }
  
  // Caso não tenha filtrado por conta ou não encontrou nada específico, retornar o primeiro orçamento
  return data[0] || null;
}

/**
 * Adiciona informações de orçamento personalizado ao payload
 */
export function prepareCustomBudgetInfo(customBudget: any | null) {
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
