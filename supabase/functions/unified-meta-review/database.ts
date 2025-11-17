import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.48.1";
import { ClientData, MetaAccount, CustomBudget, ReviewData } from "./types.ts";

// Criação do cliente Supabase
export function createSupabaseClient() {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  return createClient(supabaseUrl, supabaseServiceKey);
}

// Buscar token Meta da tabela api_tokens
export async function fetchMetaAccessToken(supabase: any): Promise<string | null> {
  console.log("🔍 [DATABASE] Buscando token Meta da tabela api_tokens...");
  
  try {
    const { data: tokenData, error: tokenError } = await supabase
      .from("api_tokens")
      .select("value")
      .eq("name", "meta_access_token")
      .maybeSingle();

    if (tokenError) {
      console.error(`❌ [DATABASE] Erro ao buscar token Meta: ${tokenError.message}`);
      return null;
    }

    if (!tokenData || !tokenData.value) {
      console.log("⚠️ [DATABASE] Token Meta não encontrado na tabela api_tokens");
      return null;
    }

    console.log("✅ [DATABASE] Token Meta encontrado na base de dados");
    return tokenData.value;
  } catch (error) {
    console.error(`❌ [DATABASE] Erro inesperado ao buscar token Meta: ${error.message}`);
    return null;
  }
}

// Buscar dados do cliente
export async function fetchClientData(supabase: any, clientId: string): Promise<ClientData> {
  console.log(`🔍 [DATABASE] Buscando dados para cliente ${clientId}`);
  
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

// Buscar conta Meta específica por account_id
export async function fetchSpecificMetaAccount(
  supabase: any,
  clientId: string,
  accountId: string
): Promise<MetaAccount | null> {
  console.log(`🔍 [DATABASE] Buscando conta Meta específica ${accountId} para cliente ${clientId}`);
  
  const { data: metaAccount, error: accountError } = await supabase
    .from("client_accounts")
    .select("*")
    .eq("client_id", clientId)
    .eq("account_id", accountId)
    .eq("platform", "meta")
    .eq("status", "active")
    .maybeSingle();

  if (accountError) {
    console.error(`❌ [DATABASE] Erro ao buscar conta Meta específica: ${accountError.message}`);
    return null;
  }

  if (!metaAccount) {
    console.log(`⚠️ [DATABASE] Conta Meta específica ${accountId} não encontrada`);
  } else {
    console.log(`✅ [DATABASE] Conta Meta específica encontrada: ${metaAccount.account_name}`);
  }

  return metaAccount;
}

// Buscar conta Meta principal do cliente usando a tabela client_accounts
export async function fetchPrimaryMetaAccount(
  supabase: any, 
  clientId: string
): Promise<MetaAccount | null> {
  console.log(`🔍 [DATABASE] Buscando conta Meta principal para cliente ${clientId}`);
  
  const { data: metaAccounts, error: accountError } = await supabase
    .from("client_accounts")
    .select("*")
    .eq("client_id", clientId)
    .eq("platform", "meta")
    .eq("status", "active")
    .order("is_primary", { ascending: false })
    .order("created_at", { ascending: true });

  if (accountError) {
    console.error(`❌ [DATABASE] Erro ao buscar conta Meta principal: ${accountError.message}`);
    return null;
  }

  const metaAccount = metaAccounts && metaAccounts.length > 0 ? metaAccounts[0] : null;

  return metaAccount;
}

// Buscar todas as contas Meta ativas do cliente
export async function fetchAllMetaAccounts(
  supabase: any,
  clientId: string
): Promise<MetaAccount[]> {
  console.log(`🔍 [DATABASE] Buscando todas as contas Meta para cliente ${clientId}`);
  
  const { data: metaAccounts, error: accountError } = await supabase
    .from("client_accounts")
    .select("*")
    .eq("client_id", clientId)
    .eq("platform", "meta")
    .eq("status", "active")
    .order("is_primary", { ascending: false })
    .order("created_at", { ascending: true });

  if (accountError) {
    console.error(`❌ [DATABASE] Erro ao buscar contas Meta: ${accountError.message}`);
    return [];
  }

  console.log(`✅ [DATABASE] ${metaAccounts?.length || 0} conta(s) Meta encontrada(s)`);
  return metaAccounts || [];
}

// Buscar orçamento personalizado ativo
export async function fetchActiveCustomBudget(
  supabase: any, 
  clientId: string,
  today: string
): Promise<CustomBudget | null> {
  console.log(`🔍 [DATABASE] Buscando orçamento personalizado ativo para cliente ${clientId}`);
  
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
    console.error(`❌ [DATABASE] Erro ao buscar orçamento personalizado: ${customBudgetError.message}`);
    return null;
  }

  if (customBudget) {
    console.log(`✅ [DATABASE] Orçamento personalizado encontrado:`, {
      id: customBudget.id,
      budget_amount: customBudget.budget_amount,
      start_date: customBudget.start_date,
      end_date: customBudget.end_date
    });
  }

  return customBudget;
}

