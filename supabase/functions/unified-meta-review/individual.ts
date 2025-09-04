import { createSupabaseClient, fetchMetaAccessToken, fetchClientData, fetchPrimaryMetaAccount, fetchActiveCustomBudget, checkExistingReview, updateExistingReview, createNewReview } from "./database.ts";
import { fetchMetaApiData, fetchMetaBalance } from "./meta-api.ts";
import { updateCampaignHealth } from "./campaigns.ts";
import { IndividualReviewRequest } from "./types.ts";

export async function processIndividualReview(request: IndividualReviewRequest) {
  const processStartTime = Date.now();
  console.log(`🚀 [INDIVIDUAL] INICIANDO processamento de revisão individual`);
  
  const supabase = createSupabaseClient();
  
  try {
    const { clientId, metaAccountId, reviewDate } = request;
    
    console.log(`🔍 [INDIVIDUAL] Parâmetros recebidos:`, {
      clientId,
      metaAccountId,
      reviewDate,
      timestamp: new Date().toISOString()
    });
    
    if (!clientId) {
      console.error(`❌ [INDIVIDUAL] ERRO: clientId não fornecido`);
      return { success: false, error: "clientId é obrigatório" };
    }
    
    const today = reviewDate || new Date().toISOString().split('T')[0];
    
    console.log(`🔍 [INDIVIDUAL] Processando revisão:`, {
      clientId,
      date: today
    });
    
    // 1. Verificar token Meta
    const tokenStartTime = Date.now();
    console.log(`🔑 [INDIVIDUAL] Buscando token Meta...`);
    
    const metaToken = await fetchMetaAccessToken(supabase);
    const tokenTime = Date.now() - tokenStartTime;
    
    if (!metaToken) {
      console.error(`❌ [INDIVIDUAL] Token Meta não encontrado (${tokenTime}ms)`);
      return { success: false, error: "Token Meta Ads não configurado" };
    }
    
    console.log(`✅ [INDIVIDUAL] Token obtido (${tokenTime}ms)`);
    
    // 2. Buscar dados do cliente
    const clientStartTime = Date.now();
    console.log(`👤 [INDIVIDUAL] Buscando dados do cliente ${clientId}`);
    
    const clientData = await fetchClientData(supabase, clientId);
    const clientTime = Date.now() - clientStartTime;
    
    if (!clientData) {
      console.error(`❌ [INDIVIDUAL] Cliente não encontrado (${clientTime}ms)`);
      return { success: false, error: "Cliente não encontrado" };
    }
    
    console.log(`✅ [INDIVIDUAL] Cliente encontrado: ${clientData.company_name} (${clientTime}ms)`);
    
    // 3. Buscar conta Meta principal
    const accountStartTime = Date.now();
    console.log(`📊 [INDIVIDUAL] Buscando conta Meta principal para ${clientData.company_name}...`);
    
    const metaAccount = await fetchPrimaryMetaAccount(supabase, clientId);
    const accountTime = Date.now() - accountStartTime;
    
    if (!metaAccount) {
      console.error(`❌ [INDIVIDUAL] Conta Meta não encontrada (${accountTime}ms)`);
      return { success: false, error: "Conta Meta não encontrada para este cliente" };
    }
    
    console.log(`✅ [INDIVIDUAL] Conta Meta encontrada: ${metaAccount.account_name} (${accountTime}ms)`);
    
    // 4. Buscar orçamento personalizado ativo
    const budgetStartTime = Date.now();
    console.log(`💰 [INDIVIDUAL] Verificando orçamento personalizado...`);
    
    const customBudget = await fetchActiveCustomBudget(supabase, clientId, today);
    const budgetTime = Date.now() - budgetStartTime;
    
    console.log(`${customBudget ? '✅' : 'ℹ️'} [INDIVIDUAL] Orçamento personalizado: ${customBudget ? 'ENCONTRADO' : 'NÃO ENCONTRADO'} (${budgetTime}ms)`);
    
    // 5. Buscar dados da Meta API
    const metaDataStartTime = Date.now();
    console.log(`🔍 [INDIVIDUAL] Buscando dados da Meta API...`);
    
    const metaApiData = await fetchMetaApiData(metaAccount.account_id, metaToken, customBudget);
    const metaDataTime = Date.now() - metaDataStartTime;
    
    console.log(`✅ [INDIVIDUAL] Dados Meta API obtidos (${metaDataTime}ms):`, {
      dailyBudget: `R$ ${metaApiData.daily_budget.toFixed(2)}`,
      totalSpent: `R$ ${metaApiData.total_spent.toFixed(2)}`,
      accountName: metaApiData.account_name
    });
    
    // 6. Buscar saldo da conta Meta
    const balanceStartTime = Date.now();
    console.log(`💰 [INDIVIDUAL] Buscando saldo da conta...`);
    
    const balanceData = await fetchMetaBalance(metaAccount.account_id, metaToken, supabase);
    const balanceTime = Date.now() - balanceStartTime;
    
    console.log(`✅ [INDIVIDUAL] Saldo obtido (${balanceTime}ms):`, {
      saldoRestante: balanceData.saldo_restante ? `R$ ${balanceData.saldo_restante.toFixed(2)}` : 'N/A',
      isPrepayAccount: balanceData.is_prepay_account
    });
    
    // 7. Preparar dados para salvar
    const reviewData = {
      daily_budget_current: metaApiData.daily_budget,
      total_spent: metaApiData.total_spent,
      account_id: metaAccount.id,
      using_custom_budget: !!customBudget,
      custom_budget_id: customBudget?.id || null,
      custom_budget_amount: customBudget?.budget_amount || null,
      custom_budget_start_date: customBudget?.start_date || null,
      custom_budget_end_date: customBudget?.end_date || null,
      saldo_restante: balanceData.saldo_restante,
      is_prepay_account: balanceData.is_prepay_account
    };
    
    // 8. Verificar revisão existente e salvar/atualizar
    const saveStartTime = Date.now();
    console.log(`💾 [INDIVIDUAL] Salvando revisão...`);
    
    const existingReview = await checkExistingReview(supabase, clientId, metaAccount.id, today);
    
    let reviewId;
    if (existingReview) {
      await updateExistingReview(supabase, existingReview.id, reviewData);
      reviewId = existingReview.id;
    } else {
      reviewId = await createNewReview(supabase, clientId, today, reviewData);
    }
    
    const saveTime = Date.now() - saveStartTime;
    console.log(`✅ [INDIVIDUAL] Revisão salva: ID ${reviewId} (${saveTime}ms)`);
    
    // 9. Atualizar campaign health (executa de forma assíncrona)
    console.log(`📊 [INDIVIDUAL] Atualizando campaign health...`);
    updateCampaignHealth(supabase, clientId, metaAccount.account_id, metaToken, today).catch(error => {
      console.error(`⚠️ [INDIVIDUAL] Erro ao atualizar campaign health:`, error);
    });
    
    const totalTime = Date.now() - processStartTime;
    console.log(`🎉 [INDIVIDUAL] PROCESSAMENTO CONCLUÍDO (${totalTime}ms)`);
    
    return {
      success: true,
      data: {
        client: {
          id: clientId,
          name: clientData.company_name
        },
        account: {
          id: metaAccount.id,
          name: metaAccount.account_name,
          account_id: metaAccount.account_id
        },
        review: {
          id: reviewId,
          date: today,
          daily_budget: metaApiData.daily_budget,
          total_spent: metaApiData.total_spent,
          using_custom_budget: !!customBudget,
          saldo_restante: balanceData.saldo_restante,
          is_prepay_account: balanceData.is_prepay_account
        },
        processing_time: totalTime
      }
    };

  } catch (error) {
    const totalTime = Date.now() - processStartTime;
    console.error(`❌ [INDIVIDUAL] ERRO NO PROCESSAMENTO (${totalTime}ms):`, error);
    return { success: false, error: error.message };
  }
}