
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.1";

// Tipos para operações de banco de dados
export interface ClientData {
  id: string;
  company_name: string;
}

export interface MetaAccount {
  account_id: string;
  account_name: string;
  budget_amount: number;
}

export interface CustomBudget {
  id: string;
  budget_amount: number;
  start_date: string;
  end_date: string;
}

export interface ReviewData {
  meta_daily_budget_current: number;
  meta_total_spent: number;
  meta_account_id: string | null;
  meta_account_name: string;
  using_custom_budget: boolean;
  custom_budget_id: string | null;
  custom_budget_amount: number | null;
  custom_budget_start_date?: string | null;
  custom_budget_end_date?: string | null;
}

// Criação do cliente Supabase
export function createSupabaseClient() {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  return createClient(supabaseUrl, supabaseServiceKey);
}

// Buscar token Meta da tabela api_tokens
export async function fetchMetaAccessToken(supabase: any): Promise<string | null> {
  console.log("🔍 Buscando token Meta da tabela api_tokens...");
  
  try {
    const { data: tokenData, error: tokenError } = await supabase
      .from("api_tokens")
      .select("value")
      .eq("name", "meta_access_token")
      .maybeSingle();

    if (tokenError) {
      console.error(`❌ Erro ao buscar token Meta: ${tokenError.message}`);
      return null;
    }

    if (!tokenData || !tokenData.value) {
      console.log("⚠️ Token Meta não encontrado na tabela api_tokens");
      return null;
    }

    console.log("✅ Token Meta encontrado na base de dados");
    return tokenData.value;
  } catch (error) {
    console.error(`❌ Erro inesperado ao buscar token Meta: ${error.message}`);
    return null;
  }
}

// Buscar dados do cliente (simplificado - sem campos Meta específicos)
export async function fetchClientData(supabase: any, clientId: string): Promise<ClientData> {
  console.log(`Buscando dados para cliente ${clientId}`);
  
  const { data: client, error: clientError } = await supabase
    .from("clients")
    .select("id, company_name")
    .eq("id", clientId)
    .single();

  if (clientError) {
    throw new Error(`Erro ao buscar cliente: ${clientError.message}`);
  }

  return client;
}

// Buscar detalhes da conta Meta específica (única fonte de verdade)
export async function fetchMetaAccountDetails(
  supabase: any, 
  clientId: string, 
  accountId: string
): Promise<MetaAccount | null> {
  console.log(`Buscando detalhes de conta Meta específica: ${accountId} para cliente ${clientId}`);
  
  const { data: metaAccount, error: accountError } = await supabase
    .from("client_meta_accounts")
    .select("*")
    .eq("client_id", clientId)
    .eq("account_id", accountId)
    .eq("status", "active")
    .maybeSingle();

  if (accountError) {
    console.error(`Erro ao buscar conta Meta: ${accountError.message}`);
    return null;
  }

  return metaAccount;
}

// Buscar conta Meta principal do cliente (se não especificar account_id)
export async function fetchPrimaryMetaAccount(
  supabase: any, 
  clientId: string
): Promise<MetaAccount | null> {
  console.log(`Buscando conta Meta principal para cliente ${clientId}`);
  
  const { data: metaAccount, error: accountError } = await supabase
    .from("client_meta_accounts")
    .select("*")
    .eq("client_id", clientId)
    .eq("status", "active")
    .order("is_primary", { ascending: false })
    .order("created_at", { ascending: true })
    .maybeSingle();

  if (accountError) {
    console.error(`Erro ao buscar conta Meta principal: ${accountError.message}`);
    return null;
  }

  return metaAccount;
}

// Buscar orçamento personalizado ativo - ATUALIZADO PARA TABELA UNIFICADA
export async function fetchActiveCustomBudget(
  supabase: any, 
  clientId: string,
  today: string
): Promise<CustomBudget | null> {
  console.log(`Buscando orçamento personalizado ativo para cliente ${clientId}`);
  
  const { data: customBudget, error: customBudgetError } = await supabase
    .from("custom_budgets")
    .select("*")
    .eq("client_id", clientId)
    .eq("platform", "meta")
    .eq("is_active", true)
    .lte("start_date", today)
    .gte("end_date", today)
    .order("created_at", { ascending: false })
    .maybeSingle();

  if (customBudgetError) {
    console.error(`Erro ao buscar orçamento personalizado: ${customBudgetError.message}`);
    return null;
  }

  if (customBudget) {
    console.log(`✅ Orçamento personalizado encontrado:`, {
      id: customBudget.id,
      budget_amount: customBudget.budget_amount,
      start_date: customBudget.start_date,
      end_date: customBudget.end_date
    });
  }

  return customBudget;
}

