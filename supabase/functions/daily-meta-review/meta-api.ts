
import { BadRequestResponse, InternalErrorResponse } from "./response.ts";

// Função para buscar dados das contas do Meta Ads
export async function fetchMetaAccountsData(accountId: string, accessToken: string) {
  try {
    console.log(`Buscando dados para a conta Meta ID: ${accountId}`);
    
    if (!accountId || !accessToken) {
      return { 
        success: false, 
        response: BadRequestResponse("ID da conta ou token de acesso não fornecidos") 
      };
    }
    
    const baseUrl = "https://graph.facebook.com/v18.0";
    
    // Buscar informações básicas da conta
    const accountUrl = `${baseUrl}/${accountId}?access_token=${accessToken}&fields=name,account_id,funding_source_details`;
    console.log("Realizando requisição para obter detalhes da conta...");
    
    const accountResponse = await fetch(accountUrl);
    
    if (!accountResponse.ok) {
      const errorText = await accountResponse.text();
      console.error("Erro na resposta da API do Meta:", errorText);
      return { 
        success: false, 
        response: BadRequestResponse(`Erro na API do Meta: ${errorText}`) 
      };
    }
    
    const accountData = await accountResponse.json();
    
    // Buscar campanhas ativas e seus orçamentos
    const campaignsUrl = `${baseUrl}/act_${accountId}/campaigns?access_token=${accessToken}&fields=name,daily_budget,budget_remaining,lifetime_budget,spent_amount,status&effective_status=['ACTIVE']&limit=100`;
    console.log("Buscando campanhas ativas...");
    
    const campaignsResponse = await fetch(campaignsUrl);
    
    if (!campaignsResponse.ok) {
      const errorText = await campaignsResponse.text();
      console.error("Erro ao buscar campanhas:", errorText);
      return { 
        success: false, 
        response: BadRequestResponse(`Erro ao buscar campanhas: ${errorText}`) 
      };
    }
    
    const campaignsData = await campaignsResponse.json();
    
    // Buscar insights para gastos
    const insightsUrl = `${baseUrl}/act_${accountId}/insights?access_token=${accessToken}&fields=spend&time_range[since]=2023-01-01&time_range[until]=${new Date().toISOString().split('T')[0]}&time_increment=1`;
    console.log("Buscando insights de gastos...");
    
    const insightsResponse = await fetch(insightsUrl);
    
    let insights = [];
    if (insightsResponse.ok) {
      const insightsData = await insightsResponse.json();
      insights = insightsData.data || [];
    } else {
      console.warn("Aviso: Não foi possível obter insights detalhados de gastos");
    }
    
    // Calcular orçamento diário total das campanhas ativas
    let totalDailyBudget = 0;
    let totalSpent = 0;
    
    if (campaignsData.data && campaignsData.data.length > 0) {
      campaignsData.data.forEach((campaign: any) => {
        if (campaign.status === 'ACTIVE' && campaign.daily_budget) {
          totalDailyBudget += parseInt(campaign.daily_budget) / 100; // Converter de centavos para reais
        }
        
        if (campaign.spent_amount) {
          totalSpent += parseFloat(campaign.spent_amount);
        }
      });
    }
    
    // Montar objeto com dados consolidados
    const adAccounts = {
      id: accountId,
      name: accountData.name || accountId,
      totalDailyBudget,
      totalSpent,
      campaignsCount: (campaignsData.data || []).length,
      campaigns: campaignsData.data || [],
      insights: insights
    };
    
    return { success: true, adAccounts };
    
  } catch (error) {
    console.error("Erro ao buscar dados do Meta:", error);
    return { 
      success: false, 
      response: InternalErrorResponse(`Erro ao buscar dados do Meta: ${error instanceof Error ? error.message : String(error)}`) 
    };
  }
}
