
import { createSupabaseClient, fetchClientData, fetchMetaAccountDetails, fetchPrimaryMetaAccount, fetchActiveCustomBudget, checkExistingReview, updateExistingReview, createNewReview, updateClientCurrentReview, fetchMetaAccessToken } from "./database.ts";

// Função para buscar dados da API Meta com lógica corrigida
async function fetchMetaApiData(accountId: string, accessToken: string) {
  const today = new Date().toISOString().split("T")[0];
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  
  try {
    console.log(`📅 Buscando dados do período: ${yesterday} a ${today}`);
    
    // Buscar gasto total
    const insightsUrl = `https://graph.facebook.com/v20.0/act_${accountId}/insights?access_token=${accessToken}&time_range={"since":"${yesterday}","until":"${today}"}&fields=spend&level=account`;
    console.log(`🌐 Fazendo requisição para API Meta (insights): ${insightsUrl.replace(accessToken, 'ACCESS_TOKEN')}`);
    
    const insightsResponse = await fetch(insightsUrl);
    const insightsData = await insightsResponse.json();
    console.log("📊 Resposta da API Meta (insights):", insightsData);
    
    const totalSpent = insightsData.data?.[0]?.spend ? parseFloat(insightsData.data[0].spend) : 0;
    
    // Calcular orçamento diário total usando a lógica correta
    console.log(`💰 Calculando orçamento diário total para conta ${accountId}...`);
    const totalDailyBudget = await calculateTotalBudgetMeta(accountId, accessToken);
    
    console.log(`💰 Orçamento diário total real calculado: ${totalDailyBudget / 100}`);
    
    return {
      totalSpent,
      currentDailyBudget: totalDailyBudget / 100, // Converter de centavos para reais no final
      dataSource: "api",
      accountId
    };
  } catch (error) {
    console.error("❌ Erro ao buscar dados da API Meta:", error);
    throw error;
  }
}

// Função para buscar todas as campanhas com paginação
async function fetchAllCampaigns(accountId: string, accessToken: string) {
  let campaigns = [];
  let url = `https://graph.facebook.com/v20.0/act_${accountId}/campaigns?fields=daily_budget,status,name,end_time,id&access_token=${accessToken}&limit=1000`;
  
  console.log(`🔍 NOVA VERSÃO - Iniciando busca de campanhas com paginação...`);
  console.log(`🔍 URL CORRIGIDA: ${url.replace(accessToken, 'ACCESS_TOKEN')}`);
  
  while (url) {
    console.log(`📄 Buscando página de campanhas...`);
    const response = await fetch(url);
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error("❌ Erro ao buscar campanhas:", errorData);
      throw new Error(`Erro na API do Meta: ${JSON.stringify(errorData)}`);
    }
    
    const data = await response.json();
    campaigns = campaigns.concat(data.data || []);
    url = data.paging?.next || null;
    
    console.log(`📊 Página processada: ${data.data?.length || 0} campanhas. Total até agora: ${campaigns.length}`);
  }
  
  console.log(`✅ Busca completa: ${campaigns.length} campanhas encontradas`);
  return campaigns;
}

// Função para buscar todos os adsets de uma campanha com paginação
async function fetchAllAdSets(campaignId: string, accessToken: string) {
  let adsets = [];
  let url = `https://graph.facebook.com/v20.0/${campaignId}/adsets?fields=daily_budget,status,name,end_time,id&access_token=${accessToken}&limit=1000`;
  
  while (url) {
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error(`❌ Erro ao buscar adsets para campanha ${campaignId}:`, await response.json());
      break;
    }
    
    const data = await response.json();
    adsets = adsets.concat(data.data || []);
    url = data.paging?.next || null;
  }
  
  return adsets;
}

// Função para verificar se um item (campanha ou adset) está ativo e não expirou
function isActiveAndNotExpired(item: any, now: Date) {
  // Deve estar com status ACTIVE
  if (item.status !== 'ACTIVE') {
    return false;
  }
  
  // Se tem end_time, verificar se não expirou
  if (item.end_time) {
    const endTime = new Date(item.end_time);
    if (endTime <= now) {
      return false;
    }
  }
  
  return true;
}

