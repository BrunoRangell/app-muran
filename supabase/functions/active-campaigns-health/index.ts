
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.48.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CampaignHealthData {
  clientId: string;
  clientName: string;
  platform: 'meta' | 'google';
  hasAccount: boolean;
  hasActiveCampaigns: boolean;
  costToday: number;
  impressionsToday: number;
  activeCampaignsCount: number;
  accountId?: string;
  accountName?: string;
}

// Função melhorada para buscar dados do Meta Ads
async function fetchMetaActiveCampaigns(accessToken: string, accountId: string): Promise<{ cost: number; impressions: number; activeCampaigns: number }> {
  try {
    const today = new Date().toISOString().split('T')[0];
    console.log(`🔍 Meta: Buscando campanhas para conta ${accountId} na data ${today}`);
    
    // Primeira chamada: buscar campanhas ativas
    const campaignsUrl = `https://graph.facebook.com/v18.0/act_${accountId}/campaigns?fields=id,name,effective_status&access_token=${accessToken}`;
    console.log(`📡 Meta: Chamando URL de campanhas: ${campaignsUrl.replace(accessToken, 'TOKEN_HIDDEN')}`);
    
    const campaignsResponse = await fetch(campaignsUrl);
    const campaignsData = await campaignsResponse.json();
    
    console.log(`📊 Meta: Status da resposta de campanhas: ${campaignsResponse.status}`);
    
    if (!campaignsResponse.ok) {
      console.error(`❌ Meta: Erro HTTP ${campaignsResponse.status} ao buscar campanhas:`, campaignsData);
      return { cost: 0, impressions: 0, activeCampaigns: 0 };
    }
    
    if (campaignsData.error) {
      console.error(`❌ Meta: Erro da API ao buscar campanhas:`, campaignsData.error);
      return { cost: 0, impressions: 0, activeCampaigns: 0 };
    }
    
    if (!campaignsData.data || !Array.isArray(campaignsData.data)) {
      console.log(`⚠️ Meta: Nenhuma campanha encontrada para conta ${accountId}`);
      return { cost: 0, impressions: 0, activeCampaigns: 0 };
    }
    
    // Filtrar apenas campanhas ativas
    const activeCampaigns = campaignsData.data.filter((campaign: any) => 
      campaign.effective_status === 'ACTIVE'
    );
    
    console.log(`✅ Meta: Encontradas ${activeCampaigns.length} campanhas ativas de ${campaignsData.data.length} total`);
    
    if (activeCampaigns.length === 0) {
      return { cost: 0, impressions: 0, activeCampaigns: 0 };
    }
    
    // Segunda chamada: buscar insights da conta (mais simples e eficiente)
    const insightsUrl = `https://graph.facebook.com/v18.0/act_${accountId}/insights?fields=spend,impressions&time_range={"since":"${today}","until":"${today}"}&access_token=${accessToken}`;
    console.log(`📡 Meta: Chamando URL de insights: ${insightsUrl.replace(accessToken, 'TOKEN_HIDDEN')}`);
    
    const insightsResponse = await fetch(insightsUrl);
    const insightsData = await insightsResponse.json();
    
    console.log(`📊 Meta: Status da resposta de insights: ${insightsResponse.status}`);
    
    if (!insightsResponse.ok) {
      console.error(`❌ Meta: Erro HTTP ${insightsResponse.status} ao buscar insights:`, insightsData);
      return { cost: 0, impressions: 0, activeCampaigns: activeCampaigns.length };
    }
    
    if (insightsData.error) {
      console.error(`❌ Meta: Erro da API ao buscar insights:`, insightsData.error);
      return { cost: 0, impressions: 0, activeCampaigns: activeCampaigns.length };
    }
    
    // Processar dados de insights
    let totalCost = 0;
    let totalImpressions = 0;
    
    if (insightsData.data && Array.isArray(insightsData.data) && insightsData.data.length > 0) {
      const todayInsights = insightsData.data[0]; // Dados do dia de hoje
      totalCost = parseFloat(todayInsights.spend || '0');
      totalImpressions = parseInt(todayInsights.impressions || '0');
      
      console.log(`💰 Meta: Custo hoje: R$ ${totalCost}, Impressões: ${totalImpressions}`);
    } else {
      console.log(`⚠️ Meta: Nenhum insight encontrado para hoje`);
    }
    
    return {
      cost: totalCost,
      impressions: totalImpressions,
      activeCampaigns: activeCampaigns.length
    };
    
  } catch (error) {
    console.error(`❌ Meta: Erro de rede/exception para conta ${accountId}:`, error);
    return { cost: 0, impressions: 0, activeCampaigns: 0 };
  }
}

