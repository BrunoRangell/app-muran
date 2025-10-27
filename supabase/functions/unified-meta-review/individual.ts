import { createSupabaseClient, fetchMetaAccessToken, fetchClientData, fetchPrimaryMetaAccount, fetchSpecificMetaAccount, fetchActiveCustomBudget, checkExistingReview, updateExistingReview, createNewReview } from "./database.ts";
import { fetchMetaApiData, fetchMetaBalance, fetchAccountBasicInfo } from "./meta-api.ts";
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
    
    // 3. Buscar conta Meta (específica ou principal)
    const accountStartTime = Date.now();
    
    let metaAccount;
    if (metaAccountId) {
      console.log(`📊 [INDIVIDUAL] Buscando conta Meta ESPECÍFICA ${metaAccountId} para ${clientData.company_name}...`);
      metaAccount = await fetchSpecificMetaAccount(supabase, clientId, metaAccountId);
    } else {
      console.log(`📊 [INDIVIDUAL] Buscando conta Meta PRINCIPAL para ${clientData.company_name}...`);
      metaAccount = await fetchPrimaryMetaAccount(supabase, clientId);
    }
    
    const accountTime = Date.now() - accountStartTime;
    
    if (!metaAccount) {
      console.error(`❌ [INDIVIDUAL] Conta Meta não encontrada (${accountTime}ms)`);
      return { success: false, error: "Conta Meta não encontrada para este cliente" };
    }
    
    console.log(`✅ [INDIVIDUAL] Conta Meta selecionada (${accountTime}ms):`, {
      account_id: metaAccount.account_id,
      account_name: metaAccount.account_name,
      is_primary: metaAccount.is_primary,
      requested_account: metaAccountId || 'primária (padrão)'
    });
    
    // 4. Buscar orçamento personalizado ativo
    const budgetStartTime = Date.now();
    console.log(`💰 [INDIVIDUAL] Verificando orçamento personalizado...`);
    
    const customBudget = await fetchActiveCustomBudget(supabase, clientId, today);
    const budgetTime = Date.now() - budgetStartTime;
    
    console.log(`${customBudget ? '✅' : 'ℹ️'} [INDIVIDUAL] Orçamento personalizado: ${customBudget ? 'ENCONTRADO' : 'NÃO ENCONTRADO'} (${budgetTime}ms)`);
    
    // 5. Buscar informações básicas da conta (incluindo funding check)
    const basicInfoStartTime = Date.now();
    console.log(`🔍 [INDIVIDUAL] Buscando informações básicas da conta...`);
    
    const basicAccountInfo = await fetchAccountBasicInfo(metaAccount.account_id, metaToken);
    const basicInfoTime = Date.now() - basicInfoStartTime;
    
    console.log(`✅ [INDIVIDUAL] Informações básicas obtidas (${basicInfoTime}ms):`, {
      accountName: basicAccountInfo.accountName,
      isPrepayAccount: basicAccountInfo.isPrepayAccount,
      lastFundingDate: basicAccountInfo.lastFundingDate,
      lastFundingAmount: basicAccountInfo.lastFundingAmount
    });

    // 6. Buscar dados da Meta API
    const metaDataStartTime = Date.now();
    console.log(`🔍 [INDIVIDUAL] Buscando dados da Meta API...`);
    
    const metaApiData = await fetchMetaApiData(metaAccount.account_id, metaToken, customBudget);
    const metaDataTime = Date.now() - metaDataStartTime;
    
    console.log(`✅ [INDIVIDUAL] Dados Meta API obtidos (${metaDataTime}ms):`, {
      dailyBudget: `R$ ${metaApiData.daily_budget.toFixed(2)}`,
      totalSpent: `R$ ${metaApiData.total_spent.toFixed(2)}`,
      accountName: metaApiData.account_name
    });
    
    // 7. Buscar saldo da conta Meta
    const balanceStartTime = Date.now();
    console.log(`💰 [INDIVIDUAL] Buscando saldo da conta...`);
    
    const balanceData = await fetchMetaBalance(metaAccount.account_id, metaToken, supabase);
    const balanceTime = Date.now() - balanceStartTime;
    
    console.log(`✅ [INDIVIDUAL] Saldo obtido (${balanceTime}ms):`, {
      saldoRestante: balanceData.saldo_restante ? `R$ ${balanceData.saldo_restante.toFixed(2)}` : 'N/A',
      isPrepayAccount: balanceData.is_prepay_account
    });
    
    // 8. Preparar dados para salvar
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
    
    // 9. Verificar revisão existente e salvar/atualizar
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
    
    // 10. Atualizar saldo e modelo de cobrança na tabela client_accounts
    console.log(`🔄 [DATABASE] Atualizando saldo e modelo de cobrança em client_accounts para conta ${metaAccount.id}`);
    console.log('🔎 [DATABASE] Dados de funding do basicInfo:', {
      lastFundingDate: basicAccountInfo.lastFundingDate,
      lastFundingAmount: basicAccountInfo.lastFundingAmount
    });
    console.log('🔎 [DATABASE] Dados de funding do balanceData:', {
      funding_amount: balanceData.funding_amount,
      last_funding_date: balanceData.last_funding_date
    });

    const updateData: any = {
      saldo_restante: balanceData.saldo_restante,
      is_prepay_account: basicAccountInfo.is_prepay_account, // SEMPRE da API Graph
      updated_at: new Date().toISOString()
    };

    console.log(`🔍 [INDIVIDUAL] ===== INÍCIO DEBUG DATABASE UPDATE =====`);
    console.log(`🔍 [INDIVIDUAL] Dados recebidos:`, {
      basicInfo_is_prepay_account: basicAccountInfo.is_prepay_account,
      balanceData_funding_amount: balanceData.funding_amount,
      balanceData_last_funding_date: balanceData.last_funding_date,
      balanceData_source: balanceData.source,
      accountId: metaAccount.id,
      clientName: clientData.company_name
    });

    // REGRA SIMPLIFICADA: Salvar funding SOMENTE se houver dados no balanceData
    const fundingDate = balanceData.last_funding_date;
    const fundingAmount = balanceData.funding_amount;

    if (fundingDate && fundingAmount) {
      console.log(`✅ [INDIVIDUAL] ===== FUNDING DETECTADO! PREPARANDO UPDATE =====`);
      console.log(`💰 [INDIVIDUAL] Fonte: balanceData`);
      
      updateData.last_funding_detected_at = fundingDate;
      updateData.last_funding_amount = fundingAmount;
      
      console.log(`💰 [INDIVIDUAL] Dados de funding que serão salvos:`, {
        last_funding_detected_at: updateData.last_funding_detected_at,
        last_funding_amount: updateData.last_funding_amount,
        account_id: metaAccount.id,
        account_name: metaAccount.account_name
      });
    } else {
      console.log(`ℹ️ [INDIVIDUAL] ===== SEM FUNDING PARA SALVAR =====`);
      console.log(`ℹ️ [INDIVIDUAL] Motivos:`, {
        is_prepay_account: basicAccountInfo.is_prepay_account,
        balanceData_source: balanceData.source,
        balanceData_last_funding_date: balanceData.last_funding_date,
        balanceData_funding_amount: balanceData.funding_amount,
        final_fundingDate: fundingDate,
        final_fundingAmount: fundingAmount
      });
    }

    console.log('📦 [INDIVIDUAL] ===== DADOS FINAIS PARA UPDATE =====');
    console.log('📦 [INDIVIDUAL] updateData completo:', JSON.stringify(updateData, null, 2));
    console.log('📦 [INDIVIDUAL] Conta que será atualizada:', {
      account_id: metaAccount.id,
      account_name: metaAccount.account_name,
      client_name: clientData.company_name
    });

    console.log('🔄 [DATABASE] Executando UPDATE...');
    const { error: updateAccountError, count: updateCount } = await supabase
      .from('client_accounts')
      .update(updateData)
      .eq('id', metaAccount.id)
      .select('id', { count: 'exact' });

    if (updateAccountError) {
      console.error('❌ [DATABASE] ===== ERRO NO UPDATE =====');
      console.error('❌ [DATABASE] Detalhes do erro:', {
        error: updateAccountError,
        message: updateAccountError.message,
        details: updateAccountError.details,
        hint: updateAccountError.hint,
        code: updateAccountError.code,
        count: updateCount,
        updateData: updateData,
        accountId: metaAccount.id
      });
    } else {
      console.log('✅ [DATABASE] ===== UPDATE EXECUTADO COM SUCESSO =====');
      console.log('✅ [DATABASE] Resultado do update:', {
        count: updateCount,
        accountId: metaAccount.id,
        updatedFields: Object.keys(updateData)
      });
      
      // VERIFICAÇÃO CRÍTICA: Consultar o banco para confirmar se os dados foram salvos
      console.log('🔍 [DATABASE] ===== VERIFICANDO SE DADOS FORAM PERSISTIDOS =====');
      try {
        const { data: verificationData, error: verificationError } = await supabase
          .from('client_accounts')
          .select('id, account_name, last_funding_detected_at, last_funding_amount, is_prepay_account, updated_at')
          .eq('id', metaAccount.id)
          .single();
          
        if (verificationError) {
          console.error('❌ [DATABASE] Erro na verificação pós-update:', verificationError);
        } else {
          console.log('✅ [DATABASE] DADOS VERIFICADOS PÓS-UPDATE:', {
            account_id: verificationData.id,
            account_name: verificationData.account_name,
            last_funding_detected_at: verificationData.last_funding_detected_at,
            last_funding_amount: verificationData.last_funding_amount,
            is_prepay_account: verificationData.is_prepay_account,
            updated_at: verificationData.updated_at,
            funding_data_saved: !!(verificationData.last_funding_detected_at || verificationData.last_funding_amount)
          });
          
          // Comparar com os dados que tentamos salvar
          const dataMatch = {
            funding_date_match: verificationData.last_funding_detected_at === updateData.last_funding_detected_at,
            funding_amount_match: verificationData.last_funding_amount === updateData.last_funding_amount
          };
          console.log('🔍 [DATABASE] COMPARAÇÃO DOS DADOS:', dataMatch);
        }
      } catch (verificationError) {
        console.error('❌ [DATABASE] Erro crítico na verificação:', verificationError);
      }
    }
    
    console.log(`🔍 [INDIVIDUAL] ===== FIM DEBUG DATABASE UPDATE =====`);

    // 11. Atualizar campaign health (executa de forma assíncrona)
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