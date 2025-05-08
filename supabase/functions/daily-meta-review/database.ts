
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Criar cliente Supabase para Edge Functions
export function createSupabaseClient() {
  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Variáveis de ambiente SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não configuradas");
  }
  
  return createClient(supabaseUrl, supabaseKey);
}

// Buscar dados do cliente
export async function fetchClientData(supabase, clientId) {
  console.log(`Buscando dados para cliente ${clientId}`);
  
  const { data: client, error } = await supabase
    .from("clients")
    .select("*")
    .eq("id", clientId)
    .single();
  
  if (error) {
    console.error("Erro ao buscar dados do cliente:", error);
    throw new Error(`Erro ao buscar dados do cliente: ${error.message}`);
  }
  
  if (!client) {
    throw new Error(`Cliente não encontrado: ${clientId}`);
  }
  
  return client;
}

// Buscar detalhes da conta Meta específica
export async function fetchMetaAccountDetails(supabase, clientId, accountId) {
  console.log(`Buscando detalhes de conta Meta específica: ${accountId} para cliente ${clientId}`);
  
  const { data: account, error } = await supabase
    .from("client_meta_accounts")
    .select("*")
    .eq("client_id", clientId)
    .eq("account_id", accountId)
    .eq("status", "active")
    .maybeSingle();
  
  if (error) {
    console.error("Erro ao buscar detalhes da conta Meta:", error);
    throw new Error(`Erro ao buscar detalhes da conta Meta: ${error.message}`);
  }
  
  return account;
}

// Buscar orçamento personalizado ativo
export async function fetchActiveCustomBudget(supabase, clientId, date) {
  console.log(`Buscando orçamento personalizado ativo para cliente ${clientId}`);
  
  const { data: budget, error } = await supabase
    .from("custom_budgets")
    .select("*")
    .eq("client_id", clientId)
    .eq("is_active", true)
    .lte("start_date", date)
    .gte("end_date", date)
    .maybeSingle();
  
  if (error) {
    console.error("Erro ao buscar orçamento personalizado:", error);
    return null;
  }
  
  return budget;
}

// Verificar se já existe uma revisão para o cliente e data
export async function checkExistingReview(supabase, clientId, accountId, reviewDate) {
  console.log(`Verificando revisão existente para cliente ${clientId} e conta ${accountId} na data ${reviewDate}`);
  
  const query = supabase
    .from("daily_budget_reviews")
    .select("*")
    .eq("client_id", clientId)
    .eq("review_date", reviewDate);
  
  if (accountId) {
    query.eq("meta_account_id", accountId);
  }
  
  const { data: review, error } = await query.maybeSingle();
  
  if (error) {
    console.error("Erro ao verificar revisão existente:", error);
    return null;
  }
  
  if (review) {
    console.log("Encontrada revisão existente:", review);
  }
  
  return review;
}

// Atualizar revisão existente
export async function updateExistingReview(supabase, reviewId, data) {
  console.log(`Atualizando revisão existente: ${reviewId}`);
  
  const { error } = await supabase
    .from("daily_budget_reviews")
    .update(data)
    .eq("id", reviewId);
  
  if (error) {
    console.error("Erro ao atualizar revisão:", error);
    throw new Error(`Erro ao atualizar revisão: ${error.message}`);
  }
  
  console.log(`Revisão existente atualizada: ${reviewId}`);
}

// Criar nova revisão
export async function createNewReview(supabase, clientId, reviewDate, data) {
  console.log(`Criando nova revisão para cliente ${clientId} na data ${reviewDate}`);
  
  const { data: newReview, error } = await supabase
    .from("daily_budget_reviews")
    .insert({
      client_id: clientId,
      review_date: reviewDate,
      ...data
    })
    .select()
    .maybeSingle();
  
  if (error) {
    console.error("Erro ao criar nova revisão:", error);
    throw new Error(`Erro ao criar nova revisão: ${error.message}`);
  }
  
  console.log(`Nova revisão criada: ${newReview.id}`);
  return newReview.id;
}

// Atualizar revisão atual do cliente
export async function updateClientCurrentReview(supabase, clientId, reviewDate, data) {
  try {
    console.log(`Atualizando revisão atual para cliente ${clientId}`);
    
    // Primeiro verificar se já existe uma revisão atual para este cliente
    const { data: existingReview, error: checkError } = await supabase
      .from("client_current_reviews")
      .select("id")
      .eq("client_id", clientId)
      .maybeSingle();
    
    if (checkError) {
      console.error("Erro ao verificar revisão atual do cliente:", checkError);
      throw checkError;
    }
    
    // Se existir, atualizar; caso contrário, criar nova
    if (existingReview) {
      const { error: updateError } = await supabase
        .from("client_current_reviews")
        .update({
          review_date: reviewDate,
          ...data,
          updated_at: new Date().toISOString()
        })
        .eq("id", existingReview.id);
      
      if (updateError) {
        console.error("Erro ao atualizar revisão atual do cliente:", updateError);
        throw updateError;
      }
      
      console.log(`Revisão atual do cliente ${clientId} atualizada`);
    } else {
      const { error: insertError } = await supabase
        .from("client_current_reviews")
        .insert({
          client_id: clientId,
          review_date: reviewDate,
          ...data
        });
      
      if (insertError) {
        console.error("Erro ao inserir revisão atual:", insertError);
        throw insertError;
      }
      
      console.log(`Nova revisão atual para cliente ${clientId} criada`);
    }
  } catch (error) {
    console.error("Erro ao inserir revisão atual:", error.message);
    throw error;
  }
}