// Verificar revisão existente na tabela budget_reviews
export async function checkExistingReview(
  supabase: any, 
  clientId: string, 
  accountId: string, 
  reviewDate: string
) {
  console.log(`🔍 [DATABASE] Verificando revisão existente para cliente ${clientId}, conta ${accountId} na data ${reviewDate}`);
  
  const { data: existingReview, error: existingReviewError } = await supabase
    .from("budget_reviews")
    .select("*")
    .eq("client_id", clientId)
    .eq("account_id", accountId)
    .eq("review_date", reviewDate)
    .eq("platform", "meta")
    .maybeSingle();

  if (existingReviewError && existingReviewError.code !== "PGRST116") {
    console.error(`❌ [DATABASE] Erro ao verificar revisão existente: ${existingReviewError.message}`);
  }

  if (existingReview) {
    console.log(`✅ [DATABASE] Revisão existente encontrada: ID ${existingReview.id}`);
  } else {
    console.log(`ℹ️ [DATABASE] Nenhuma revisão existente encontrada para estes parâmetros`);
  }

  return existingReview;
}

// Atualizar revisão existente na tabela budget_reviews e dados de saldo em client_accounts
export async function updateExistingReview(
  supabase: any, 
  reviewId: string, 
  reviewData: ReviewData
): Promise<void> {
  console.log(`🔄 [DATABASE] Atualizando revisão existente: ${reviewId}`);
  
  // Atualizar budget_reviews
  const { error: updateError } = await supabase
    .from("budget_reviews")
    .update({
      daily_budget_current: reviewData.daily_budget_current,
      total_spent: reviewData.total_spent,
      using_custom_budget: reviewData.using_custom_budget,
      custom_budget_id: reviewData.custom_budget_id,
      custom_budget_amount: reviewData.custom_budget_amount,
      custom_budget_start_date: reviewData.custom_budget_start_date,
      custom_budget_end_date: reviewData.custom_budget_end_date,
      updated_at: new Date().toISOString()
    })
    .eq("id", reviewId);

  if (updateError) {
    throw new Error(`Erro ao atualizar revisão: ${updateError.message}`);
  }
  
  // Atualizar dados de saldo em client_accounts se fornecidos
  if (reviewData.saldo_restante !== undefined || reviewData.is_prepay_account !== undefined) {
    console.log(`🔄 [DATABASE] Atualizando saldo e modelo de cobrança em client_accounts para conta ${reviewData.account_id}`);
    
    const updateData: any = {};
    if (reviewData.saldo_restante !== undefined) {
      updateData.saldo_restante = reviewData.saldo_restante;
    }
    if (reviewData.is_prepay_account !== undefined) {
      updateData.is_prepay_account = reviewData.is_prepay_account;
    }
    
    const { error: accountUpdateError } = await supabase
      .from("client_accounts")
      .update(updateData)
      .eq("id", reviewData.account_id);

    if (accountUpdateError) {
      console.error(`⚠️ [DATABASE] Erro ao atualizar saldo em client_accounts: ${accountUpdateError.message}`);
    } else {
      console.log(`✅ [DATABASE] Saldo e modelo de cobrança atualizados em client_accounts`);
    }
  }
  
  console.log(`✅ [DATABASE] Revisão ${reviewId} atualizada com sucesso`);
}

