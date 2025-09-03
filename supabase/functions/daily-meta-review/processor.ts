
import { createSupabaseClient, fetchMetaAccessToken, fetchClientData, fetchPrimaryMetaAccount, fetchActiveCustomBudget, checkExistingReview, updateExistingReview, createNewReview } from "./database.ts";

// Função para buscar conjuntos de anúncios de uma campanha
async function fetchAdSets(campaignId: string, accessToken: string, campaignName: string = "") {
  const startTime = Date.now();
  console.log(`🔍 [ADSETS] Iniciando busca de adsets para campanha ${campaignId} (${campaignName})`);
  
  try {
    const adsetsUrl = `https://graph.facebook.com/v22.0/${campaignId}/adsets?fields=id,name,daily_budget,status,effective_status,end_time&access_token=${accessToken}&limit=1000`;
    console.log(`📞 [ADSETS] Chamando Meta API para campanha ${campaignId}`);
    
    const response = await fetch(adsetsUrl);
    const responseTime = Date.now() - startTime;
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error(`❌ [ADSETS] ERRO na API para campanha ${campaignId}:`, {
        status: response.status,
        statusText: response.statusText,
        error: errorData,
        campaignName,
        responseTime: `${responseTime}ms`
      });
      return [];
    }

    const data = await response.json();
    const adsets = data.data || [];
    
    console.log(`✅ [ADSETS] Sucesso campanha ${campaignId}:`, {
      campanhaName: campaignName,
      totalAdsets: adsets.length,
      responseTime: `${responseTime}ms`,
      adsetNames: adsets.slice(0, 3).map(a => a.name) // Primeiros 3 nomes
    });
    
    return adsets;
  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error(`❌ [ADSETS] ERRO EXCEPTION campanha ${campaignId}:`, {
      error: error.message,
      stack: error.stack,
      campaignName,
      responseTime: `${responseTime}ms`
    });
    return [];
  }
}

// Função para filtrar adsets ativos
function filterActiveAdsets(adsets: any[], now: Date, campaignId: string = "") {
  const startTime = Date.now();
  console.log(`🔍 [FILTER] Iniciando filtro de adsets para campanha ${campaignId}, total: ${adsets.length}`);
  
  const activeAdsets = adsets.filter(adset => {
    // Verificar status
    if (adset.status !== "ACTIVE") {
      console.log(`[FILTER] Adset ${adset.id} (${adset.name}) não ativo. Status: ${adset.status}`);
      return false;
    }
    
    // Verificar effective_status
    if (adset.effective_status !== "ACTIVE") {
      console.log(`[FILTER] Adset ${adset.id} (${adset.name}) effective_status: ${adset.effective_status}`);
      return false;
    }
    
    // Verificar data de término
    if (adset.end_time) {
      const endTime = new Date(adset.end_time);
      const isFuture = endTime > now;
      if (!isFuture) {
        console.log(`[FILTER] Adset ${adset.id} (${adset.name}) expirado em ${endTime.toLocaleDateString('pt-BR')}`);
        return false;
      }
    }
    
    return true;
  });
  
  const filterTime = Date.now() - startTime;
  console.log(`✅ [FILTER] Filtro concluído campanha ${campaignId}:`, {
    totalOriginal: adsets.length,
    totalAtivos: activeAdsets.length,
    filterTime: `${filterTime}ms`,
    activeAdsetBudgets: activeAdsets.map(a => ({ name: a.name, budget: a.daily_budget }))
  });
  
  return activeAdsets;
}

