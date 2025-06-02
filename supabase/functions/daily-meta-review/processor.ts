
import { createSupabaseClient, fetchClientData, fetchMetaAccountDetails, fetchPrimaryMetaAccount, fetchActiveCustomBudget, checkExistingReview, updateExistingReview, createNewReview, updateClientCurrentReview } from "./database.ts";

// Função para buscar dados da API Meta
async function fetchMetaApiData(accountId: string, accessToken: string) {
  const today = new Date().toISOString().split("T")[0];
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  
  try {
    console.log(`📅 Buscando dados do período: ${yesterday} a ${today}`);
    
    // Buscar gasto total
    const insightsUrl = `https://graph.facebook.com/v18.0/act_${accountId}/insights?access_token=${accessToken}&time_range={"since":"${yesterday}","until":"${today}"}&fields=spend&level=account`;
    console.log(`🌐 Fazendo requisição para API Meta (insights): ${insightsUrl.replace(accessToken, 'ACCESS_TOKEN')}`);
    
    const insightsResponse = await fetch(insightsUrl);
    const insightsData = await insightsResponse.json();
    console.log("📊 Resposta da API Meta (insights):", insightsData);
    
    const totalSpent = insightsData.data?.[0]?.spend ? parseFloat(insightsData.data[0].spend) : 0;
    
    // Buscar orçamento diário das campanhas ativas
    console.log(`💰 Calculando orçamento diário total para conta ${accountId}...`);
    
    const campaignsUrl = `https://graph.facebook.com/v18.0/act_${accountId}/campaigns?access_token=${accessToken}&fields=status,daily_budget,id,name,effective_status`;
    console.log(`🔍 Buscando campanhas: ${campaignsUrl.replace(accessToken, 'ACCESS_TOKEN')}`);
    
    const campaignsResponse = await fetch(campaignsUrl);
    const campaignsData = await campaignsResponse.json();
    
    console.log(`📊 Campanhas encontradas: ${campaignsData.data?.length || 0}`);
    
    let totalDailyBudget = 0;
    let activeCampaigns = 0;
    
    if (campaignsData.data) {
      for (const campaign of campaignsData.data) {
        if (campaign.effective_status === "ACTIVE") {
          activeCampaigns++;
          console.log(`🔍 Processando campanha: ${campaign.name} (${campaign.id})`);
          
          if (campaign.daily_budget) {
            const dailyBudget = parseFloat(campaign.daily_budget) / 100; // Meta retorna em centavos
            totalDailyBudget += dailyBudget;
            console.log(`💵 Orçamento da campanha ${campaign.name}: ${dailyBudget}`);
          } else {
            // Se a campanha não tem orçamento diário, buscar dos adsets
            const adsetsUrl = `https://graph.facebook.com/v18.0/${campaign.id}/adsets?access_token=${accessToken}&fields=daily_budget,effective_status,name`;
            const adsetsResponse = await fetch(adsetsUrl);
            const adsetsData = await adsetsResponse.json();
            
            let activeAdsets = 0;
            if (adsetsData.data) {
              for (const adset of adsetsData.data) {
                if (adset.effective_status === "ACTIVE" && adset.daily_budget) {
                  activeAdsets++;
                  const adsetBudget = parseFloat(adset.daily_budget) / 100;
                  totalDailyBudget += adsetBudget;
                  console.log(`💵 Orçamento do adset ${adset.name}: ${adsetBudget}`);
                }
              }
            }
            console.log(`📱 Adsets ativos na campanha ${campaign.name}: ${activeAdsets}`);
          }
        }
      }
    }
    
    console.log(`✅ Campanhas ativas: ${activeCampaigns}`);
    console.log(`💰 Orçamento diário total real calculado: ${totalDailyBudget}`);
    
    return {
      totalSpent,
      currentDailyBudget: totalDailyBudget,
      dataSource: "api",
      accountId
    };
  } catch (error) {
    console.error("❌ Erro ao buscar dados da API Meta:", error);
    throw error;
  }
}

// Função principal de processamento
export async function processReviewRequest(req: Request) {
  try {
    const supabase = createSupabaseClient();
    
    // Parse do corpo da requisição
    const body = await req.json();
    console.log("📥 Requisição recebida:", { ...body, accessToken: body.accessToken ? "***REDACTED***" : undefined });
    
    const { clientId, metaAccountId, reviewDate = new Date().toISOString().split("T")[0], fetchRealData = false, accessToken } = body;
    
    if (!clientId) {
      throw new Error("clientId é obrigatório");
    }
    
    console.log(`🚀 Iniciando revisão META para cliente ${clientId}`, {
      metaAccountId,
      reviewDate,
      fetchRealData,
      hasAccessToken: !!accessToken
    });
    
    // Buscar dados do cliente
    const client = await fetchClientData(supabase, clientId);
    
    // Verificar se tem token Meta configurado
    const hasMetaToken = !!accessToken;
    if (!hasMetaToken) {
      console.log("⚠️ Token Meta não encontrado - valores serão zerados");
    } else {
      console.log("✅ Token Meta configurado corretamente");
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
      const reason = !hasMetaToken ? "sem token" : !fetchRealData ? "fetchRealData=false" : "sem accountId";
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
