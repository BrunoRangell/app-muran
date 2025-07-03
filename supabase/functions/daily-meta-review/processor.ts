import { createSupabaseClient, fetchMetaAccessToken, fetchClientData, fetchPrimaryMetaAccount, fetchActiveCustomBudget, checkExistingReview, updateExistingReview, createNewReview } from "./database.ts";

// Função para buscar conjuntos de anúncios de uma campanha
async function fetchAdSets(campaignId: string, accessToken: string) {
  try {
    const adsetsUrl = `https://graph.facebook.com/v22.0/${campaignId}/adsets?fields=id,name,daily_budget,status,effective_status,end_time&access_token=${accessToken}&limit=1000`;
    console.log(`📞 Buscando adsets da campanha ${campaignId}`);
    
    const response = await fetch(adsetsUrl);
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error(`❌ Erro ao buscar adsets da campanha ${campaignId}:`, errorData);
      return [];
    }

    const data = await response.json();
    const adsets = data.data || [];
    console.log(`✅ Encontrados ${adsets.length} adsets na campanha ${campaignId}`);
    
    return adsets;
  } catch (error) {
    console.error(`❌ Erro inesperado ao buscar adsets da campanha ${campaignId}:`, error);
    return [];
  }
}

// Função para filtrar adsets ativos
function filterActiveAdsets(adsets: any[], now: Date) {
  return adsets.filter(adset => {
    // Verificar status
    if (adset.status !== "ACTIVE") {
      console.log(`Adset ${adset.id} (${adset.name}) não está ativo. Status: ${adset.status}`);
      return false;
    }
    
    // Verificar effective_status
    if (adset.effective_status !== "ACTIVE") {
      console.log(`Adset ${adset.id} (${adset.name}) tem effective_status não ativo: ${adset.effective_status}`);
      return false;
    }
    
    // Verificar data de término
    if (adset.end_time) {
      const endTime = new Date(adset.end_time);
      const isFuture = endTime > now;
      if (!isFuture) {
        console.log(`Adset ${adset.id} (${adset.name}) já terminou em ${endTime.toLocaleDateString('pt-BR')}`);
        return false;
      }
    }
    
    return true;
  });
}