// Função para buscar saldo e modelo de cobrança da Meta API
async function fetchMetaBalance(accountId: string, accessToken: string) {
  const startTime = Date.now();
  console.log(`💰 [BALANCE] Iniciando busca de saldo para conta ${accountId}`);
  
  try {
    // Buscar dados da conta Meta incluindo is_prepay_account diretamente
    const accountUrl = `https://graph.facebook.com/v22.0/act_${accountId}?fields=name,balance,currency,expired_funding_source_details,is_prepay_account,spend_cap,amount_spent&access_token=${accessToken}`;
    console.log(`📞 [BALANCE] Chamando Meta API para dados completos da conta ${accountId}`);
    
    const response = await fetch(accountUrl);
    const responseTime = Date.now() - startTime;
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error(`❌ [BALANCE] ERRO na API para conta ${accountId}:`, {
        status: response.status,
        statusText: response.statusText,
        error: errorData,
        responseTime: `${responseTime}ms`
      });
      return { saldo_restante: null, is_prepay_account: null };
    }

    const data = await response.json();
    console.log(`✅ [BALANCE] Dados completos da conta obtidos:`, {
      accountId,
      responseTime: `${responseTime}ms`,
      accountName: data.name,
      hasBalance: !!data.balance,
      hasFundingDetails: !!data.expired_funding_source_details,
      isPrepayAccount: data.is_prepay_account,
      currency: data.currency
    });
    
    let saldo_restante = null;
    
    // Extrair saldo primeiro do expired_funding_source_details, depois do balance
    if (data.expired_funding_source_details?.display_string) {
      // Usar função utilitária existente para processar display_string
      console.log(`💰 [BALANCE] Processando display_string: ${data.expired_funding_source_details.display_string}`);
      
      // Importar função de parsing do metaBalance.ts seria ideal, mas vamos implementar inline
      const match = data.expired_funding_source_details.display_string.match(/R\$\s*([\d.,]+)/);
      if (match && match[1]) {
        saldo_restante = parseFloat(match[1].replace(/\./g, "").replace(",", "."));
        console.log(`💰 [BALANCE] Saldo extraído do display_string: R$ ${saldo_restante.toFixed(2)}`);
      }
    } else if (data.balance) {
      // Fallback para balance direto (em centavos USD, convertendo para BRL)
      saldo_restante = parseFloat(data.balance) / 100 * 5.5;
      console.log(`💰 [BALANCE] Saldo extraído do balance field: ${data.balance} centavos USD = R$ ${saldo_restante.toFixed(2)}`);
    }
    
    // Usar diretamente o campo is_prepay_account da API Meta
    const is_prepay_account = data.is_prepay_account || false;
    console.log(`🏦 [BALANCE] Modelo de cobrança detectado diretamente da API:`, {
      isPrepayAccount: is_prepay_account,
      accountType: is_prepay_account ? 'PRÉ-PAGO' : 'PÓS-PAGO'
    });
    
    return { saldo_restante, is_prepay_account };
    
  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error(`❌ [BALANCE] ERRO EXCEPTION conta ${accountId}:`, {
      error: error.message,
      stack: error.stack,
      responseTime: `${responseTime}ms`
    });
    return { saldo_restante: null, is_prepay_account: null };
  }
}

