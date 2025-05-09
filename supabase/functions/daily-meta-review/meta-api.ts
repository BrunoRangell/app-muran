
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
    
    // Verificar formato do ID da conta - pode ser com ou sem prefixo 'act_'
    const formattedAccountId = accountId.startsWith('act_') ? accountId : `act_${accountId}`;
    
    const baseUrl = "https://graph.facebook.com/v18.0";
    
    // Buscar informações básicas da conta
    const accountUrl = `${baseUrl}/${accountId}?access_token=${accessToken}&fields=name,account_id,funding_source_details`;
    console.log("Realizando requisição para obter detalhes da conta...");
    
    let accountResponse;
    try {
      accountResponse = await fetch(accountUrl, { 
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });
    } catch (fetchError) {
      console.error("Erro de rede ao buscar conta Meta:", fetchError);
      return { 
        success: false, 
        response: InternalErrorResponse(`Erro de conectividade na API do Meta: ${fetchError.message}`) 
      };
    }
    
    if (!accountResponse.ok) {
      const errorText = await accountResponse.text();
      console.error("Erro na resposta da API do Meta:", errorText);
      
      // Verificar tipo de erro para fornecer feedback mais específico
      if (errorText.includes("Object with ID") && errorText.includes("does not exist")) {
        return { 
          success: false, 
          response: BadRequestResponse(`Conta Meta ID ${accountId} não encontrada ou não existe: ${errorText}`) 
        };
      }
      
      if (errorText.includes("permissions")) {
        return { 
          success: false, 
          response: BadRequestResponse(`Sem permissão para acessar a conta Meta ID ${accountId}: ${errorText}`) 
        };
      }
      
      return { 
        success: false, 
        response: BadRequestResponse(`Erro na API do Meta: ${errorText}`) 
      };
    }
    
    const accountData = await accountResponse.json();
    
    // Buscar campanhas ativas e seus orçamentos
    const campaignsUrl = `${baseUrl}/${formattedAccountId}/campaigns?access_token=${accessToken}&fields=name,daily_budget,budget_remaining,lifetime_budget,spent_amount,status&effective_status=['ACTIVE']&limit=100`;
    console.log("Buscando campanhas ativas...");
    
    let campaignsResponse;
    try {
      campaignsResponse = await fetch(campaignsUrl);
    } catch (fetchError) {
      console.error("Erro de rede ao buscar campanhas:", fetchError);
      return { 
        success: false, 
        response: InternalErrorResponse(`Erro de conectividade ao buscar campanhas: ${fetchError.message}`) 
      };
    }
    
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
    const today = new Date().toISOString().split('T')[0];
    const startDate = new Date();
    startDate.setDate(1); // Primeiro dia do mês atual
    const insightsUrl = `${baseUrl}/${formattedAccountId}/insights?access_token=${accessToken}&fields=spend&time_range[since]=${startDate.toISOString().split('T')[0]}&time_range[until]=${today}&time_increment=1`;
    console.log("Buscando insights de gastos...");
    
    let insights = [];
    try {
      const insightsResponse = await fetch(insightsUrl);
      
      if (insightsResponse.ok) {
        const insightsData = await insightsResponse.json();
        insights = insightsData.data || [];
      } else {
        console.warn("Aviso: Não foi possível obter insights detalhados de gastos");
      }
    } catch (insightsError) {
      // Apenas log, não falhar toda a operação se insights falhar
      console.warn("Erro ao buscar insights, continuando sem dados de insights:", insightsError);
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