// Função principal para calcular o orçamento total seguindo a lógica correta
async function calculateTotalBudgetMeta(accountId: string, accessToken: string) {
  const campaigns = await fetchAllCampaigns(accountId, accessToken);
  const now = new Date();
  
  console.log(`🔍 Processando ${campaigns.length} campanhas para cálculo de orçamento...`);
  
  const budgetPromises = campaigns.map(async (campaign) => {
    console.log(`\n📋 Processando campanha: ${campaign.name} (${campaign.id})`);
    console.log(`   Status: ${campaign.status}, End Time: ${campaign.end_time || 'Sem data de fim'}`);
    
    // Só processar campanhas ATIVAS
    if (!isActiveAndNotExpired(campaign, now)) {
      console.log(`   ⏭️  Ignorando campanha (inativa ou expirada)`);
      return 0;
    }
    
    // Buscar todos os adsets da campanha
    const adsets = await fetchAllAdSets(campaign.id, accessToken);
    console.log(`   📱 Encontrados ${adsets.length} adsets na campanha`);
    
    let totalBudget = 0;
    let hasActiveAdSet = false;
    
    // Verificar se há pelo menos um adset ativo
    for (const adset of adsets) {
      if (isActiveAndNotExpired(adset, now)) {
        hasActiveAdSet = true;
        const adsetBudget = parseFloat(adset.daily_budget || 0);
        totalBudget += adsetBudget;
        console.log(`   💵 AdSet ativo: ${adset.name} - Orçamento: ${adsetBudget / 100} reais`);
      } else {
        console.log(`   ⏭️  AdSet ignorado: ${adset.name} (inativo ou expirado)`);
      }
    }
    
    // Aplicar lógica correta: só incluir orçamento da campanha se há adsets ativos
    if (hasActiveAdSet) {
      const campaignBudget = parseFloat(campaign.daily_budget || 0);
      totalBudget += campaignBudget;
      console.log(`   💰 Orçamento da campanha: ${campaignBudget / 100} reais`);
      console.log(`   ✅ Total da campanha: ${totalBudget / 100} reais`);
    } else {
      console.log(`   ❌ Nenhum adset ativo - orçamento da campanha = 0`);
      totalBudget = 0;
    }
    
    return totalBudget;
  });
  
  const budgets = await Promise.all(budgetPromises);
  const finalTotal = budgets.reduce((total, budget) => total + budget, 0);
  
  console.log(`\n🎯 RESULTADO FINAL: ${finalTotal / 100} reais (${finalTotal} centavos)`);
  return finalTotal;
}

