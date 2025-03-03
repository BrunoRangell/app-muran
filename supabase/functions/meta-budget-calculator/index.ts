
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { format, addHours, isPast } from "https://cdn.jsdelivr.net/npm/date-fns@2.29.3/index.js";

// Configurar os headers CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RequestPayload {
  accountId: string;
  accessToken: string;
}

interface Campaign {
  id: string;
  name: string;
  status: string;
  daily_budget?: string;
  end_time?: string;
}

interface AdSet {
  id: string;
  name: string;
  status: string;
  daily_budget?: string;
  end_time?: string;
}

serve(async (req) => {
  // Lidar com requisições OPTIONS (CORS preflight)
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { accountId, accessToken } = await req.json() as RequestPayload;

    if (!accountId || !accessToken) {
      return new Response(
        JSON.stringify({ error: "ID da conta e token de acesso são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Calcular o orçamento diário total
    const totalDailyBudget = await calculateTotalDailyBudget(accountId, accessToken);

    return new Response(
      JSON.stringify({ totalDailyBudget }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Erro no cálculo do orçamento diário Meta Ads:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Erro interno no servidor" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

/**
 * Calcula o orçamento diário total com base nas campanhas e conjuntos de anúncios ativos
 */
async function calculateTotalDailyBudget(accountId: string, accessToken: string): Promise<number> {
  try {
    console.log(`Calculando orçamento diário total para a conta ${accountId}`);
    
    // Buscar campanhas ativas
    const campaigns = await fetchCampaigns(accountId, accessToken);
    console.log(`Encontradas ${campaigns.length} campanhas para análise`);
    
    let totalDailyBudget = 0;
    
    // Processar cada campanha
    for (const campaign of campaigns) {
      // Buscar conjuntos de anúncios da campanha
      const adSets = await fetchAdSets(campaign.id, accessToken);
      const activeAdSets = filterActiveAdSets(adSets);
      
      console.log(`Campanha ${campaign.name} (${campaign.id}) tem ${activeAdSets.length} conjuntos de anúncios ativos`);
      
      // Se a campanha tem orçamento diário definido e pelo menos um conjunto de anúncios ativo
      if (campaign.daily_budget && activeAdSets.length > 0) {
        // Converter de centavos para valor real
        const campaignDailyBudget = parseInt(campaign.daily_budget) / 100;
        totalDailyBudget += campaignDailyBudget;
        console.log(`Adicionando orçamento da campanha: ${campaignDailyBudget}`);
      } 
      // Se a campanha não tem orçamento diário definido, mas tem conjuntos de anúncios ativos
      else if (activeAdSets.length > 0) {
        // Somar orçamentos dos conjuntos de anúncios ativos
        for (const adSet of activeAdSets) {
          if (adSet.daily_budget) {
            // Converter de centavos para valor real
            const adSetDailyBudget = parseInt(adSet.daily_budget) / 100;
            totalDailyBudget += adSetDailyBudget;
            console.log(`Adicionando orçamento do conjunto de anúncios ${adSet.name}: ${adSetDailyBudget}`);
          }
        }
      }
    }
    
    console.log(`Orçamento diário total calculado: ${totalDailyBudget}`);
    return totalDailyBudget;
  } catch (error) {
    console.error("Erro no cálculo do orçamento diário:", error);
    throw error;
  }
}

/**
 * Busca as campanhas da conta Meta Ads
 */
async function fetchCampaigns(accountId: string, accessToken: string): Promise<Campaign[]> {
  try {
    const url = `https://graph.facebook.com/v20.0/act_${accountId}/campaigns?fields=daily_budget,status,name,end_time,id&access_token=${accessToken}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erro ao buscar campanhas: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    const campaigns = data.data || [];
    
    // Filtrar apenas campanhas ativas e sem data de término passada
    return filterActiveCampaigns(campaigns);
  } catch (error) {
    console.error("Erro ao buscar campanhas:", error);
    throw error;
  }
}

/**
 * Busca os conjuntos de anúncios de uma campanha
 */
async function fetchAdSets(campaignId: string, accessToken: string): Promise<AdSet[]> {
  try {
    const url = `https://graph.facebook.com/v20.0/${campaignId}/adsets?fields=daily_budget,status,name,end_time,id&access_token=${accessToken}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erro ao buscar conjuntos de anúncios: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error(`Erro ao buscar conjuntos de anúncios para a campanha ${campaignId}:`, error);
    throw error;
  }
}

/**
 * Filtra campanhas ativas e sem data de término passada
 */
function filterActiveCampaigns(campaigns: Campaign[]): Campaign[] {
  const now = new Date();
  
  // Ajustar para o fuso horário 'America/Sao_Paulo' (UTC-3)
  const saoPauloTime = addHours(now, -3);
  
  return campaigns.filter(campaign => {
    // Verificar status
    const isActive = campaign.status === "ACTIVE";
    
    // Verificar data de término
    let hasValidEndTime = true;
    if (campaign.end_time) {
      const endTime = new Date(campaign.end_time);
      hasValidEndTime = !isPast(endTime);
    }
    
    return isActive && hasValidEndTime;
  });
}

/**
 * Filtra conjuntos de anúncios ativos e sem data de término passada
 */
function filterActiveAdSets(adSets: AdSet[]): AdSet[] {
  const now = new Date();
  
  // Ajustar para o fuso horário 'America/Sao_Paulo' (UTC-3)
  const saoPauloTime = addHours(now, -3);
  
  return adSets.filter(adSet => {
    // Verificar status
    const isActive = adSet.status === "ACTIVE";
    
    // Verificar data de término
    let hasValidEndTime = true;
    if (adSet.end_time) {
      const endTime = new Date(adSet.end_time);
      hasValidEndTime = !isPast(endTime);
    }
    
    return isActive && hasValidEndTime;
  });
}