// Verificar revisão existente - CORRIGIDO para usar a nova constraint
export async function checkExistingReview(
  supabase: any, 
  clientId: string, 
  accountId: string | null, 
  reviewDate: string
) {
  console.log(`Verificando revisão existente para cliente ${clientId}, conta ${accountId || "null"} na data ${reviewDate}`);
  
  // Construir query com filtros apropriados
  let query = supabase
    .from("daily_budget_reviews")
    .select("*")
    .eq("client_id", clientId)
    .eq("review_date", reviewDate);
    
  // Adicionar filtro de conta se especificado
  if (accountId) {
    query = query.eq("meta_account_id", accountId);
  } else {
    query = query.is("meta_account_id", null);
  }
  
  const { data: existingReview, error: existingReviewError } = await query.maybeSingle();

  if (existingReviewError && existingReviewError.code !== "PGRST116") {
    console.error(`Erro ao verificar revisão existente: ${existingReviewError.message}`);
  }

  if (existingReview) {
    console.log(`✅ Revisão existente encontrada: ID ${existingReview.id}`);
  } else {
    console.log(`ℹ️ Nenhuma revisão existente encontrada para estes parâmetros`);
  }

  return existingReview;
}

// Atualizar revisão existente
export async function updateExistingReview(
  supabase: any, 
  reviewId: number, 
  reviewData: ReviewData
): Promise<void> {
  console.log(`Atualizando revisão existente: ${reviewId}`);
  
  const { error: updateError } = await supabase
    .from("daily_budget_reviews")
    .update({
      ...reviewData,
      updated_at: new Date().toISOString()
    })
    .eq("id", reviewId);

  if (updateError) {
    throw new Error(`Erro ao atualizar revisão: ${updateError.message}`);
  }
  
  console.log(`✅ Revisão ${reviewId} atualizada com sucesso`);
}

// Criar nova revisão
export async function createNewReview(
  supabase: any, 
  clientId: string,
  reviewDate: string,
  reviewData: ReviewData
): Promise<number> {
  console.log(`Criando nova revisão para cliente ${clientId}, conta ${reviewData.meta_account_id}`);
  
  const { data: newReview, error: insertError } = await supabase
    .from("daily_budget_reviews")
    .insert({
      ...reviewData,
      client_id: clientId,
      review_date: reviewDate
    })
    .select()
    .single();

  if (insertError) {
    console.error(`Erro ao inserir nova revisão:`, insertError);
    throw new Error(`Erro ao inserir nova revisão: ${insertError.message}`);
  }
  
  console.log(`✅ Nova revisão criada: ID ${newReview.id}`);
  return newReview.id;
}

// Atualizar ou criar revisão atual do cliente - MODIFICADO para suportar múltiplas contas
export async function updateClientCurrentReview(
  supabase: any, 
  clientId: string, 
  reviewDate: string,
  reviewData: ReviewData
): Promise<void> {
  try {
    console.log(`Atualizando revisão atual para cliente ${clientId}, conta ${reviewData.meta_account_id}`);
    
    // Verificar se já existe revisão atual para este cliente e conta específica
    let query = supabase
      .from("client_current_reviews")
      .select("*")
      .eq("client_id", clientId);
      
    // Filtrar por conta específica se fornecida
    if (reviewData.meta_account_id) {
      query = query.eq("meta_account_id", reviewData.meta_account_id);
    } else {
      query = query.is("meta_account_id", null);
    }
    
    const { data: currentReview, error: currentReviewError } = await query.maybeSingle();

    if (currentReviewError && currentReviewError.code !== "PGRST116") {
      console.error(`Erro ao verificar revisão atual: ${currentReviewError.message}`);
      return;
    }

    // Preparar dados apenas com campos que existem na tabela
    const currentReviewData = {
      client_id: clientId,
      review_date: reviewDate,
      meta_daily_budget_current: reviewData.meta_daily_budget_current,
      meta_total_spent: reviewData.meta_total_spent,
      meta_account_id: reviewData.meta_account_id,
      meta_account_name: reviewData.meta_account_name,
      using_custom_budget: reviewData.using_custom_budget,
      custom_budget_id: reviewData.custom_budget_id,
      custom_budget_amount: reviewData.custom_budget_amount
    };

    if (currentReview) {
      // Atualizar revisão atual existente
      const { error: updateCurrentError } = await supabase
        .from("client_current_reviews")
        .update(currentReviewData)
        .eq("id", currentReview.id);

      if (updateCurrentError) {
        console.error(`Erro ao atualizar revisão atual: ${updateCurrentError.message}`);
      } else {
        console.log(`✅ Revisão atual atualizada para cliente ${clientId}, conta ${reviewData.meta_account_id}`);
      }
    } else {
      // Inserir nova revisão atual
      const { error: insertCurrentError } = await supabase
        .from("client_current_reviews")
        .insert(currentReviewData);

      if (insertCurrentError) {
        console.error(`Erro ao inserir revisão atual: ${insertCurrentError.message}`);
      } else {
        console.log(`✅ Nova revisão atual criada para cliente ${clientId}, conta ${reviewData.meta_account_id}`);
      }
    }
  } catch (error) {
    console.error(`Erro ao atualizar revisão atual do cliente: ${error.message}`);
  }
}