// Função principal de processamento
export async function processReviewRequest(req: Request) {
  try {
    const supabase = createSupabaseClient();
    
    // Parse do corpo da requisição
    const body = await req.json();
    console.log("📥 Requisição recebida:", { ...body, accessToken: body.accessToken ? "***REDACTED***" : undefined });
    console.log("🚀 VERSÃO CORRIGIDA DA FUNÇÃO - Deploy realizado com sucesso!");
    
    const { clientId, metaAccountId, reviewDate = new Date().toISOString().split("T")[0], fetchRealData = false } = body;
    
    if (!clientId) {
      throw new Error("clientId é obrigatório");
    }
    
    console.log(`🚀 Iniciando revisão META para cliente ${clientId}`, {
      metaAccountId,
      reviewDate,
      fetchRealData
    });
    
    // Buscar dados do cliente
    const client = await fetchClientData(supabase, clientId);
    
    // Buscar token Meta automaticamente da tabela api_tokens
    const accessToken = await fetchMetaAccessToken(supabase);
    const hasMetaToken = !!accessToken;
    
    if (!hasMetaToken) {
      console.log("⚠️ Token Meta não encontrado na base de dados - valores serão zerados");
    } else {
      console.log("✅ Token Meta encontrado e configurado corretamente");
    }
    
    // Buscar detalhes da conta Meta
    let metaAccount;
    if (metaAccountId) {
      metaAccount = await fetchMetaAccountDetails(supabase, clientId, metaAccountId);
    } else {
      metaAccount = await fetchPrimaryMetaAccount(supabase, clientId);
    }
    
    const accountId = metaAccount?.account_id || metaAccountId;
    const accountName = metaAccount?.account_name || "Conta Principal";
    
    // Buscar orçamento personalizado ativo
    const customBudget = await fetchActiveCustomBudget(supabase, clientId, reviewDate);
    
    let budgetAmount = metaAccount?.budget_amount;
    let usingCustomBudget = false;
    let customBudgetId = null;
    let customBudgetAmount = null;
    let customBudgetStartDate = null;
    let customBudgetEndDate = null;
    
    if (customBudget) {
      budgetAmount = customBudget.budget_amount;
      usingCustomBudget = true;
      customBudgetId = customBudget.id;
      customBudgetAmount = customBudget.budget_amount;
      customBudgetStartDate = customBudget.start_date;
      customBudgetEndDate = customBudget.end_date;
    }
    
    console.log("💰 Configuração de orçamento:", {
      usingCustomBudget,
      budgetAmount,
      accountName,
      accountId,
      hasMetaToken,
      fetchRealData,
      customBudgetStartDate,
      customBudgetEndDate
    });
    
    // Inicializar valores como zero
    let totalSpent = 0;
    let currentDailyBudget = 0;
    let dataSource = "no_data";
    
    // Tentar buscar dados reais da API Meta APENAS se tiver token e fetchRealData for true
    if (hasMetaToken && fetchRealData && accountId) {
      console.log("🔄 Tentando buscar dados reais da API Meta...");
      
      try {
        console.log("🔑 Token Meta encontrado, fazendo chamada para API...");
        console.log(`🔍 Buscando dados reais da API Meta para conta ${accountId}...`);
        
        const apiData = await fetchMetaApiData(accountId, accessToken);
        
        console.log("✅ Dados extraídos da API Meta:", {
          totalSpent: apiData.totalSpent,
          dailyBudget: apiData.currentDailyBudget,
          source: "API real - campanhas e adsets ativos",
          period: `${new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split("T")[0]} a ${new Date().toISOString().split("T")[0]}`
        });
        
        totalSpent = apiData.totalSpent;
        currentDailyBudget = apiData.currentDailyBudget;
        dataSource = "api";
        
        console.log("✅ Dados obtidos da API Meta com sucesso!", {
          totalSpent,
          currentDailyBudget,
          dataSource: "API real",
          accountId
        });
      } catch (apiError) {
        console.error("❌ Erro ao buscar dados da API Meta - mantendo valores zerados:", apiError);
        // Manter valores zerados em caso de erro
        totalSpent = 0;
        currentDailyBudget = 0;
        dataSource = "api_error";
      }
    } else {
      // Sem token ou fetchRealData false - manter valores zerados
      const reason = !hasMetaToken ? "sem token na base de dados" : !fetchRealData ? "fetchRealData=false" : "sem accountId";
      console.log(`⚠️ Não buscando dados da API Meta (${reason}) - usando valores zerados`);
      dataSource = "no_token";
    }
    
    console.log("📊 Valores finais para revisão:", {
      totalSpent,
      currentDailyBudget,
      budgetAmount,
      dataSource,
      accountId,
      accountName
    });
    
    // Preparar dados para salvar
    const reviewData = {
      meta_daily_budget_current: currentDailyBudget,
      meta_total_spent: totalSpent,
      meta_account_id: accountId,
      meta_account_name: accountName,
      using_custom_budget: usingCustomBudget,
      custom_budget_id: customBudgetId,
      custom_budget_amount: customBudgetAmount,
      custom_budget_start_date: customBudgetStartDate,
      custom_budget_end_date: customBudgetEndDate
    };
    
    console.log("💾 Dados para salvar na revisão:", {
      ...reviewData,
      dataSource,
      hasMetaToken,
      fetchRealData
    });
    
    // Verificar se já existe uma revisão para hoje
    const existingReview = await checkExistingReview(supabase, clientId, accountId, reviewDate);
    
    let reviewId;
    if (existingReview) {
      console.log("🔄 Atualizando revisão existente:", existingReview.id);
      await updateExistingReview(supabase, existingReview.id, reviewData);
      reviewId = existingReview.id;
      console.log("✅ Revisão existente atualizada:", reviewId);
    } else {
      console.log("➕ Criando nova revisão");
      reviewId = await createNewReview(supabase, clientId, reviewDate, reviewData);
      console.log("✅ Nova revisão criada:", reviewId);
    }
    
    // Atualizar tabela de revisões atuais
    await updateClientCurrentReview(supabase, clientId, reviewDate, reviewData);
    
    // Resposta de sucesso
    const result = {
      success: true,
      reviewId,
      clientId,
      accountId,
      accountName,
      totalSpent,
      currentDailyBudget,
      budgetAmount,
      usingCustomBudget,
      dataSource
    };
    
    console.log("🎉 Revisão concluída com sucesso:", result);
    
    return result;
  } catch (error) {
    console.error("❌ Erro no processamento da revisão:", error);
    return {
      success: false,
      error: error.message || "Erro desconhecido"
    };
  }
}
