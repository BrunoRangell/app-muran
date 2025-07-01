
import { createSupabaseClient, fetchMetaAccessToken, fetchClientData, fetchPrimaryMetaAccount, fetchActiveCustomBudget, checkExistingReview, updateExistingReview, createNewReview } from "./database.ts";

export async function processReviewRequest(req: Request) {
  const supabase = createSupabaseClient();
  
  try {
    const { clientId, reviewDate } = await req.json();
    
    if (!clientId) {
      return { success: false, error: "clientId é obrigatório" };
    }
    
    const today = reviewDate || new Date().toISOString().split('T')[0];
    
    console.log(`🔍 Processando revisão para cliente ${clientId} na data ${today}`);
    
    // 1. Verificar token Meta
    const metaToken = await fetchMetaAccessToken(supabase);
    if (!metaToken) {
      return { success: false, error: "Token Meta Ads não configurado" };
    }
    
    // 2. Buscar dados do cliente
    const clientData = await fetchClientData(supabase, clientId);
    if (!clientData) {
      return { success: false, error: "Cliente não encontrado" };
    }
    
    // 3. Buscar conta Meta principal do cliente
    const metaAccount = await fetchPrimaryMetaAccount(supabase, clientId);
    if (!metaAccount) {
      return { success: false, error: "Cliente não possui conta Meta configurada" };
    }
    
    // 4. Buscar orçamento personalizado ativo
    const customBudget = await fetchActiveCustomBudget(supabase, clientId, today);
    
    // 5. Simular dados da API Meta (substituir por chamada real depois)
    const metaApiData = {
      daily_budget: 50.0,
      total_spent: 300.0,
      account_id: metaAccount.account_id,
      account_name: metaAccount.account_name
    };
    
    // 6. Preparar dados da revisão
    const reviewData = {
      daily_budget_current: metaApiData.daily_budget,
      total_spent: metaApiData.total_spent,
      account_id: metaAccount.id, // Usar o UUID da tabela client_accounts
      using_custom_budget: !!customBudget,
      custom_budget_id: customBudget?.id || null,
      custom_budget_amount: customBudget?.budget_amount || null,
      custom_budget_start_date: customBudget?.start_date || null,
      custom_budget_end_date: customBudget?.end_date || null
    };
    
    // 7. Verificar se já existe revisão para hoje
    const existingReview = await checkExistingReview(supabase, clientId, metaAccount.id, today);
    
    if (existingReview) {
      // Atualizar revisão existente
      await updateExistingReview(supabase, existingReview.id, reviewData);
      console.log(`✅ Revisão atualizada para cliente ${clientData.company_name}`);
    } else {
      // Criar nova revisão
      await createNewReview(supabase, clientId, today, reviewData);
      console.log(`✅ Nova revisão criada para cliente ${clientData.company_name}`);
    }
    
    return {
      success: true,
      client: clientData,
      meta_account: {
        id: metaAccount.account_id,
        name: metaAccount.account_name
      },
      review_data: reviewData,
      message: "Revisão processada com sucesso"
    };
    
  } catch (error) {
    console.error("❌ Erro no processamento da revisão:", error);
    return {
      success: false,
      error: error.message
    };
  }
}