// Função para buscar dados reais da Meta Graph API
async function fetchMetaApiData(accountId: string, accessToken: string, customBudget: any) {
  const totalStartTime = Date.now();
  console.log(`🚀 [META_API] INICIANDO busca para conta ${accountId}`);
  console.log(`🚀 [META_API] Custom budget ativo:`, !!customBudget);
  
  try {
    // 1. Buscar campanhas ativas para calcular orçamento diário total
    const campaignsStartTime = Date.now();
    const campaignsUrl = `https://graph.facebook.com/v22.0/act_${accountId}/campaigns?fields=daily_budget,lifetime_budget,status,effective_status,end_time,name&access_token=${accessToken}&limit=1000`;
    console.log(`📞 [CAMPAIGNS] Buscando campanhas da conta ${accountId}`);
    
    const campaignsResponse = await fetch(campaignsUrl);
    const campaignsResponseTime = Date.now() - campaignsStartTime;
    
    if (!campaignsResponse.ok) {
      const errorData = await campaignsResponse.json();
      console.error(`❌ [CAMPAIGNS] ERRO API conta ${accountId}:`, {
        status: campaignsResponse.status,
        statusText: campaignsResponse.statusText,
        error: errorData,
        responseTime: `${campaignsResponseTime}ms`
      });
      return { daily_budget: 0, total_spent: 0, account_name: null };
    }

    const campaignsData = await campaignsResponse.json();
    const campaigns = campaignsData.data || [];
    
    console.log(`✅ [CAMPAIGNS] Campanhas obtidas conta ${accountId}:`, {
      totalCampaigns: campaigns.length,
      responseTime: `${campaignsResponseTime}ms`,
      campaignNames: campaigns.slice(0, 5).map(c => c.name)
    });

    // Calcular orçamento diário total das campanhas ativas
    let totalDailyBudget = 0;
    const now = new Date();
    let processedCampaigns = 0;
    let campaignsWithBudget = 0;
    let campaignsNeedingAdsets = 0;
    
    // Processar cada campanha
    for (const campaign of campaigns) {
      const campaignStartTime = Date.now();
      processedCampaigns++;
      
      console.log(`\n🔍 [CAMPAIGN_${processedCampaigns}] Processando:`, {
        id: campaign.id,
        name: campaign.name,
        status: campaign.status,
        effectiveStatus: campaign.effective_status,
        dailyBudget: campaign.daily_budget
      });
      
      // Verificar se a campanha está ativa
      if (campaign.status !== "ACTIVE") {
        console.log(`[CAMPAIGN_${processedCampaigns}] SKIP - Status não ativo: ${campaign.status}`);
        continue;
      }

      // Verificar effective_status também
      if (campaign.effective_status !== "ACTIVE") {
        console.log(`[CAMPAIGN_${processedCampaigns}] SKIP - Effective status: ${campaign.effective_status}`);
        continue;
      }

      // Verificar data de término
      if (campaign.end_time) {
        const endTime = new Date(campaign.end_time);
        const isFuture = endTime > now;
        if (!isFuture) {
          console.log(`[CAMPAIGN_${processedCampaigns}] SKIP - Expirada em ${endTime.toLocaleDateString('pt-BR')}`);
          continue;
        }
      }

      // Se a campanha tem orçamento diário, usar ele
      if (campaign.daily_budget && parseInt(campaign.daily_budget) > 0) {
        const campaignBudget = parseInt(campaign.daily_budget) / 100; // Converte de centavos para reais
        totalDailyBudget += campaignBudget;
        campaignsWithBudget++;
        
        const campaignTime = Date.now() - campaignStartTime;
        console.log(`💰 [CAMPAIGN_${processedCampaigns}] Orçamento direto: R$ ${campaignBudget.toFixed(2)} (${campaignTime}ms)`);
      } 
      // Se não tem orçamento diário ou é zero, buscar adsets
      else {
        campaignsNeedingAdsets++;
        console.log(`🔍 [CAMPAIGN_${processedCampaigns}] Buscando adsets - sem orçamento direto`);
        
        // Buscar adsets da campanha
        const adsetsStartTime = Date.now();
        const adsets = await fetchAdSets(campaign.id, accessToken, campaign.name);
        const adsetsTime = Date.now() - adsetsStartTime;
        
        console.log(`📊 [CAMPAIGN_${processedCampaigns}] Adsets obtidos: ${adsets.length} (${adsetsTime}ms)`);
        
        const activeAdsets = filterActiveAdsets(adsets, now, campaign.id);
        
        // Somar orçamentos dos adsets ativos
        let adsetBudgetSum = 0;
        let adsetsWithBudget = 0;
        
        for (const adset of activeAdsets) {
          if (adset.daily_budget && parseInt(adset.daily_budget) > 0) {
            const adsetBudget = parseInt(adset.daily_budget) / 100; // Converte de centavos para reais
            adsetBudgetSum += adsetBudget;
            adsetsWithBudget++;
          }
        }
        
        if (adsetBudgetSum > 0) {
          totalDailyBudget += adsetBudgetSum;
        }
        
        const campaignTime = Date.now() - campaignStartTime;
        console.log(`💰 [CAMPAIGN_${processedCampaigns}] Orçamento via adsets: R$ ${adsetBudgetSum.toFixed(2)}`, {
          totalAdsets: adsets.length,
          activeAdsets: activeAdsets.length,
          adsetsWithBudget,
          campaignTime: `${campaignTime}ms`
        });
      }
    }

    const budgetCalculationTime = Date.now() - campaignsStartTime;
    console.log(`💰 [BUDGET_CALC] Cálculo concluído:`, {
      totalDailyBudget: `R$ ${totalDailyBudget.toFixed(2)}`,
      processedCampaigns,
      campaignsWithBudget,
      campaignsNeedingAdsets,
      calculationTime: `${budgetCalculationTime}ms`
    });

    // 2. Buscar insights de gasto para o período atual
    const insightsStartTime = Date.now();
    const today = new Date();
    const startDate = customBudget 
      ? customBudget.start_date 
      : `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`; // Início do mês atual
    const endDate = customBudget 
      ? customBudget.end_date 
      : today.toISOString().split('T')[0]; // Hoje

    console.log(`📅 [INSIGHTS] Buscando gastos período: ${startDate} até ${endDate}`);

    const insightsUrl = `https://graph.facebook.com/v22.0/act_${accountId}/insights?fields=spend&time_range={"since":"${startDate}","until":"${endDate}"}&access_token=${accessToken}`;
    
    const insightsResponse = await fetch(insightsUrl);
    const insightsResponseTime = Date.now() - insightsStartTime;
    
    if (!insightsResponse.ok) {
      const insightsError = await insightsResponse.json();
      console.error(`❌ [INSIGHTS] ERRO API conta ${accountId}:`, {
        status: insightsResponse.status,
        statusText: insightsResponse.statusText,
        error: insightsError,
        responseTime: `${insightsResponseTime}ms`
      });
      return { daily_budget: totalDailyBudget, total_spent: 0, account_name: null };
    }

    const insightsData = await insightsResponse.json();
    
    console.log(`✅ [INSIGHTS] Dados obtidos:`, {
      responseTime: `${insightsResponseTime}ms`,
      dataLength: insightsData.data?.length || 0,
      rawData: insightsData
    });

    // Calcular gasto total
    let totalSpent = 0;
    if (insightsData.data && insightsData.data.length > 0) {
      insightsData.data.forEach(insight => {
        if (insight.spend) {
          const spendValue = parseFloat(insight.spend);
          if (!isNaN(spendValue)) {
            totalSpent += spendValue;
          }
        }
      });
    }

    console.log(`💸 [INSIGHTS] Gasto calculado: R$ ${totalSpent.toFixed(2)}`);

    // 3. Buscar informações detalhadas da conta Meta (nome da conta)
    const accountInfoStartTime = Date.now();
    console.log(`🔍 [ACCOUNT_INFO] Buscando info da conta ${accountId}`);
    
    const accountUrl = `https://graph.facebook.com/v22.0/act_${accountId}?fields=name,account_id&access_token=${accessToken}`;
    
    let accountName = null;
    try {
      const accountResponse = await fetch(accountUrl);
      const accountInfoTime = Date.now() - accountInfoStartTime;
      
      if (accountResponse.ok) {
        const accountData = await accountResponse.json();
        accountName = accountData.name;
        console.log(`✅ [ACCOUNT_INFO] Nome obtido: ${accountName} (${accountInfoTime}ms)`);
      } else {
        console.log(`⚠️ [ACCOUNT_INFO] Erro ao obter nome (${accountInfoTime}ms):`, {
          status: accountResponse.status,
          statusText: accountResponse.statusText
        });
      }
    } catch (error) {
      const accountInfoTime = Date.now() - accountInfoStartTime;
      console.log(`⚠️ [ACCOUNT_INFO] Exception (${accountInfoTime}ms):`, error.message);
    }

    const totalTime = Date.now() - totalStartTime;
    console.log(`🎉 [META_API] CONCLUÍDO conta ${accountId}:`, {
      totalTime: `${totalTime}ms`,
      dailyBudget: `R$ ${totalDailyBudget.toFixed(2)}`,
      totalSpent: `R$ ${totalSpent.toFixed(2)}`,
      accountName: accountName || 'N/A'
    });

    return {
      daily_budget: totalDailyBudget,
      total_spent: totalSpent,
      account_name: accountName
    };

  } catch (error) {
    const totalTime = Date.now() - totalStartTime;
    console.error(`❌ [META_API] ERRO GERAL conta ${accountId}:`, {
      error: error.message,
      stack: error.stack,
      totalTime: `${totalTime}ms`
    });
    return { daily_budget: 0, total_spent: 0, account_name: null };
  }
}

