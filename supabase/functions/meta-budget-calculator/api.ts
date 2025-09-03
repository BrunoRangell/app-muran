
import { corsHeaders } from "./cors.ts";

// Função para buscar todas as campanhas
export async function fetchCampaigns(accountId: string, accessToken: string) {
  console.log(`Calculando orçamento diário para a conta ${accountId}`);
  
  // Buscar todas as campanhas, sem filtrar por status inicialmente
  const campaignsUrl = `https://graph.facebook.com/v22.0/act_${accountId}/campaigns?fields=daily_budget,status,name,end_time,id,effective_status,budget_remaining,lifetime_budget,special_ad_categories&access_token=${accessToken}&limit=1000`;
  const campaignsResponse = await fetch(campaignsUrl);
  
  if (!campaignsResponse.ok) {
    const errorData = await campaignsResponse.json();
    console.error("Erro ao buscar campanhas:", errorData);
    return {
      success: false,
      response: new Response(
        JSON.stringify({ error: `Erro na API do Meta: ${JSON.stringify(errorData)}` }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      )
    };
  }

  // Processar a resposta da API
  let campaigns = [];
  let campaignsData = await campaignsResponse.json();
  campaigns = [...campaignsData.data || []];
  
  // Implementar paginação para garantir que todas as campanhas sejam buscadas
  let nextPageUrl = campaignsData.paging?.next;
  while (nextPageUrl) {
    console.log(`Buscando próxima página de campanhas: ${nextPageUrl}`);
    const nextPageResponse = await fetch(nextPageUrl);
    if (!nextPageResponse.ok) {
      console.error("Erro ao buscar próxima página de campanhas:", await nextPageResponse.json());
      break;
    }
    const nextPageData = await nextPageResponse.json();
    campaigns = [...campaigns, ...(nextPageData.data || [])];
    nextPageUrl = nextPageData.paging?.next;
  }
  
  console.log(`Encontradas ${campaigns.length} campanhas totais na conta`);

  return {
    success: true,
    data: campaigns
  };
}

// Função para buscar insights de gastos
export async function fetchCampaignInsights(
  accountId: string, 
  accessToken: string, 
  dateRange: { start: string; end: string },
  fetchSeparateInsights?: boolean
) {
  console.log("Buscando insights de gastos para o período...");
  
  // Construir a URL para buscar insights
  const insightsUrl = `https://graph.facebook.com/v22.0/act_${accountId}/insights?fields=spend&time_range={"since":"${dateRange.start}","until":"${dateRange.end}"}&access_token=${accessToken}`;
  
  console.log("URL de insights:", insightsUrl);
  
  const insightsResponse = await fetch(insightsUrl);
  if (!insightsResponse.ok) {
    const insightsError = await insightsResponse.json();
    console.error("Erro ao buscar insights:", insightsError);
    return {
      success: false,
      response: new Response(
        JSON.stringify({ error: `Erro ao buscar insights: ${JSON.stringify(insightsError)}` }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      )
    };
  }
  
  const insightsData = await insightsResponse.json();
  console.log("Resposta de insights:", JSON.stringify(insightsData));
  
  // Calcular o total gasto com base nos insights
  let totalSpent = 0;
  if (insightsData.data && insightsData.data.length > 0) {
    for (const insight of insightsData.data) {
      if (insight.spend) {
        const spendValue = parseFloat(insight.spend);
        if (!isNaN(spendValue)) {
          totalSpent += spendValue;
        }
      }
    }
  }
  
  console.log(`Total gasto (baseado em insights): ${totalSpent}`);
  
  // Se não houver insights ou o totalSpent for 0, buscar insights por campanha
  if (totalSpent === 0 && fetchSeparateInsights) {
    console.log("Total gasto é zero, buscando insights por campanha...");
    
    // Buscar insights para cada campanha ativa
    let allCampaignInsights = [];
    
    // Construir URL para buscar insights de campanhas
    const campaignInsightsUrl = `https://graph.facebook.com/v22.0/act_${accountId}/insights?fields=campaign_id,campaign_name,spend&time_range={"since":"${dateRange.start}","until":"${dateRange.end}"}&level=campaign&access_token=${accessToken}&limit=500`;
    
    console.log("URL de insights de campanhas:", campaignInsightsUrl);
    
    const campaignInsightsResponse = await fetch(campaignInsightsUrl);
    if (!campaignInsightsResponse.ok) {
      console.error("Erro ao buscar insights de campanhas:", await campaignInsightsResponse.json());
    } else {
      const campaignInsightsData = await campaignInsightsResponse.json();
      
      if (campaignInsightsData.data && campaignInsightsData.data.length > 0) {
        allCampaignInsights = [...campaignInsightsData.data];
        
        // Processar os insights por campanha
        for (const insight of allCampaignInsights) {
          if (insight.spend) {
            const spendValue = parseFloat(insight.spend);
            if (!isNaN(spendValue)) {
              totalSpent += spendValue;
              console.log(`Campanha ${insight.campaign_name}: Gasto ${spendValue}`);
            }
          }
        }
      }
    }
    
    console.log(`Total gasto recalculado por campanhas: ${totalSpent}`);
  }

  return {
    success: true,
    totalSpent
  };
}

// Função para buscar conjuntos de anúncios (adsets) de uma campanha
export async function fetchAdSets(campaignId: string, accessToken: string) {
  try {
    // Buscar conjuntos de anúncios para a campanha, aumentando o limite para 1000
    const adsetsUrl = `https://graph.facebook.com/v22.0/${campaignId}/adsets?fields=daily_budget,status,name,end_time,id,effective_status,lifetime_budget&access_token=${accessToken}&limit=1000`;
    const adsetsResponse = await fetch(adsetsUrl);
    
    if (!adsetsResponse.ok) {
      console.error(`Erro ao buscar conjuntos de anúncios para campanha ${campaignId}:`, await adsetsResponse.json());
      return { success: false, data: [] };
    }

    let adsets = [];
    let adsetsData = await adsetsResponse.json();
    adsets = [...adsetsData.data || []];
    
    // Implementar paginação para conjuntos de anúncios também
    let nextAdsetPageUrl = adsetsData.paging?.next;
    while (nextAdsetPageUrl) {
      console.log(`Buscando próxima página de conjuntos de anúncios para campanha ${campaignId}`);
      const nextAdsetPageResponse = await fetch(nextAdsetPageUrl);
      if (!nextAdsetPageResponse.ok) {
        console.error("Erro ao buscar próxima página de conjuntos de anúncios:", await nextAdsetPageResponse.json());
        break;
      }
      const nextAdsetPageData = await nextAdsetPageResponse.json();
      adsets = [...adsets, ...(nextAdsetPageData.data || [])];
      nextAdsetPageUrl = nextAdsetPageData.paging?.next;
    }
    
    return { success: true, data: adsets };
  } catch (error) {
    console.error(`Erro ao buscar adsets para campanha ${campaignId}:`, error);
    return { success: false, data: [] };
  }
}
