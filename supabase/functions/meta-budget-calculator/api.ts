import { corsHeaders } from "./cors.ts";

// Função para buscar campanhas com paginação
export async function fetchCampaigns(accountId: string, accessToken: string) {
  try {
    console.log(`🔍 Buscando campanhas para conta: ${accountId}`);
    let allCampaigns: any[] = [];
    let nextPage: string | null = null;
    
    do {
      let url = `https://graph.facebook.com/v18.0/act_${accountId}/campaigns?access_token=${accessToken}&fields=id,name,status,effective_status,daily_budget,lifetime_budget,start_time,stop_time,created_time,updated_time&limit=100`;
      
      if (nextPage) {
        url = nextPage;
      }
      
      const response = await fetch(url);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Erro ao buscar campanhas: ${response.status} - ${errorText}`);
        return {
          success: false,
          response: new Response(
            JSON.stringify({ error: `Erro ao buscar campanhas: ${errorText}` }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: response.status }
          )
        };
      }
      
      const data = await response.json();
      allCampaigns = allCampaigns.concat(data.data || []);
      nextPage = data.paging?.next || null;
      
      console.log(`📄 Página processada: ${data.data?.length || 0} campanhas. Próxima página: ${nextPage ? "Sim" : "Não"}`);
    } while (nextPage);
    
    console.log(`✅ Total de campanhas encontradas: ${allCampaigns.length}`);
    return { success: true, data: allCampaigns };
    
  } catch (error) {
    console.error("❌ Erro ao buscar campanhas:", error);
    return {
      success: false,
      response: new Response(
        JSON.stringify({ error: `Erro ao buscar campanhas: ${error.message}` }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      )
    };
  }
}

// Função para buscar insights de gastos das campanhas
export async function fetchCampaignInsights(
  accountId: string, 
  accessToken: string, 
  dateRange: { start: string; end: string },
  fetchSeparateInsights?: boolean
) {
  try {
    console.log(`📊 Buscando insights de gastos para período: ${dateRange.start} a ${dateRange.end}`);
    
    // Primeiro, tentar buscar insights da conta geral
    const accountInsightsUrl = `https://graph.facebook.com/v18.0/act_${accountId}/insights?access_token=${accessToken}&time_range=${encodeURIComponent(JSON.stringify({ since: dateRange.start, until: dateRange.end }))}&fields=spend&level=account`;
    
    const accountResponse = await fetch(accountInsightsUrl);
    
    if (!accountResponse.ok) {
      const errorText = await accountResponse.text();
      console.error(`❌ Erro ao buscar insights da conta: ${accountResponse.status} - ${errorText}`);
      return {
        success: false,
        response: new Response(
          JSON.stringify({ error: `Erro ao buscar insights da conta: ${errorText}` }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: accountResponse.status }
        )
      };
    }
    
    const accountData = await accountResponse.json();
    const accountSpend = accountData.data?.[0]?.spend || "0";
    const totalSpent = parseFloat(accountSpend);
    
    console.log(`💰 Gasto total da conta no período: ${totalSpent}`);
    
    // Se o gasto da conta for 0 e fetchSeparateInsights for true, buscar insights por campanha
    if (totalSpent === 0 && fetchSeparateInsights) {
      console.log("🔍 Gasto da conta é 0, buscando insights separados por campanha...");
      
      const campaignInsightsUrl = `https://graph.facebook.com/v18.0/act_${accountId}/insights?access_token=${accessToken}&time_range=${encodeURIComponent(JSON.stringify({ since: dateRange.start, until: dateRange.end }))}&fields=spend,campaign_id,campaign_name&level=campaign`;
      
      const campaignResponse = await fetch(campaignInsightsUrl);
      
      if (!campaignResponse.ok) {
        const errorText = await campaignResponse.text();
        console.warn(`⚠️ Erro ao buscar insights por campanha: ${campaignResponse.status} - ${errorText}`);
        // Continuar com o valor 0 da conta
        return { success: true, totalSpent: 0 };
      }
      
      const campaignData = await campaignResponse.json();
      const campaignSpends = campaignData.data || [];
      
      const totalCampaignSpent = campaignSpends.reduce((sum: number, insight: any) => {
        return sum + parseFloat(insight.spend || "0");
      }, 0);
      
      console.log(`💰 Total gasto por campanhas: ${totalCampaignSpent} (${campaignSpends.length} campanhas com dados)`);
      
      return { success: true, totalSpent: totalCampaignSpent };
    }
    
    return { success: true, totalSpent };
    
  } catch (error) {
    console.error("❌ Erro ao buscar insights:", error);
    return {
      success: false,
      response: new Response(
        JSON.stringify({ error: `Erro ao buscar insights: ${error.message}` }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      )
    };
  }
}

// Função para buscar adsets de uma campanha específica
export async function fetchAdSets(campaignId: string, accessToken: string) {
  try {
    console.log(`📋 Buscando adsets para campanha: ${campaignId}`);
    let allAdSets: any[] = [];
    let nextPage: string | null = null;
    
    do {
      let url = `https://graph.facebook.com/v18.0/${campaignId}/adsets?access_token=${accessToken}&fields=id,name,status,effective_status,daily_budget,lifetime_budget,start_time,end_time&limit=100`;
      
      if (nextPage) {
        url = nextPage;
      }
      
      const response = await fetch(url);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Erro ao buscar adsets: ${response.status} - ${errorText}`);
        return { success: false, data: [] };
      }
      
      const data = await response.json();
      allAdSets = allAdSets.concat(data.data || []);
      nextPage = data.paging?.next || null;
      
    } while (nextPage);
    
    console.log(`✅ Total de adsets encontrados: ${allAdSets.length}`);
    return { success: true, data: allAdSets };
    
  } catch (error) {
    console.error("❌ Erro ao buscar adsets:", error);
    return { success: false, data: [] };
  }
}