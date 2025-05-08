
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Criar cliente Supabase para Edge Function
export function createSupabaseClient() {
  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Faltam variáveis de ambiente SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY");
  }
  
  return createClient(supabaseUrl, supabaseKey);
}

// Buscar dados do cliente
export async function fetchClientData(supabase: any, clientId: string) {
  console.log(`Buscando dados para cliente ${clientId}`);
  
  const { data, error } = await supabase
    .from("clients")
    .select("company_name, meta_account_id, meta_ads_budget")
    .eq("id", clientId)
    .single();
    
  if (error) {
    throw new Error(`Erro ao buscar dados do cliente: ${error.message}`);
  }
  
  if (!data) {
    throw new Error(`Cliente não encontrado: ${clientId}`);
  }
  
  return data;
}

// Buscar detalhes da conta Meta específica
export async function fetchMetaAccountDetails(supabase: any, clientId: string, accountId: string) {
  console.log(`Buscando detalhes de conta Meta específica: ${accountId} para cliente ${clientId}`);
  
  const { data, error } = await supabase
    .from("client_meta_accounts")
    .select("account_name, budget_amount")
    .eq("client_id", clientId)
    .eq("account_id", accountId)
    .single();
    
  if (error && error.code !== 'PGRST116') {
    throw new Error(`Erro ao buscar detalhes da conta Meta: ${error.message}`);
  }
  
  return data;
}

// Buscar orçamento personalizado ativo
export async function fetchActiveCustomBudget(supabase: any, clientId: string, date: string, accountId?: string | null) {
  console.log(`Buscando orçamento personalizado ativo para cliente ${clientId} e conta ${accountId}`);
  
  const query = supabase
    .from("custom_budgets")
    .select("*")
    .eq("client_id", clientId)
    .eq("is_active", true)
    .lte("start_date", date)
    .gte("end_date", date);
    
  // Se accountId estiver definido, filtrar por ele também
  if (accountId) {
    query.eq("account_id", accountId);
  }
  
  const { data, error } = await query.maybeSingle();
  
  if (error) {
    throw new Error(`Erro ao buscar orçamento personalizado: ${error.message}`);
  }
  
  return data;
}

// Verificar se já existe uma revisão
export async function checkExistingReview(supabase: any, clientId: string, accountId: string | null, reviewDate: string) {
  console.log(`Verificando revisão existente para cliente ${clientId} e conta ${accountId} na data ${reviewDate}`);
  
  try {
    const query = supabase
      .from("daily_budget_reviews")
      .select("*")
      .eq("client_id", clientId)
      .eq("review_date", reviewDate);
      
    // Se accountId estiver definido, filtrar por ele também
    if (accountId) {
      query.eq("meta_account_id", accountId);
    }
    
    const { data, error } = await query.maybeSingle();
    
    if (error) {
      console.error(`Erro ao verificar revisão existente: ${error.message}`);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error(`Erro ao verificar revisão existente: ${error.message}`);
    return null;
  }
}

// Atualizar revisão existente
export async function updateExistingReview(supabase: any, reviewId: number, reviewData: any) {
  console.log("Criando nova revisão");
  
  try {
    const { error } = await supabase
      .from("daily_budget_reviews")
      .update(reviewData)
      .eq("id", reviewId);
      
    if (error) {
      throw new Error(`Erro ao atualizar revisão: ${error.message}`);
    }
  } catch (error) {
    console.error(`Erro ao atualizar revisão: ${error.message}`);
    throw new Error(`Erro ao atualizar revisão: ${error.message}`);
  }
}

// Criar nova revisão
export async function createNewReview(supabase: any, clientId: string, reviewDate: string, reviewData: any) {
  console.log("Criando nova revisão");
  
  try {
    const { data, error } = await supabase
      .from("daily_budget_reviews")
      .insert({
        client_id: clientId,
        review_date: reviewDate,
        ...reviewData
      })
      .select()
      .single();
      
    if (error) {
      throw new Error(`Erro ao inserir nova revisão: ${error.message}`);
    }
    
    return data.id;
  } catch (error) {
    console.error(`Erro ao inserir nova revisão: ${error.message}`);
    throw new Error(`Erro ao inserir nova revisão: ${error.message}`);
  }
}

// Atualizar estado atual da revisão do cliente
export async function updateClientCurrentReview(supabase: any, clientId: string, reviewDate: string, reviewData: any) {
  // Primeiro verificar se já existe um registro
  const { data: existingData, error: fetchError } = await supabase
    .from("client_current_reviews")
    .select("id")
    .eq("client_id", clientId)
    .eq("review_date", reviewDate)
    .maybeSingle();
    
  if (fetchError && fetchError.code !== 'PGRST116') {
    console.error(`Erro ao verificar revisão atual: ${fetchError.message}`);
    return;
  }
  
  try {
    if (existingData) {
      // Atualizar registro existente
      const { error } = await supabase
        .from("client_current_reviews")
        .update(reviewData)
        .eq("id", existingData.id);
        
      if (error) {
        throw new Error(`Erro ao atualizar estado atual: ${error.message}`);
      }
    } else {
      // Criar novo registro
      const { error } = await supabase
        .from("client_current_reviews")
        .insert({
          client_id: clientId,
          review_date: reviewDate,
          ...reviewData
        });
        
      if (error) {
        throw new Error(`Erro ao criar estado atual: ${error.message}`);
      }
    }
  } catch (error) {
    console.error(`Erro ao atualizar estado atual: ${error.message}`);
  }
}
