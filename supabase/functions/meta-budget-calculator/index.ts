
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
    
    // Buscar campanhas ativas
    const campaignsUrl = `https://graph.facebook.com/v20.0/act_${accountId}/campaigns?fields=daily_budget,status,name,end_time,id&access_token=${accessToken}`;
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
    
    console.log(`Encontradas ${campaigns.length} campanhas`);

    // Calcular o fuso horário de São Paulo (UTC-3)
    const now = new Date();
    console.log(`Data atual: ${now.toISOString()}`);

    let totalDailyBudget = 0;

    // Processar cada campanha
    for (const campaign of campaigns) {
      // Verificar se a campanha está ativa
      if (campaign.status !== "ACTIVE") {
        console.log(`Campanha ${campaign.id} (${campaign.name}) não está ativa. Status: ${campaign.status}`);
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

      // Buscar conjuntos de anúncios para a campanha
      const adsetsUrl = `https://graph.facebook.com/v20.0/${campaign.id}/adsets?fields=daily_budget,status,name,end_time,id&access_token=${accessToken}`;
      const adsetsResponse = await fetch(adsetsUrl);
      
      if (!adsetsResponse.ok) {
        console.error(`Erro ao buscar conjuntos de anúncios para campanha ${campaign.id}:`, await adsetsResponse.json());
        continue;
      }

      const adsetsData = await adsetsResponse.json();
      const adsets = adsetsData.data || [];
      
      // Filtrar apenas conjuntos de anúncios ativos
      const activeAdsets = adsets.filter(adset => {
        // Verificar status
        if (adset.status !== "ACTIVE") return false;
        
        // Verificar data de término
        if (adset.end_time) {
          const endTime = new Date(adset.end_time);
          return endTime > now;
        }
        
        return true;
      });

      console.log(`Campanha ${campaign.id} (${campaign.name}) tem ${activeAdsets.length} conjuntos de anúncios ativos`);

      // Se a campanha tem orçamento diário e pelo menos um conjunto de anúncios ativo
      if (campaign.daily_budget && activeAdsets.length > 0) {
        const campaignBudget = parseInt(campaign.daily_budget) / 100; // Converte de centavos para reais
        totalDailyBudget += campaignBudget;
        console.log(`Adicionando orçamento da campanha ${campaign.id} (${campaign.name}): R$ ${campaignBudget}`);
      } 
      // Se a campanha não tem orçamento diário, soma o orçamento dos conjuntos de anúncios ativos
      else if (!campaign.daily_budget && activeAdsets.length > 0) {
        for (const adset of activeAdsets) {
          if (adset.daily_budget) {
            const adsetBudget = parseInt(adset.daily_budget) / 100; // Converte de centavos para reais
            totalDailyBudget += adsetBudget;
            console.log(`Adicionando orçamento do conjunto de anúncios ${adset.id} (${adset.name}): R$ ${adsetBudget}`);
          }
        }
      }
    }

    console.log(`Orçamento diário total calculado: R$ ${totalDailyBudget}`);

    // Retornar o resultado
    return new Response(
      JSON.stringify({ totalDailyBudget }),
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
