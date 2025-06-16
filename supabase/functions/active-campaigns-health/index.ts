import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.48.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CampaignHealthSnapshot {
  client_id: string;
  snapshot_date: string;
  meta_account_id?: string;
  meta_account_name?: string;
  meta_has_account: boolean;
  meta_active_campaigns_count: number;
  meta_cost_today: number;
  meta_impressions_today: number;
  google_account_id?: string;
  google_account_name?: string;
  google_has_account: boolean;
  google_active_campaigns_count: number;
  google_cost_today: number;
  google_impressions_today: number;
}

// CORREÇÃO: Função para obter a data atual no timezone brasileiro
function getTodayInBrazil(): string {
  // Criar uma nova data com timezone brasileiro específico
  const now = new Date();
  
  // Obter timestamp UTC e ajustar para timezone brasileiro (UTC-3)
  const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);
  const brazilTime = new Date(utcTime + (-3 * 3600000)); // UTC-3 para Brasil
  
  // Formatação manual para YYYY-MM-DD
  const year = brazilTime.getFullYear();
  const month = String(brazilTime.getMonth() + 1).padStart(2, '0');
  const day = String(brazilTime.getDate()).padStart(2, '0');
  
  const result = `${year}-${month}-${day}`;
  console.log(`🇧🇷 Data atual no timezone brasileiro calculada: ${result}`);
  console.log(`🕐 Hora UTC original: ${now.toISOString()}`);
  console.log(`🕐 Hora Brasil calculada: ${brazilTime.toISOString()}`);
  
  return result;
}

// Função para obter a data no formato que o Google Ads espera (YYYYMMDD no timezone brasileiro)
function getTodayForGoogleAds(): string {
  return getTodayInBrazil().replace(/-/g, '');
}

