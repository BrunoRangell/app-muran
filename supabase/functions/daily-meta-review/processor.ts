
import { createSupabaseClient, fetchMetaAccessToken, fetchClientData, fetchPrimaryMetaAccount, fetchActiveCustomBudget, checkExistingReview, updateExistingReview, createNewReview } from "./database.ts";

// Função para buscar dados reais da Meta Graph API
async function fetchMetaApiData(accountId: string, accessToken: string, customBudget: any) {
  console.log(`🔍 Buscando dados reais da Meta Graph API para conta ${accountId}`);
  
  try {
    // 1. Buscar campanhas ativas para calcular orçamento diário total
    const campaignsUrl = `https://graph.facebook.com/v22.0/act_${accountId}/campaigns?fields=daily_budget,status,effective_status&access_token=${accessToken}&limit=1000`;
    console.log(`📞 Chamando API de campanhas: ${campaignsUrl.replace(accessToken, '[TOKEN_HIDDEN]')}`);
    
    const campaignsResponse = await fetch(campaignsUrl);
    
    if (!campaignsResponse.ok) {
      const errorData = await campaignsResponse.json();
      console.error("❌ Erro ao buscar campanhas da Meta API:", errorData);
      return { daily_budget: 0, total_spent: 0 };
    }

    const campaignsData = await campaignsResponse.json();
    const campaigns = campaignsData.data || [];
    console.log(`✅ Encontradas ${campaigns.length} campanhas na conta`);

    // Calcular orçamento diário total das campanhas ativas
    let totalDailyBudget = 0;
    const activeCampaigns = campaigns.filter(campaign => 
      campaign.effective_status === 'ACTIVE' && 
      campaign.daily_budget && 
      parseFloat(campaign.daily_budget) > 0
    );
    
    console.log(`📊 Campanhas ativas encontradas: ${activeCampaigns.length}`);
    
    activeCampaigns.forEach(campaign => {
      const budget = parseFloat(campaign.daily_budget) / 100; // Meta retorna em centavos
      totalDailyBudget += budget;
      console.log(`💰 Campanha ${campaign.id}: Orçamento diário R$ ${budget.toFixed(2)}`);
    });

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
      return { daily_budget: totalDailyBudget, total_spent: 0 };
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

    return {
      daily_budget: totalDailyBudget,
      total_spent: totalSpent
    };

  } catch (error) {
    console.error("❌ Erro inesperado ao buscar dados da Meta API:", error);
    return { daily_budget: 0, total_spent: 0 };
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
    
    // 5. BUSCAR DADOS REAIS DA META API (substituindo dados simulados)
    console.log(`🚀 Buscando dados reais da Meta Graph API...`);
    const metaApiData = await fetchMetaApiData(metaAccount.account_id, metaToken, customBudget);
    
    console.log(`✅ Dados reais da Meta API obtidos:`, {
      daily_budget: metaApiData.daily_budget,
      total_spent: metaApiData.total_spent,
      account_id: metaAccount.account_id,
      account_name: metaAccount.account_name
    });
    
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
      console.log(`✅ Revisão atualizada para cliente ${clientData.company_name} com dados reais da API`);
    } else {
      // Criar nova revisão
      await createNewReview(supabase, clientId, today, reviewData);
      console.log(`✅ Nova revisão criada para cliente ${clientData.company_name} com dados reais da API`);
    }
    
    return {
      success: true,
      client: clientData,
      meta_account: {
        id: metaAccount.account_id,
        name: metaAccount.account_name
      },
      review_data: reviewData,
      message: "Revisão processada com sucesso usando dados reais da Meta API"
    };
    
  } catch (error) {
    console.error("❌ Erro no processamento da revisão:", error);
    return {
      success: false,
      error: error.message
    };
  }
}