export async function processReviewRequest(req: Request) {
  const processStartTime = Date.now();
  console.log(`🚀 [PROCESSOR] INICIANDO processamento de revisão`);
  
  const supabase = createSupabaseClient();
  
  try {
    const { clientId, metaAccountId, reviewDate } = await req.json();
    
    console.log(`🔍 [PROCESSOR] Parâmetros recebidos:`, {
      clientId,
      metaAccountId,
      reviewDate,
      timestamp: new Date().toISOString()
    });
    
    if (!clientId) {
      console.error(`❌ [PROCESSOR] ERRO: clientId não fornecido`);
      return { success: false, error: "clientId é obrigatório" };
    }
    
    const today = reviewDate || new Date().toISOString().split('T')[0];
    
    console.log(`🔍 [PROCESSOR] Processando revisão:`, {
      clientId,
      date: today
    });
    
    // 1. Verificar token Meta
    const tokenStartTime = Date.now();
    console.log(`🔑 [TOKEN] Buscando token Meta...`);
    
    const metaToken = await fetchMetaAccessToken(supabase);
    const tokenTime = Date.now() - tokenStartTime;
    
    if (!metaToken) {
      console.error(`❌ [TOKEN] Token Meta não encontrado (${tokenTime}ms)`);
      return { success: false, error: "Token Meta Ads não configurado" };
    }
    
    console.log(`✅ [TOKEN] Token obtido (${tokenTime}ms)`);
    
    // 2. Buscar dados do cliente
    const clientStartTime = Date.now();
    console.log(`👤 [CLIENT] Buscando dados do cliente ${clientId}`);
    
    const clientData = await fetchClientData(supabase, clientId);
    const clientTime = Date.now() - clientStartTime;
    
    if (!clientData) {
      console.error(`❌ [CLIENT] Cliente não encontrado (${clientTime}ms)`);
      return { success: false, error: "Cliente não encontrado" };
    }
    
    console.log(`✅ [CLIENT] Cliente encontrado: ${clientData.company_name} (${clientTime}ms)`);
    
    // 3. Buscar conta Meta específica ou principal do cliente
    const accountStartTime = Date.now();
    let metaAccount = null;
    
    if (metaAccountId) {
      console.log(`🏢 [META_ACCOUNT] Buscando conta Meta ESPECÍFICA ${metaAccountId} para cliente ${clientId}`);
      
      // Importar função para buscar conta específica
      const { fetchMetaAccountDetails } = await import("./database.ts");
      metaAccount = await fetchMetaAccountDetails(supabase, clientId, metaAccountId);
      
      if (!metaAccount) {
        console.error(`❌ [META_ACCOUNT] Conta Meta específica ${metaAccountId} não encontrada para cliente ${clientId}`);
        return { success: false, error: `Conta Meta específica ${metaAccountId} não encontrada` };
      }
      
      console.log(`✅ [META_ACCOUNT] Conta ESPECÍFICA encontrada:`, {
        accountId: metaAccount.account_id,
        accountName: metaAccount.account_name,
        isPrimary: metaAccount.is_primary
      });
    } else {
      console.log(`🏢 [META_ACCOUNT] Buscando conta Meta PRINCIPAL para cliente ${clientId}`);
      metaAccount = await fetchPrimaryMetaAccount(supabase, clientId);
      
      if (!metaAccount) {
        console.error(`❌ [META_ACCOUNT] Conta Meta principal não encontrada`);
        return { success: false, error: "Cliente não possui conta Meta configurada" };
      }
      
      console.log(`✅ [META_ACCOUNT] Conta PRINCIPAL encontrada:`, {
        accountId: metaAccount.account_id,
        accountName: metaAccount.account_name,
        isPrimary: metaAccount.is_primary
      });
    }
    
    const accountTime = Date.now() - accountStartTime;
    
    // 4. Buscar orçamento personalizado ativo
    const budgetStartTime = Date.now();
    console.log(`💰 [CUSTOM_BUDGET] Verificando orçamento personalizado`);
    
    const customBudget = await fetchActiveCustomBudget(supabase, clientId, today);
    const budgetTime = Date.now() - budgetStartTime;
    
    console.log(`✅ [CUSTOM_BUDGET] Verificação concluída (${budgetTime}ms):`, {
      hasCustomBudget: !!customBudget,
      budgetAmount: customBudget?.budget_amount || null
    });
    
    // 5. BUSCAR DADOS REAIS DA META API (com lógica corrigida para adsets)
    console.log(`🚀 [MAIN_FETCH] Iniciando busca principal da Meta API`);
    const metaApiData = await fetchMetaApiData(metaAccount.account_id, metaToken, customBudget);
    
    // 5.1. BUSCAR SALDO E MODELO DE COBRANÇA
    console.log(`💰 [BALANCE_FETCH] Buscando saldo e modelo de cobrança`);
    const balanceData = await fetchMetaBalance(metaAccount.account_id, metaToken);
    
    console.log(`✅ [MAIN_FETCH] Dados Meta API obtidos:`, {
      daily_budget: metaApiData.daily_budget,
      total_spent: metaApiData.total_spent,
      account_id: metaAccount.account_id,
      account_name: metaApiData.account_name,
      saldo_restante: balanceData.saldo_restante,
      is_prepay_account: balanceData.is_prepay_account
    });
    
    // 6. 🧹 LIMPEZA AUTOMÁTICA: Remover revisões antigas da tabela budget_reviews
    const cleanupStartTime = Date.now();
    console.log(`🧹 [CLEANUP] Iniciando limpeza automática da tabela budget_reviews...`);
    
    // 6.1. Remover TODAS as revisões anteriores a hoje
    const { error: deleteOldError } = await supabase
      .from('budget_reviews')
      .delete()
      .eq('platform', 'meta')
      .lt('review_date', today);

    if (deleteOldError) {
      console.error('❌ [CLEANUP] Erro ao limpar revisões de dias anteriores:', deleteOldError);
    } else {
      console.log(`✅ [CLEANUP] Revisões de dias anteriores removidas (review_date < ${today})`);
    }

    // 6.2. Remover revisões duplicadas de hoje para esta conta específica
    const { error: deleteTodayDuplicatesError } = await supabase
      .from('budget_reviews')
      .delete()
      .eq('platform', 'meta')
      .eq('client_id', clientId)
      .eq('account_id', metaAccount.account_id)
      .eq('review_date', today);

    if (deleteTodayDuplicatesError) {
      console.error('❌ [CLEANUP] Erro ao limpar revisões duplicadas de hoje:', deleteTodayDuplicatesError);
    } else {
      console.log(`✅ [CLEANUP] Revisões duplicadas de hoje removidas para conta ${metaAccount.account_id}`);
    }

    const cleanupTime = Date.now() - cleanupStartTime;
    console.log(`✅ [CLEANUP] Limpeza concluída (${cleanupTime}ms)`);

    // 7. Atualizar nome da conta na tabela client_accounts APENAS se obtivemos um nome válido da API
    if (metaApiData.account_name && metaApiData.account_name !== metaAccount.account_name) {
      const updateStartTime = Date.now();
      console.log(`🔄 [UPDATE] Atualizando nome da conta`);
      
      const { error: updateError } = await supabase
        .from("client_accounts")
        .update({ 
          account_name: metaApiData.account_name,
          updated_at: new Date().toISOString()
        })
        .eq("id", metaAccount.id);
      
      const updateTime = Date.now() - updateStartTime;
      
      if (updateError) {
        console.error(`❌ [UPDATE] Erro ao atualizar nome (${updateTime}ms):`, updateError.message);
      } else {
        console.log(`✅ [UPDATE] Nome atualizado com sucesso (${updateTime}ms)`);
      }
    }
    
    // 7. Preparar dados da revisão incluindo saldo
    const reviewData = {
      daily_budget_current: metaApiData.daily_budget,
      total_spent: metaApiData.total_spent,
      account_id: metaAccount.id, // Usar o UUID da tabela client_accounts
      using_custom_budget: !!customBudget,
      custom_budget_id: customBudget?.id || null,
      custom_budget_amount: customBudget?.budget_amount || null,
      custom_budget_start_date: customBudget?.start_date || null,
      custom_budget_end_date: customBudget?.end_date || null,
      saldo_restante: balanceData.saldo_restante,
      is_prepay_account: balanceData.is_prepay_account
    };
    
    console.log(`📋 [REVIEW_DATA] Dados preparados:`, reviewData);
    
    // 8. Verificar se já existe revisão para hoje
    const existingStartTime = Date.now();
    console.log(`🔍 [EXISTING] Verificando revisão existente`);
    
    const existingReview = await checkExistingReview(supabase, clientId, metaAccount.id, today);
    const existingTime = Date.now() - existingStartTime;
    
    console.log(`✅ [EXISTING] Verificação concluída (${existingTime}ms):`, {
      hasExisting: !!existingReview,
      existingId: existingReview?.id || null
    });
    
    if (existingReview) {
      // Atualizar revisão existente
      const updateStartTime = Date.now();
      console.log(`🔄 [SAVE] Atualizando revisão existente ${existingReview.id}`);
      
      await updateExistingReview(supabase, existingReview.id, reviewData);
      const updateTime = Date.now() - updateStartTime;
      
      console.log(`✅ [SAVE] Revisão atualizada (${updateTime}ms)`);
    } else {
      // Criar nova revisão
      const createStartTime = Date.now();
      console.log(`➕ [SAVE] Criando nova revisão`);
      
      await createNewReview(supabase, clientId, today, reviewData);
      const createTime = Date.now() - createStartTime;
      
      console.log(`✅ [SAVE] Nova revisão criada (${createTime}ms)`);
    }
    
    const totalProcessTime = Date.now() - processStartTime;
    console.log(`🎉 [PROCESSOR] SUCESSO TOTAL:`, {
      client: clientData.company_name,
      accountId: metaAccount.account_id,
      totalTime: `${totalProcessTime}ms`,
      dailyBudget: `R$ ${metaApiData.daily_budget.toFixed(2)}`,
      totalSpent: `R$ ${metaApiData.total_spent.toFixed(2)}`
    });
    
    return {
      success: true,
      client: clientData,
      meta_account: {
        id: metaAccount.account_id,
        name: metaApiData.account_name || metaAccount.account_name
      },
      review_data: reviewData,
      message: "Revisão processada com sucesso usando dados reais da Meta API (incluindo orçamentos de adsets)"
    };
    
  } catch (error) {
    const totalProcessTime = Date.now() - processStartTime;
    console.error(`❌ [PROCESSOR] ERRO GERAL (${totalProcessTime}ms):`, {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    
    return {
      success: false,
      error: error.message
    };
  }
}