// Função corrigida para buscar dados do Google Ads
async function fetchGoogleActiveCampaigns(clientCustomerId: string, supabase: any): Promise<{ cost: number; impressions: number; activeCampaigns: number }> {
  try {
    console.log(`🔍 Google: Buscando campanhas para conta ${clientCustomerId}`);
    
    // Buscar todos os tokens necessários da tabela api_tokens
    const { data: tokensData, error: tokensError } = await supabase
      .from('api_tokens')
      .select('name, value')
      .in('name', ['google_ads_access_token', 'google_ads_developer_token', 'google_ads_manager_id']);

    if (tokensError) {
      console.error(`❌ Google: Erro ao buscar tokens:`, tokensError);
      return { cost: 0, impressions: 0, activeCampaigns: 0 };
    }

    if (!tokensData || tokensData.length === 0) {
      console.log(`⚠️ Google: Nenhum token encontrado na tabela api_tokens`);
      return { cost: 0, impressions: 0, activeCampaigns: 0 };
    }

    // Organizar tokens por nome
    const tokens: { [key: string]: string } = {};
    tokensData.forEach(token => {
      tokens[token.name] = token.value;
    });

    const accessToken = tokens['google_ads_access_token'];
    const developerToken = tokens['google_ads_developer_token'];
    const managerId = tokens['google_ads_manager_id'];

    if (!accessToken) {
      console.log(`⚠️ Google: Access token não encontrado`);
      return { cost: 0, impressions: 0, activeCampaigns: 0 };
    }

    if (!developerToken) {
      console.log(`⚠️ Google: Developer token não encontrado`);
      return { cost: 0, impressions: 0, activeCampaigns: 0 };
    }

    console.log(`✅ Google: Tokens encontrados - Access: ${accessToken ? 'SIM' : 'NÃO'}, Developer: ${developerToken ? 'SIM' : 'NÃO'}, Manager: ${managerId || 'NÃO'}`);
    
    const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
    
    // Query GAQL corrigida e simplificada
    const query = `
      SELECT 
        campaign.id,
        campaign.name,
        campaign.status,
        metrics.cost_micros,
        metrics.impressions
      FROM campaign 
      WHERE 
        campaign.status = 'ENABLED'
        AND segments.date = '${today}'
    `;
    
    console.log(`📡 Google: Executando query GAQL para ${clientCustomerId} na data ${today}`);
    
    // URL corrigida para Google Ads API v15
    const googleAdsUrl = `https://googleads.googleapis.com/v15/customers/${clientCustomerId}/googleAds:searchStream`;
    
    // Headers corrigidos com todos os campos obrigatórios
    const headers: { [key: string]: string } = {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'developer-token': developerToken
    };

    // Adicionar login-customer-id se Manager ID estiver disponível
    if (managerId && managerId.trim() !== '') {
      headers['login-customer-id'] = managerId;
      console.log(`🔧 Google: Usando Manager Customer ID: ${managerId}`);
    }

    console.log(`📡 Google: Headers preparados:`, { 
      ...headers, 
      'Authorization': 'Bearer TOKEN_HIDDEN',
      'developer-token': 'DEVELOPER_TOKEN_HIDDEN'
    });
    
    const response = await fetch(googleAdsUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({ query })
    });
    
    console.log(`📊 Google: Status da resposta: ${response.status}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Google: Erro HTTP ${response.status}:`, errorText.substring(0, 500)); // Limitar log para não poluir
      return { cost: 0, impressions: 0, activeCampaigns: 0 };
    }
    
    const data = await response.json();
    
    if (!data.results || !Array.isArray(data.results)) {
      console.log(`⚠️ Google: Nenhum resultado encontrado para ${clientCustomerId}`);
      return { cost: 0, impressions: 0, activeCampaigns: 0 };
    }
    
    // Processar resultados
    let totalCost = 0;
    let totalImpressions = 0;
    let activeCampaigns = 0;
    
    data.results.forEach((result: any) => {
      if (result.campaign?.status === 'ENABLED') {
        activeCampaigns++;
        totalCost += (result.metrics?.costMicros || 0) / 1000000; // Converter de micros para valor real
        totalImpressions += result.metrics?.impressions || 0;
      }
    });
    
    console.log(`✅ Google: ${activeCampaigns} campanhas ativas, Custo: R$ ${totalCost.toFixed(2)}, Impressões: ${totalImpressions}`);
    
    return {
      cost: totalCost,
      impressions: totalImpressions,
      activeCampaigns: activeCampaigns
    };
    
  } catch (error) {
    console.error(`❌ Google: Erro de rede/exception para conta ${clientCustomerId}:`, error);
    return { cost: 0, impressions: 0, activeCampaigns: 0 };
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('🔍 Iniciando busca de saúde de campanhas ativas...');

    // Buscar token do Meta Ads
    const { data: metaToken } = await supabase
      .from('api_tokens')
      .select('value')
      .eq('name', 'meta_access_token')
      .maybeSingle();

    if (!metaToken?.value) {
      console.error('❌ Token Meta Ads não configurado');
      throw new Error('Token Meta Ads não configurado');
    }

    console.log('✅ Token Meta Ads encontrado');

    // Buscar todos os clientes ativos com seus account_ids diretamente da tabela clients
    const { data: clients, error: clientsError } = await supabase
      .from('clients')
      .select('id, company_name, meta_account_id, google_account_id')
      .eq('status', 'active')
      .order('company_name');

    if (clientsError) {
      console.error('❌ Erro ao buscar clientes:', clientsError);
      throw clientsError;
    }

    console.log(`✅ Encontrados ${clients?.length || 0} clientes ativos`);

    const healthData: CampaignHealthData[] = [];

    // Processar cada cliente
    for (const client of clients || []) {
      console.log(`\n📊 Processando cliente: ${client.company_name}`);
      console.log(`📋 Meta Account ID: ${client.meta_account_id || 'NÃO CONFIGURADO'}`);
      console.log(`📋 Google Account ID: ${client.google_account_id || 'NÃO CONFIGURADO'}`);

      // Processar Meta Ads
      if (client.meta_account_id && client.meta_account_id.trim() !== '') {
        console.log(`🔄 Processando Meta Ads para ${client.company_name}...`);
        const metaData = await fetchMetaActiveCampaigns(metaToken.value, client.meta_account_id);
        
        healthData.push({
          clientId: client.id,
          clientName: client.company_name,
          platform: 'meta',
          hasAccount: true,
          hasActiveCampaigns: metaData.activeCampaigns > 0,
          costToday: metaData.cost,
          impressionsToday: metaData.impressions,
          activeCampaignsCount: metaData.activeCampaigns,
          accountId: client.meta_account_id,
          accountName: `Meta Ads - ${client.meta_account_id}`
        });
        
        console.log(`✅ Meta processado: Campanhas=${metaData.activeCampaigns}, Custo=R$${metaData.cost}, Impressões=${metaData.impressions}`);
      } else {
        healthData.push({
          clientId: client.id,
          clientName: client.company_name,
          platform: 'meta',
          hasAccount: false,
          hasActiveCampaigns: false,
          costToday: 0,
          impressionsToday: 0,
          activeCampaignsCount: 0
        });
        
        console.log(`⚪ Meta não configurado para ${client.company_name}`);
      }

      // Processar Google Ads
      if (client.google_account_id && client.google_account_id.trim() !== '') {
        console.log(`🔄 Processando Google Ads para ${client.company_name}...`);
        const googleData = await fetchGoogleActiveCampaigns(client.google_account_id, supabase);
        
        healthData.push({
          clientId: client.id,
          clientName: client.company_name,
          platform: 'google',
          hasAccount: true,
          hasActiveCampaigns: googleData.activeCampaigns > 0,
          costToday: googleData.cost,
          impressionsToday: googleData.impressions,
          activeCampaignsCount: googleData.activeCampaigns,
          accountId: client.google_account_id,
          accountName: `Google Ads - ${client.google_account_id}`
        });
        
        console.log(`✅ Google processado: Campanhas=${googleData.activeCampaigns}, Custo=R$${googleData.cost.toFixed(2)}, Impressões=${googleData.impressions}`);
      } else {
        healthData.push({
          clientId: client.id,
          clientName: client.company_name,
          platform: 'google',
          hasAccount: false,
          hasActiveCampaigns: false,
          costToday: 0,
          impressionsToday: 0,
          activeCampaignsCount: 0
        });
        
        console.log(`⚪ Google não configurado para ${client.company_name}`);
      }
    }

    // Estatísticas finais
    const metaRecords = healthData.filter(h => h.platform === 'meta');
    const googleRecords = healthData.filter(h => h.platform === 'google');
    const metaWithData = metaRecords.filter(h => h.costToday > 0);
    const googleWithData = googleRecords.filter(h => h.costToday > 0);

    console.log(`\n📈 Resumo dos dados processados:`);
    console.log(`📊 Total de registros: ${healthData.length}`);
    console.log(`🟦 Meta Ads: ${metaRecords.length} registros (${metaWithData.length} com dados)`);
    console.log(`🟥 Google Ads: ${googleRecords.length} registros (${googleWithData.length} com dados)`);
    console.log(`👥 Clientes únicos: ${clients?.length || 0}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: healthData,
        timestamp: new Date().toISOString(),
        totalClients: clients?.length || 0,
        totalRecords: healthData.length,
        debug: {
          metaRecords: metaRecords.length,
          googleRecords: googleRecords.length,
          metaWithData: metaWithData.length,
          googleWithData: googleWithData.length
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('❌ Erro na edge function:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
