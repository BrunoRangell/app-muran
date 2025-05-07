
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.1";

// Tipos para operações de banco de dados
export interface ClientData {
  id: string;
  company_name: string;
  meta_account_id: string | null;
  meta_ads_budget: number;
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
  account_id: string | null;
}

export interface ReviewData {
  meta_daily_budget_current: number;
  meta_total_spent: number;
  meta_account_id: string | null;
  client_account_id: string | null;
  meta_account_name: string;
  account_display_name: string;
  using_custom_budget: boolean;
  custom_budget_id: string | null;
  custom_budget_amount: number | null;
}

// Criação do cliente Supabase
export function createSupabaseClient() {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  return createClient(supabaseUrl, supabaseServiceKey);
}

// Buscar dados do cliente
export async function fetchClientData(supabase: any, clientId: string): Promise<ClientData> {
  console.log(`Buscando dados para cliente ${clientId}`);
  
  const { data: client, error: clientError } = await supabase
    .from("clients")
    .select("*")
    .eq("id", clientId)
    .single();

  if (clientError) {
    throw new Error(`Erro ao buscar cliente: ${clientError.message}`);
  }

  return client;
}

// Buscar detalhes da conta Meta específica
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
    .maybeSingle();

  if (accountError) {
    console.error(`Erro ao buscar conta Meta: ${accountError.message}`);
    return null;
  }

  return metaAccount;
}

// Buscar orçamento personalizado ativo
export async function fetchActiveCustomBudget(
  supabase: any, 
  clientId: string,
  today: string,
  accountId?: string | null,
  platform: string = 'meta'
): Promise<CustomBudget | null> {
  console.log(`Buscando orçamento personalizado ativo para cliente ${clientId}${accountId ? ` e conta ${accountId}` : ''}`);
  
  let query = supabase
    .from("custom_budgets")
    .select("*")
    .eq("client_id", clientId)
    .eq("is_active", true)
    .eq("platform", platform)
    .lte("start_date", today)
    .gte("end_date", today);
  
  // Se foi fornecido um accountId, procurar primeiro orçamentos específicos para essa conta,
  // ou orçamentos gerais (sem account_id especificado)
  if (accountId) {
    // Primeiro, tentar encontrar um orçamento específico para esta conta
    const { data: specificBudget, error: specificError } = await supabase
      .from("custom_budgets")
      .select("*")
      .eq("client_id", clientId)
      .eq("account_id", accountId)
      .eq("is_active", true)
      .eq("platform", platform)
      .lte("start_date", today)
      .gte("end_date", today)
      .order("created_at", { ascending: false })
      .maybeSingle();
    
    if (!specificError && specificBudget) {
      console.log(`Encontrado orçamento personalizado específico para a conta: ${specificBudget.id}`);
      return specificBudget;
    }
    
    // Se não encontrar específico, procurar por orçamentos gerais (sem account_id)
    const { data: generalBudget, error: generalError } = await supabase
      .from("custom_budgets")
      .select("*")
      .eq("client_id", clientId)
      .is("account_id", null)
      .eq("is_active", true)
      .eq("platform", platform)
      .lte("start_date", today)
      .gte("end_date", today)
      .order("created_at", { ascending: false })
      .maybeSingle();
    
    if (!generalError && generalBudget) {
      console.log(`Encontrado orçamento personalizado geral para o cliente: ${generalBudget.id}`);
      return generalBudget;
    }
    
    console.log("Nenhum orçamento personalizado encontrado para esta conta ou cliente");
    return null;
  }
  
  // Sem accountId específico, apenas buscar orçamentos gerais
  query = query.is("account_id", null);
  
  const { data: customBudget, error: customBudgetError } = await query
    .order("created_at", { ascending: false })
    .maybeSingle();

  if (customBudgetError) {
    console.error(`Erro ao buscar orçamento personalizado: ${customBudgetError.message}`);
    return null;
  }

  if (customBudget) {
    console.log(`Encontrado orçamento personalizado: ${customBudget.id}`);
  } else {
    console.log("Nenhum orçamento personalizado encontrado");
  }

  return customBudget;
}

// Verificar revisão existente
export async function checkExistingReview(
  supabase: any, 
  clientId: string, 
  accountId: string | null, 
  reviewDate: string
) {
  console.log(`Verificando revisão existente para cliente ${clientId} e conta ${accountId || ""} na data ${reviewDate}`);
  
  const { data: existingReview, error: existingReviewError } = await supabase
    .from("daily_budget_reviews")
    .select("*")
    .eq("client_id", clientId)
    .eq("review_date", reviewDate)
    .or(`meta_account_id.eq.${accountId || ""},client_account_id.eq.${accountId || ""}`)
    .maybeSingle();

  if (existingReviewError && existingReviewError.code !== "PGRST116") {
    console.error(`Erro ao verificar revisão existente: ${existingReviewError.message}`);
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
}

// Criar nova revisão
export async function createNewReview(
  supabase: any, 
  clientId: string,
  reviewDate: string,
  reviewData: ReviewData
): Promise<number> {
  console.log("Criando nova revisão");
  
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
    throw new Error(`Erro ao inserir nova revisão: ${insertError.message}`);
  }
  
  return newReview.id;
}

// Atualizar ou criar revisão atual do cliente
export async function updateClientCurrentReview(
  supabase: any, 
  clientId: string, 
  reviewDate: string,
  reviewData: ReviewData
): Promise<void> {
  // Verificar se já existe revisão atual para este cliente
  const { data: currentReview, error: currentReviewError } = await supabase
    .from("client_current_reviews")
    .select("*")
    .eq("client_id", clientId)
    .maybeSingle();

  if (currentReviewError && currentReviewError.code !== "PGRST116") {
    console.error(`Erro ao verificar revisão atual: ${currentReviewError.message}`);
  }

  const currentReviewData = {
    client_id: clientId,
    review_date: reviewDate,
    ...reviewData
  };

  if (currentReview) {
    // Atualizar revisão atual
    const { error: updateCurrentError } = await supabase
      .from("client_current_reviews")
      .update(currentReviewData)
      .eq("id", currentReview.id);

    if (updateCurrentError) {
      console.error(`Erro ao atualizar revisão atual: ${updateCurrentError.message}`);
    }
  } else {
    // Inserir nova revisão atual
    const { error: insertCurrentError } = await supabase
      .from("client_current_reviews")
      .insert(currentReviewData);

    if (insertCurrentError) {
      console.error(`Erro ao inserir revisão atual: ${insertCurrentError.message}`);
    }
  }
}