// CORREÇÃO: Função melhorada para buscar dados do Meta Ads usando data brasileira
async function fetchMetaActiveCampaigns(accessToken: string, accountId: string): Promise<{ cost: number; impressions: number; activeCampaigns: number }> {
  try {
    // CORREÇÃO: Usar data do timezone brasileiro, não UTC
    const today = getTodayInBrazil();
    console.log(`🔍 Meta: Buscando campanhas para conta ${accountId} na data BRASILEIRA ${today}`);
    
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
    
    // CORREÇÃO: Segunda chamada usando data brasileira
    const insightsUrl = `https://graph.facebook.com/v18.0/act_${accountId}/insights?fields=spend,impressions&time_range={"since":"${today}","until":"${today}"}&access_token=${accessToken}`;
    console.log(`📡 Meta: Chamando URL de insights com data BRASILEIRA: ${insightsUrl.replace(accessToken, 'TOKEN_HIDDEN')}`);
    
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
      const todayInsights = insightsData.data[0];
      totalCost = parseFloat(todayInsights.spend || '0');
      totalImpressions = parseInt(todayInsights.impressions || '0');
      
      console.log(`💰 Meta: Custo hoje (data brasileira ${today}): R$ ${totalCost}, Impressões: ${totalImpressions}`);
    } else {
      console.log(`⚠️ Meta: Nenhum insight encontrado para hoje (data brasileira ${today})`);
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

// NOVA FUNÇÃO: Gerencia a renovação de tokens do Google Ads para garantir que estejam sempre válidos.
async function manageGoogleAdsTokens(supabase: any): Promise<string> {
  console.log('🔄 Iniciando gerenciamento de token do Google Ads...');

  const { data: tokensData, error: tokensError } = await supabase
    .from('api_tokens')
    .select('name, value')
    .in('name', [
      'google_ads_access_token',
      'google_ads_refresh_token',
      'google_ads_token_expires_at',
      'google_ads_client_id',
      'google_ads_client_secret'
    ]);

  if (tokensError) {
    console.error('❌ Google Tokens: Erro ao buscar tokens da base de dados:', tokensError);
    throw new Error('Falha ao buscar tokens do Google Ads da base de dados.');
  }

  const tokens: { [key: string]: any } = {};
  tokensData.forEach((token: any) => {
    tokens[token.name] = token.value;
  });

  const expiresAt = parseInt(tokens['google_ads_token_expires_at'] || '0');
  const fiveMinutesInMs = 5 * 60 * 1000;

  if (expiresAt > Date.now() + fiveMinutesInMs) {
    console.log('✅ Google Token: Token de acesso ainda é válido.');
    return tokens['google_ads_access_token'];
  }

  console.log('⚠️ Google Token: Token expirado ou prestes a expirar. Iniciando renovação...');
  
  const {
    google_ads_refresh_token: refreshToken,
    google_ads_client_id: clientId,
    google_ads_client_secret: clientSecret
  } = tokens;

  if (!refreshToken || !clientId || !clientSecret) {
    const missing = [
      !refreshToken && "'google_ads_refresh_token'",
      !clientId && "'google_ads_client_id'",
      !clientSecret && "'google_ads_client_secret'"
    ].filter(Boolean).join(', ');
    console.error(`❌ Google Tokens: Configuração para renovação de token incompleta. Faltando: ${missing}`);
    throw new Error(`Configuração para renovação de token do Google Ads está incompleta. Faltando: ${missing}.`);
  }

  try {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ Google Tokens: Falha ao renovar token. Resposta da API:', data);
      throw new Error(`Erro da API do Google ao renovar token: ${data.error_description || data.error || 'Erro desconhecido'}`);
    }

    const newAccessToken = data.access_token;
    const newExpiresAt = Date.now() + ((data.expires_in - 60) * 1000); // Reduz 1 minuto por segurança

    console.log('✅ Google Token: Token de acesso renovado com sucesso!');

    const { error: updateError } = await supabase
      .from('api_tokens')
      .upsert([
        { name: 'google_ads_access_token', value: newAccessToken },
        { name: 'google_ads_token_expires_at', value: newExpiresAt.toString() }
      ], { onConflict: 'name', ignoreDuplicates: false });

    if (updateError) {
      console.error('❌ Google Tokens: Erro ao salvar o novo token e expiração na base de dados:', updateError);
    } else {
      console.log('💾 Google Token: Token e data de expiração atualizados na base de dados.');
    }

    return newAccessToken;
  } catch (error) {
    console.error('❌ Google Tokens: Erro crítico durante o processo de renovação:', error);
    throw error;
  }
}

// Função CORRIGIDA para buscar dados do Google Ads (usando timezone brasileiro e renovação de token)
async function fetchGoogleActiveCampaigns(clientCustomerId: string, supabase: any): Promise<{ cost: number; impressions: number; activeCampaigns: number }> {
  try {
    console.log(`🔍 Google: Buscando campanhas para conta ${clientCustomerId}`);
    
    // ETAPA DE RENOVAÇÃO DE TOKEN ADICIONADA
    const accessToken = await manageGoogleAdsTokens(supabase);
    
    // Buscar outros tokens necessários (developer token, manager id)
    const { data: tokensData, error: tokensError } = await supabase
      .from('api_tokens')
      .select('name, value')
      .in('name', ['google_ads_developer_token', 'google_ads_manager_id']);

    if (tokensError) {
      console.error(`❌ Google: Erro ao buscar developer token e manager id:`, tokensError);
      return { cost: 0, impressions: 0, activeCampaigns: 0 };
    }

    if (!tokensData) {
      console.log(`⚠️ Google: Nenhum developer token ou manager id encontrado na tabela api_tokens`);
      return { cost: 0, impressions: 0, activeCampaigns: 0 };
    }

    const tokens: { [key: string]: string } = {};
    tokensData.forEach(token => {
      tokens[token.name] = token.value;
    });

    const developerToken = tokens['google_ads_developer_token'];
    const managerId = tokens['google_ads_manager_id'];

    if (!accessToken || !developerToken) {
      console.log(`⚠️ Google: Tokens necessários não encontrados (Access Token ou Developer Token)`);
      return { cost: 0, impressions: 0, activeCampaigns: 0 };
    }

    console.log(`✅ Google: Tokens prontos - Access: ${accessToken ? 'VÁLIDO' : 'NÃO'}, Developer: ${developerToken ? 'SIM' : 'NÃO'}, Manager: ${managerId || 'NÃO'}`);
    
    // Usar formato de data correto (YYYYMMDD sem hífens) no timezone brasileiro
    const today = getTodayForGoogleAds();
    
    // Query GAQL simplificada baseada no teste que funcionou
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
    
    console.log(`📡 Google: Executando query GAQL para ${clientCustomerId} na data ${today} (timezone brasileiro)`);
    console.log(`📋 Google: Query GAQL: ${query.trim()}`);
    
    // Usar endpoint v20 e search (não searchStream)
    const googleAdsUrl = `https://googleads.googleapis.com/v20/customers/${clientCustomerId}/googleAds:search`;
    
    const headers: { [key: string]: string } = {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'developer-token': developerToken
    };

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
      console.error(`❌ Google: Erro HTTP ${response.status}:`, errorText.substring(0, 500));
      return { cost: 0, impressions: 0, activeCampaigns: 0 };
    }
    
    const data = await response.json();
    console.log(`📋 Google: Resposta recebida:`, JSON.stringify(data, null, 2).substring(0, 500));
    
    if (!data.results || !Array.isArray(data.results)) {
      console.log(`⚠️ Google: Nenhum resultado encontrado para ${clientCustomerId}`);
      return { cost: 0, impressions: 0, activeCampaigns: 0 };
    }
    
    let totalCost = 0;
    let totalImpressions = 0;
    let activeCampaigns = 0;
    
    // Processar resultados usando a estrutura correta da v20
    data.results.forEach((result: any) => {
      if (result.campaign?.status === 'ENABLED') {
        activeCampaigns++;
        // Converter cost_micros para valor real (dividir por 1.000.000)
        const campaignCost = (result.metrics?.costMicros || 0) / 1000000;
        const campaignImpressions = result.metrics?.impressions || 0;
        
        totalCost += campaignCost;
        totalImpressions += parseInt(campaignImpressions);
        
        console.log(`📈 Google: Campanha ${result.campaign.name}: Custo=R$${campaignCost.toFixed(2)}, Impressões=${campaignImpressions}`);
      }
    });
    
    console.log(`✅ Google: RESUMO - ${activeCampaigns} campanhas ativas, Custo total: R$ ${totalCost.toFixed(2)}, Impressões totais: ${totalImpressions}`);
    
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
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('🔍 CORREÇÃO IMPLEMENTADA: Iniciando busca de saúde de campanhas ativas com timezone brasileiro correto...');

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

    // Buscar clientes ativos
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

    const today = getTodayInBrazil(); // CORREÇÃO: Usar função corrigida
    const snapshots: CampaignHealthSnapshot[] = [];

    console.log(`📅 CORREÇÃO: Processando dados para o dia CORRETO: ${today} (timezone brasileiro CORRIGIDO)`);

    // Processar cada cliente
    for (const client of clients || []) {
      console.log(`\n📊 Processando cliente: ${client.company_name}`);

      let metaData = { cost: 0, impressions: 0, activeCampaigns: 0 };
      let googleData = { cost: 0, impressions: 0, activeCampaigns: 0 };

      // Processar Meta Ads com função corrigida
      if (client.meta_account_id && client.meta_account_id.trim() !== '') {
        console.log(`🔄 CORREÇÃO: Processando Meta Ads para ${client.company_name} com data brasileira...`);
        metaData = await fetchMetaActiveCampaigns(metaToken.value, client.meta_account_id);
        console.log(`✅ Meta processado com data CORRIGIDA: Campanhas=${metaData.activeCampaigns}, Custo=R$${metaData.cost}, Impressões=${metaData.impressions}`);
      } else {
        console.log(`⚪ Meta não configurado para ${client.company_name}`);
      }

      // Processar Google Ads
      if (client.google_account_id && client.google_account_id.trim() !== '') {
        console.log(`🔄 Processando Google Ads para ${client.company_name}...`);
        googleData = await fetchGoogleActiveCampaigns(client.google_account_id, supabase);
        console.log(`✅ Google processado: Campanhas=${googleData.activeCampaigns}, Custo=R$${googleData.cost.toFixed(2)}, Impressões=${googleData.impressions}`);
      } else {
        console.log(`⚪ Google não configurado para ${client.company_name}`);
      }

      // Criar snapshot para este cliente
      const snapshot: CampaignHealthSnapshot = {
        client_id: client.id,
        snapshot_date: today, // CORREÇÃO: Usar data brasileira corrigida
        meta_account_id: client.meta_account_id || null,
        meta_account_name: client.meta_account_id ? `Meta Ads - ${client.meta_account_id}` : null,
        meta_has_account: !!(client.meta_account_id && client.meta_account_id.trim() !== ''),
        meta_active_campaigns_count: metaData.activeCampaigns,
        meta_cost_today: metaData.cost,
        meta_impressions_today: metaData.impressions,
        google_account_id: client.google_account_id || null,
        google_account_name: client.google_account_id ? `Google Ads - ${client.google_account_id}` : null,
        google_has_account: !!(client.google_account_id && client.google_account_id.trim() !== ''),
        google_active_campaigns_count: googleData.activeCampaigns,
        google_cost_today: googleData.cost,
        google_impressions_today: googleData.impressions
      };

      snapshots.push(snapshot);
    }

    // Salvar todos os snapshots na nova tabela
    console.log(`\n💾 CORREÇÃO: Salvando ${snapshots.length} snapshots para ${today} (timezone brasileiro CORRIGIDO)...`);
    
    // Usar upsert para evitar duplicatas
    const { error: upsertError } = await supabase
      .from('campaign_health_snapshots')
      .upsert(snapshots, { 
        onConflict: 'client_id,snapshot_date',
        ignoreDuplicates: false 
      });

    if (upsertError) {
      console.error('❌ Erro ao salvar snapshots:', upsertError);
      throw upsertError;
    }

    console.log('✅ CORREÇÃO: Snapshots salvos com sucesso com timezone brasileiro correto!');

    // Estatísticas finais
    const metaWithData = snapshots.filter(s => s.meta_cost_today > 0);
    const googleWithData = snapshots.filter(s => s.google_cost_today > 0);

    console.log(`\n📈 CORREÇÃO: Resumo dos dados processados com timezone brasileiro correto:`);
    console.log(`📊 Total de snapshots: ${snapshots.length} para ${today} (data CORRIGIDA)`);
    console.log(`🟦 Meta Ads: ${snapshots.length} registros (${metaWithData.length} com dados usando data CORRIGIDA)`);
    console.log(`🟥 Google Ads: ${snapshots.length} registros (${googleWithData.length} com dados)`);
    console.log(`👥 Clientes únicos: ${clients?.length || 0}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: snapshots,
        timestamp: new Date().toISOString(),
        brazil_date_corrected: today,
        totalClients: clients?.length || 0,
        totalSnapshots: snapshots.length,
        correction_applied: true,
        debug: {
          metaWithDataAfterCorrection: metaWithData.length,
          googleWithData: googleWithData.length,
          timezone: 'America/Sao_Paulo - CORRIGIDO'
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('❌ CORREÇÃO: Erro na edge function:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        timestamp: new Date().toISOString(),
        brazil_date_corrected: getTodayInBrazil(),
        correction_applied: false
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