// Função para buscar dados reais da Meta Graph API
async function fetchMetaApiData(accountId: string, accessToken: string, customBudget: any) {
  console.log(`🔍 Buscando dados reais da Meta Graph API para conta ${accountId}`);
  
  try {
    // 1. Buscar campanhas ativas para calcular orçamento diário total
    const campaignsUrl = `https://graph.facebook.com/v22.0/act_${accountId}/campaigns?fields=daily_budget,lifetime_budget,status,effective_status,end_time,name&access_token=${accessToken}&limit=1000`;
    console.log(`📞 Chamando API de campanhas: ${campaignsUrl.replace(accessToken, '[TOKEN_HIDDEN]')}`);
    
    const campaignsResponse = await fetch(campaignsUrl);
    
    if (!campaignsResponse.ok) {
      const errorData = await campaignsResponse.json();
      console.error("❌ Erro ao buscar campanhas da Meta API:", errorData);
      return { daily_budget: 0, total_spent: 0, account_name: null };
    }

    const campaignsData = await campaignsResponse.json();
    const campaigns = campaignsData.data || [];
    console.log(`✅ Encontradas ${campaigns.length} campanhas na conta`);

    // Calcular orçamento diário total das campanhas ativas
    let totalDailyBudget = 0;
    const now = new Date();
    
    // Processar cada campanha
    for (const campaign of campaigns) {
      console.log(`\n🔍 Avaliando campanha: ID=${campaign.id}, Nome="${campaign.name}", Status=${campaign.status}, EffectiveStatus=${campaign.effective_status}`);
      
      // Verificar se a campanha está ativa
      if (campaign.status !== "ACTIVE") {
        console.log(`Campanha ${campaign.id} (${campaign.name}) não está ativa. Status: ${campaign.status}`);
        continue;
      }

      // Verificar effective_status também
      if (campaign.effective_status !== "ACTIVE") {
        console.log(`Campanha ${campaign.id} (${campaign.name}) tem effective_status não ativo: ${campaign.effective_status}`);
        continue;
      }

      // Verificar data de término
      if (campaign.end_time) {
        const endTime = new Date(campaign.end_time);
        const isFuture = endTime > now;
        if (!isFuture) {
          console.log(`Campanha ${campaign.id} (${campaign.name}) já terminou em ${endTime.toLocaleDateString('pt-BR')}`);
          continue;
        }
      }

      // Se a campanha tem orçamento diário, usar ele
      if (campaign.daily_budget && parseInt(campaign.daily_budget) > 0) {
        const campaignBudget = parseInt(campaign.daily_budget) / 100; // Converte de centavos para reais
        totalDailyBudget += campaignBudget;
        console.log(`💰 Adicionando orçamento da campanha ${campaign.id} (${campaign.name}): R$ ${campaignBudget.toFixed(2)}`);
      } 
      // Se não tem orçamento diário ou é zero, buscar adsets
      else {
        console.log(`🔍 Campanha ${campaign.id} (${campaign.name}) sem orçamento diário definido. Buscando adsets...`);
        
        // Buscar adsets da campanha
        const adsets = await fetchAdSets(campaign.id, accessToken);
        const activeAdsets = filterActiveAdsets(adsets, now);
        
        console.log(`📊 Campanha ${campaign.id} (${campaign.name}) tem ${activeAdsets.length} adsets ativos de ${adsets.length} totais`);
        
        // Somar orçamentos dos adsets ativos
        let adsetBudgetSum = 0;
        for (const adset of activeAdsets) {
          if (adset.daily_budget && parseInt(adset.daily_budget) > 0) {
            const adsetBudget = parseInt(adset.daily_budget) / 100; // Converte de centavos para reais
            adsetBudgetSum += adsetBudget;
            console.log(`💰 Adicionando orçamento do adset ${adset.id} (${adset.name}): R$ ${adsetBudget.toFixed(2)}`);
          }
        }
        
        if (adsetBudgetSum > 0) {
          totalDailyBudget += adsetBudgetSum;
          console.log(`💰 Total de orçamento dos adsets da campanha ${campaign.id} (${campaign.name}): R$ ${adsetBudgetSum.toFixed(2)}`);
        } else {
          console.log(`⚠️ Campanha ${campaign.id} (${campaign.name}) não tem orçamento nem nos adsets`);
        }
      }
    }

    console.log(`💰 Orçamento diário total calculado: R$ ${totalDailyBudget.toFixed(2)}`);

    // 2. Buscar insights de gasto para o período atual
    const today = new Date();
    const startDate = customBudget 
      ? customBudget.start_date 
      : `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`; // Início do mês atual
    const endDate = customBudget 
      ? customBudget.end_date 
      : today.toISOString().split('T')[0]; // Hoje

    console.log(`📅 Buscando gastos do período: ${startDate} até ${endDate}`);

    const insightsUrl = `https://graph.facebook.com/v22.0/act_${accountId}/insights?fields=spend&time_range={"since":"${startDate}","until":"${endDate}"}&access_token=${accessToken}`;
    console.log(`📞 Chamando API de insights: ${insightsUrl.replace(accessToken, '[TOKEN_HIDDEN]')}`);
    
    const insightsResponse = await fetch(insightsUrl);
    
    if (!insightsResponse.ok) {
      const insightsError = await insightsResponse.json();
      console.error("❌ Erro ao buscar insights da Meta API:", insightsError);
      return { daily_budget: totalDailyBudget, total_spent: 0, account_name: null };
    }

    const insightsData = await insightsResponse.json();
    console.log(`✅ Resposta de insights recebida:`, JSON.stringify(insightsData));

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

    console.log(`💸 Gasto total calculado: R$ ${totalSpent.toFixed(2)}`);

    // 3. Buscar informações detalhadas da conta Meta (nome da conta)
    console.log(`🔍 Buscando informações da conta Meta ${accountId}...`);
    const accountUrl = `https://graph.facebook.com/v22.0/act_${accountId}?fields=name,account_id&access_token=${accessToken}`;
    console.log(`📞 Chamando API de informações da conta: ${accountUrl.replace(accessToken, '[TOKEN_HIDDEN]')}`);
    
    let accountName = null;
    try {
      const accountResponse = await fetch(accountUrl);
      if (accountResponse.ok) {
        const accountData = await accountResponse.json();
        accountName = accountData.name;
        console.log(`✅ Nome da conta obtido: ${accountName}`);
      } else {
        console.log(`⚠️ Não foi possível obter o nome da conta da API`);
      }
    } catch (error) {
      console.log(`⚠️ Erro ao buscar nome da conta: ${error.message}`);
    }

    return {
      daily_budget: totalDailyBudget,
      total_spent: totalSpent,
      account_name: accountName
    };

  } catch (error) {
    console.error("❌ Erro inesperado ao buscar dados da Meta API:", error);
    return { daily_budget: 0, total_spent: 0, account_name: null };
  }
}

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
    
    // 5. BUSCAR DADOS REAIS DA META API (com lógica corrigida para adsets)
    console.log(`🚀 Buscando dados reais da Meta Graph API com lógica de adsets...`);
    const metaApiData = await fetchMetaApiData(metaAccount.account_id, metaToken, customBudget);
    
    console.log(`✅ Dados reais da Meta API obtidos:`, {
      daily_budget: metaApiData.daily_budget,
      total_spent: metaApiData.total_spent,
      account_id: metaAccount.account_id,
      account_name: metaApiData.account_name
    });
    
    // 6. Atualizar nome da conta na tabela client_accounts APENAS se obtivemos um nome válido da API
    if (metaApiData.account_name && metaApiData.account_name !== metaAccount.account_name) {
      console.log(`🔄 Atualizando nome da conta de "${metaAccount.account_name}" para "${metaApiData.account_name}"`);
      
      const { error: updateError } = await supabase
        .from("client_accounts")
        .update({ 
          account_name: metaApiData.account_name,
          updated_at: new Date().toISOString()
        })
        .eq("id", metaAccount.id);
      
      if (updateError) {
        console.error(`❌ Erro ao atualizar nome da conta: ${updateError.message}`);
      } else {
        console.log(`✅ Nome da conta atualizado com sucesso na tabela client_accounts`);
      }
    } else if (!metaApiData.account_name) {
      console.log(`ℹ️ Nome da conta não obtido da API - mantendo nome existente: "${metaAccount.account_name}"`);
    }
    
    // 7. Preparar dados da revisão
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
    
    // 8. Verificar se já existe revisão para hoje
    const existingReview = await checkExistingReview(supabase, clientId, metaAccount.id, today);
    
    if (existingReview) {
      // Atualizar revisão existente
      await updateExistingReview(supabase, existingReview.id, reviewData);
      console.log(`✅ Revisão atualizada para cliente ${clientData.company_name} com dados reais da API (incluindo adsets)`);
    } else {
      // Criar nova revisão
      await createNewReview(supabase, clientId, today, reviewData);
      console.log(`✅ Nova revisão criada para cliente ${clientData.company_name} com dados reais da API (incluindo adsets)`);
    }
    
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
    console.error("❌ Erro no processamento da revisão:", error);
    return {
      success: false,
      error: error.message
    };
  }
}
