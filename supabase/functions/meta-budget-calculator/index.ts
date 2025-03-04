
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Configuração de cabeçalhos CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

// Handler para requisições CORS preflight
function handleCors(req: Request) {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: new Headers(corsHeaders),
    });
  }
  return null;
}

serve(async (req) => {
  // Processar requisição CORS preflight se for OPTIONS
  const corsResponse = handleCors(req);
  if (corsResponse) {
    return corsResponse;
  }

  try {
    // Extrair corpo da requisição
    const { accountId, accessToken } = await req.json();

    // Validar parâmetros de entrada
    if (!accountId) {
      return new Response(
        JSON.stringify({ error: "ID da conta Meta Ads não fornecido" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    if (!accessToken) {
      return new Response(
        JSON.stringify({ error: "Token de acesso não fornecido" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Iniciando cálculo do orçamento diário total
    console.log(`Calculando orçamento diário para a conta ${accountId}`);
    
    // Buscar campanhas com mais campos para melhor diagnóstico
    const campaignsUrl = `https://graph.facebook.com/v20.0/act_${accountId}/campaigns?fields=daily_budget,status,name,end_time,id,effective_status,budget_remaining,lifetime_budget,special_ad_categories&access_token=${accessToken}`;
    const campaignsResponse = await fetch(campaignsUrl);
    
    if (!campaignsResponse.ok) {
      const errorData = await campaignsResponse.json();
      console.error("Erro ao buscar campanhas:", errorData);
      return new Response(
        JSON.stringify({ error: `Erro na API do Meta: ${JSON.stringify(errorData)}` }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const campaignsData = await campaignsResponse.json();
    const campaigns = campaignsData.data || [];
    
    console.log(`Encontradas ${campaigns.length} campanhas totais na conta`);

    // Data atual para comparações
    const now = new Date();
    console.log(`Data atual: ${now.toISOString()}`);

    let totalDailyBudget = 0;
    const campaignDetails = [];
    const skippedCampaigns = [];

    // Processar cada campanha
    for (const campaign of campaigns) {
      // Log detalhado para diagnóstico
      console.log(`\nAvaliando campanha: ID=${campaign.id}, Nome="${campaign.name}", Status=${campaign.status}, EffectiveStatus=${campaign.effective_status}`);
      
      // Verificar se a campanha está ativa
      if (campaign.status !== "ACTIVE") {
        console.log(`Campanha ${campaign.id} (${campaign.name}) não está ativa. Status: ${campaign.status}`);
        skippedCampaigns.push({
          id: campaign.id,
          name: campaign.name,
          reason: `Status não ativo: ${campaign.status}`,
          details: { status: campaign.status, effectiveStatus: campaign.effective_status }
        });
        continue;
      }

      // Verificar effective_status também
      if (campaign.effective_status !== "ACTIVE") {
        console.log(`Campanha ${campaign.id} (${campaign.name}) tem effective_status não ativo: ${campaign.effective_status}`);
        skippedCampaigns.push({
          id: campaign.id,
          name: campaign.name,
          reason: `Effective status não ativo: ${campaign.effective_status}`,
          details: { status: campaign.status, effectiveStatus: campaign.effective_status }
        });
        continue;
      }

      // Verificar data de término
      if (campaign.end_time) {
        const endTime = new Date(campaign.end_time);
        const isFuture = endTime > now;
        if (!isFuture) {
          console.log(`Campanha ${campaign.id} (${campaign.name}) já terminou em ${endTime.toLocaleDateString('pt-BR')}`);
          skippedCampaigns.push({
            id: campaign.id,
            name: campaign.name,
            reason: `Data de término já passou: ${endTime.toLocaleDateString('pt-BR')}`,
            details: { endTime: campaign.end_time }
          });
          continue;
        }
      }

      // Verificar se é uma campanha de orçamento por tempo de vida
      const hasLifetimeBudget = campaign.lifetime_budget && parseInt(campaign.lifetime_budget) > 0;
      if (hasLifetimeBudget) {
        console.log(`Campanha ${campaign.id} (${campaign.name}) tem orçamento por tempo de vida: ${parseInt(campaign.lifetime_budget) / 100}`);
        // Não vamos pular, mas registramos para diagnóstico
      }

      // Buscar conjuntos de anúncios para a campanha
      const adsetsUrl = `https://graph.facebook.com/v20.0/${campaign.id}/adsets?fields=daily_budget,status,name,end_time,id,effective_status,lifetime_budget&access_token=${accessToken}`;
      const adsetsResponse = await fetch(adsetsUrl);
      
      if (!adsetsResponse.ok) {
        console.error(`Erro ao buscar conjuntos de anúncios para campanha ${campaign.id}:`, await adsetsResponse.json());
        continue;
      }

      const adsetsData = await adsetsResponse.json();
      const adsets = adsetsData.data || [];
      
      console.log(`Campanha ${campaign.id} (${campaign.name}) tem ${adsets.length} conjuntos de anúncios totais`);
      
      // Filtrar apenas conjuntos de anúncios ativos
      const activeAdsets = adsets.filter(adset => {
        // Verificar status
        if (adset.status !== "ACTIVE") {
          console.log(`Conjunto de anúncios ${adset.id} (${adset.name}) não está ativo. Status: ${adset.status}`);
          return false;
        }
        
        // Verificar effective_status
        if (adset.effective_status !== "ACTIVE") {
          console.log(`Conjunto de anúncios ${adset.id} (${adset.name}) tem effective_status não ativo: ${adset.effective_status}`);
          return false;
        }
        
        // Verificar data de término
        if (adset.end_time) {
          const endTime = new Date(adset.end_time);
          const isFuture = endTime > now;
          if (!isFuture) {
            console.log(`Conjunto de anúncios ${adset.id} (${adset.name}) já terminou em ${endTime.toLocaleDateString('pt-BR')}`);
            return false;
          }
        }
        
        return true;
      });

      console.log(`Campanha ${campaign.id} (${campaign.name}) tem ${activeAdsets.length} conjuntos de anúncios ativos`);

      // Se a campanha tem orçamento diário e pelo menos um conjunto de anúncios ativo
      if (campaign.daily_budget && activeAdsets.length > 0) {
        const campaignBudget = parseInt(campaign.daily_budget) / 100; // Converte de centavos para reais
        totalDailyBudget += campaignBudget;
        console.log(`Adicionando orçamento da campanha ${campaign.id} (${campaign.name}): R$ ${campaignBudget}`);
        
        // Adicionar aos detalhes
        campaignDetails.push({
          id: campaign.id,
          name: campaign.name,
          budget: campaignBudget,
          status: campaign.status,
          effectiveStatus: campaign.effective_status,
          type: 'campaign'
        });
      } 
      // Se a campanha não tem orçamento diário, soma o orçamento dos conjuntos de anúncios ativos
      else if (!campaign.daily_budget && activeAdsets.length > 0) {
        for (const adset of activeAdsets) {
          if (adset.daily_budget) {
            const adsetBudget = parseInt(adset.daily_budget) / 100; // Converte de centavos para reais
            totalDailyBudget += adsetBudget;
            console.log(`Adicionando orçamento do conjunto de anúncios ${adset.id} (${adset.name}): R$ ${adsetBudget}`);
            
            // Adicionar aos detalhes
            campaignDetails.push({
              id: adset.id,
              name: adset.name,
              budget: adsetBudget,
              status: adset.status,
              effectiveStatus: adset.effective_status,
              type: 'adset',
              parentName: campaign.name,
              parentId: campaign.id
            });
          } else if (hasLifetimeBudget) {
            console.log(`Conjunto de anúncios ${adset.id} (${adset.name}) sem orçamento diário e pertence a campanha com orçamento por tempo de vida`);
          }
        }
      } else {
        // Registrar campanhas sem orçamento e sem adsets ativos para diagnóstico
        const reason = !campaign.daily_budget && activeAdsets.length === 0 
          ? "Sem orçamento diário e sem conjuntos de anúncios ativos" 
          : !campaign.daily_budget 
            ? "Sem orçamento diário definido" 
            : "Sem conjuntos de anúncios ativos";
        
        skippedCampaigns.push({
          id: campaign.id,
          name: campaign.name,
          reason: reason,
          details: { 
            dailyBudget: campaign.daily_budget ? parseInt(campaign.daily_budget) / 100 : 0,
            activeAdsets: activeAdsets.length,
            totalAdsets: adsets.length
          }
        });
        
        console.log(`Campanha ${campaign.id} (${campaign.name}) - ${reason}`);
      }
    }

    console.log(`\nOrçamento diário total calculado: R$ ${totalDailyBudget}`);
    console.log(`Total de itens detalhados: ${campaignDetails.length}`);
    console.log(`Campanhas ignoradas: ${skippedCampaigns.length}`);

    // Ordenar detalhes por tipo e valor
    campaignDetails.sort((a, b) => {
      // Primeiro ordenar por tipo (campanhas primeiro)
      if (a.type !== b.type) {
        return a.type === 'campaign' ? -1 : 1;
      }
      // Se mesmo tipo, ordenar por orçamento (maior primeiro)
      return b.budget - a.budget;
    });

    // Retornar o resultado com detalhes e diagnóstico
    return new Response(
      JSON.stringify({ 
        totalDailyBudget,
        campaignDetails,
        diagnostics: {
          totalCampaigns: campaigns.length,
          includedItems: campaignDetails.length,
          skippedCampaigns
        }
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );

  } catch (error) {
    console.error("Erro ao processar requisição:", error);
    return new Response(
      JSON.stringify({ error: `Erro ao processar requisição: ${error.message}` }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
