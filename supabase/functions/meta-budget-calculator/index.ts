
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { format, utcToZonedTime } from 'https://cdn.skypack.dev/date-fns-tz';
import { isFuture, parseISO } from 'https://cdn.skypack.dev/date-fns';

// Configuração de CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
};

// Handler principal
serve(async (req) => {
  // Tratamento de requisições preflight OPTIONS para CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 204, 
      headers: corsHeaders 
    });
  }

  try {
    const { accountId, accessToken } = await req.json();
    
    console.log(`Processando cálculo de orçamento para conta: ${accountId}`);
    
    if (!accountId || !accessToken) {
      return new Response(
        JSON.stringify({ 
          error: 'Parâmetros obrigatórios ausentes: accountId e accessToken' 
        }),
        { status: 400, headers: corsHeaders }
      );
    }

    const result = await calculateTotalDailyBudget(accountId, accessToken);
    
    return new Response(
      JSON.stringify(result),
      { status: 200, headers: corsHeaders }
    );
  } catch (error) {
    console.error(`Erro ao processar requisição: ${error.message}`);
    
    return new Response(
      JSON.stringify({ 
        error: `Erro ao calcular orçamento diário: ${error.message}` 
      }),
      { status: 500, headers: corsHeaders }
    );
  }
});

// Função para calcular o orçamento diário total
async function calculateTotalDailyBudget(accountId: string, accessToken: string) {
  try {
    console.log('Iniciando cálculo de orçamento diário total...');
    
    // Buscar campanhas ativas
    const campaignsResponse = await fetch(
      `https://graph.facebook.com/v20.0/act_${accountId}/campaigns?fields=daily_budget,status,name,end_time,id&access_token=${accessToken}`
    );
    
    if (!campaignsResponse.ok) {
      const errorData = await campaignsResponse.json();
      throw new Error(`Erro na API do Meta: ${JSON.stringify(errorData.error || errorData)}`);
    }
    
    const campaignsData = await campaignsResponse.json();
    console.log(`Total de campanhas encontradas: ${campaignsData.data?.length || 0}`);
    
    if (!campaignsData.data || !Array.isArray(campaignsData.data)) {
      throw new Error('Formato de resposta inválido da API de campanhas');
    }
    
    // Filtrar campanhas ativas
    const activeCampaigns = campaignsData.data.filter(campaign => {
      // Verificar se a campanha está ativa
      if (campaign.status !== 'ACTIVE') {
        return false;
      }
      
      // Verificar data de término, se existir
      if (campaign.end_time) {
        const endDate = parseISO(campaign.end_time);
        // Converter para timezone local (Brasil)
        const brazilTimeZone = 'America/Sao_Paulo';
        const localEndDate = utcToZonedTime(endDate, brazilTimeZone);
        
        // Verificar se a data de término já passou
        if (!isFuture(localEndDate)) {
          return false;
        }
      }
      
      return true;
    });
    
    console.log(`Campanhas ativas encontradas: ${activeCampaigns.length}`);
    
    let totalBudget = 0;
    
    // Processar cada campanha ativa
    for (const campaign of activeCampaigns) {
      // Buscar conjuntos de anúncios da campanha
      const adsetsResponse = await fetch(
        `https://graph.facebook.com/v20.0/${campaign.id}/adsets?fields=daily_budget,status,name,end_time,id&access_token=${accessToken}`
      );
      
      if (!adsetsResponse.ok) {
        console.warn(`Erro ao buscar conjuntos de anúncios para campanha ${campaign.id}`);
        continue;
      }
      
      const adsetsData = await adsetsResponse.json();
      
      if (!adsetsData.data || !Array.isArray(adsetsData.data)) {
        console.warn(`Formato de resposta inválido para conjuntos de anúncios da campanha ${campaign.id}`);
        continue;
      }
      
      // Filtrar conjuntos de anúncios ativos
      const activeAdsets = adsetsData.data.filter(adset => {
        // Verificar se o conjunto está ativo
        if (adset.status !== 'ACTIVE') {
          return false;
        }
        
        // Verificar data de término, se existir
        if (adset.end_time) {
          const endDate = parseISO(adset.end_time);
          // Converter para timezone local (Brasil)
          const brazilTimeZone = 'America/Sao_Paulo';
          const localEndDate = utcToZonedTime(endDate, brazilTimeZone);
          
          // Verificar se a data de término já passou
          if (!isFuture(localEndDate)) {
            return false;
          }
        }
        
        return true;
      });
      
      // Verificar se a campanha tem orçamento diário definido
      if (campaign.daily_budget && Number(campaign.daily_budget) > 0) {
        // Verificar se há pelo menos um conjunto de anúncios ativo
        if (activeAdsets.length > 0) {
          // Somar o orçamento da campanha
          totalBudget += Number(campaign.daily_budget) / 100; // Convertendo de centavos para reais
          console.log(`Adicionado orçamento da campanha ${campaign.name}: ${campaign.daily_budget / 100}`);
        }
      } else {
        // Se a campanha não tiver orçamento definido, somar orçamentos dos conjuntos de anúncios ativos
        for (const adset of activeAdsets) {
          if (adset.daily_budget && Number(adset.daily_budget) > 0) {
            totalBudget += Number(adset.daily_budget) / 100; // Convertendo de centavos para reais
            console.log(`Adicionado orçamento do conjunto de anúncios ${adset.name}: ${adset.daily_budget / 100}`);
          }
        }
      }
    }
    
    console.log(`Orçamento diário total calculado: ${totalBudget}`);
    
    return {
      totalDailyBudget: totalBudget,
      calculatedAt: new Date().toISOString(),
      activeCampaignsCount: activeCampaigns.length
    };
  } catch (error) {
    console.error(`Erro ao calcular orçamento: ${error.message}`);
    throw error;
  }
}