// Criar nova revisão na tabela budget_reviews e atualizar dados de saldo em client_accounts
export async function createNewReview(
  supabase: any, 
  clientId: string,
  reviewDate: string,
  reviewData: ReviewData
): Promise<string> {
  console.log(`📝 [DATABASE] Criando nova revisão para cliente ${clientId}, conta ${reviewData.account_id}`);
  
  const { data: newReview, error: insertError } = await supabase
    .from("budget_reviews")
    .insert({
      client_id: clientId,
      account_id: reviewData.account_id,
      review_date: reviewDate,
      platform: "meta",
      daily_budget_current: reviewData.daily_budget_current,
      total_spent: reviewData.total_spent,
      using_custom_budget: reviewData.using_custom_budget,
      custom_budget_id: reviewData.custom_budget_id,
      custom_budget_amount: reviewData.custom_budget_amount,
      custom_budget_start_date: reviewData.custom_budget_start_date,
      custom_budget_end_date: reviewData.custom_budget_end_date
    })
    .select()
    .single();

  if (insertError) {
    console.error(`❌ [DATABASE] Erro ao inserir nova revisão:`, insertError);
    throw new Error(`Erro ao inserir nova revisão: ${insertError.message}`);
  }
  
  // Atualizar dados de saldo em client_accounts se fornecidos
  if (reviewData.saldo_restante !== undefined || reviewData.is_prepay_account !== undefined) {
    console.log(`🔄 [DATABASE] Atualizando saldo e modelo de cobrança em client_accounts para conta ${reviewData.account_id}`);
    
    const updateData: any = {};
    if (reviewData.saldo_restante !== undefined) {
      updateData.saldo_restante = reviewData.saldo_restante;
    }
    if (reviewData.is_prepay_account !== undefined) {
      updateData.is_prepay_account = reviewData.is_prepay_account;
    }
    
    const { error: accountUpdateError } = await supabase
      .from("client_accounts")
      .update(updateData)
      .eq("id", reviewData.account_id);

    if (accountUpdateError) {
      console.error(`⚠️ [DATABASE] Erro ao atualizar saldo em client_accounts: ${accountUpdateError.message}`);
    } else {
      console.log(`✅ [DATABASE] Saldo e modelo de cobrança atualizados em client_accounts`);
    }
  }
  
  console.log(`✅ [DATABASE] Nova revisão criada: ID ${newReview.id}`);
  return newReview.id;
}

// Limpar revisões antigas (dias anteriores) e duplicatas do dia atual
export async function cleanupOldReviews(
  supabase: any,
  platform: 'meta' | 'google',
  reviewDate: string,
  clientId?: string,
  accountId?: string
): Promise<{ deleted_old: number; deleted_today_duplicates: number }> {
  console.log(`🧹 [DATABASE] Iniciando limpeza de revisões antigas para plataforma ${platform}`);
  
  let deletedOld = 0;
  let deletedTodayDuplicates = 0;
  
  try {
    // 1. Remover revisões de dias anteriores
    console.log(`🗑️ [DATABASE] Removendo revisões anteriores a ${reviewDate}...`);
    
    let deleteOldQuery = supabase
      .from("budget_reviews")
      .delete()
      .eq("platform", platform)
      .lt("review_date", reviewDate);
    
    // Se clientId fornecido, limpar apenas daquele cliente
    if (clientId) {
      deleteOldQuery = deleteOldQuery.eq("client_id", clientId);
    }
    
    if (accountId) {
      deleteOldQuery = deleteOldQuery.eq("account_id", accountId);
    }
    
    const { error: deleteOldError, count: oldCount } = await deleteOldQuery.select('*', { count: 'exact', head: true });
    
    if (deleteOldError) {
      console.error(`❌ [DATABASE] Erro ao remover revisões antigas: ${deleteOldError.message}`);
    } else {
      deletedOld = oldCount || 0;
      console.log(`✅ [DATABASE] ${deletedOld} revisões antigas removidas`);
    }
    
    // 2. Remover duplicatas do dia atual (se clientId/accountId fornecidos)
    if (clientId && accountId) {
      console.log(`🗑️ [DATABASE] Removendo duplicatas do dia ${reviewDate}...`);
      
      const { error: deleteTodayError, count: todayCount } = await supabase
        .from("budget_reviews")
        .delete()
        .eq("platform", platform)
        .eq("client_id", clientId)
        .eq("account_id", accountId)
        .eq("review_date", reviewDate)
        .select('*', { count: 'exact', head: true });
      
      if (deleteTodayError) {
        console.error(`❌ [DATABASE] Erro ao remover duplicatas de hoje: ${deleteTodayError.message}`);
      } else {
        deletedTodayDuplicates = todayCount || 0;
        console.log(`✅ [DATABASE] ${deletedTodayDuplicates} duplicatas de hoje removidas`);
      }
    }
    
    const totalDeleted = deletedOld + deletedTodayDuplicates;
    console.log(`🧹 [DATABASE] Limpeza concluída: ${totalDeleted} revisões removidas no total`);
    
    return {
      deleted_old: deletedOld,
      deleted_today_duplicates: deletedTodayDuplicates
    };
    
  } catch (error) {
    console.error(`❌ [DATABASE] Erro inesperado na limpeza: ${error.message}`);
    return {
      deleted_old: 0,
      deleted_today_duplicates: 0
    };
  }
}