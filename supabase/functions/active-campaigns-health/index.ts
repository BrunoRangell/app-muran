import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.48.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CampaignHealthData {
  client_id: string;
  account_id: string;
  snapshot_date: string;
  platform: 'meta' | 'google';
  has_account: boolean;
  active_campaigns_count: number;
  unserved_campaigns_count: number;
  cost_today: number;
  impressions_today: number;
}

// Função para obter a data atual no timezone brasileiro
function getTodayInBrazil(): string {
  const now = new Date();
  const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);
  const brazilTime = new Date(utcTime + (-3 * 3600000));
  
  const year = brazilTime.getFullYear();
  const month = String(brazilTime.getMonth() + 1).padStart(2, '0');
  const day = String(brazilTime.getDate()).padStart(2, '0');
  
  const result = `${year}-${month}-${day}`;
  console.log(`🇧🇷 Data atual no timezone brasileiro: ${result}`);
  return result;
}

function getTodayForGoogleAds(): string {
  return getTodayInBrazil().replace(/-/g, '');
}

// Renovação de tokens do Google Ads
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
    console.error('❌ Google Tokens: Erro ao buscar tokens:', tokensError);
    throw new Error('Falha ao buscar tokens do Google Ads.');
  }

  const tokens: { [key: string]: any } = {};
  tokensData.forEach((token: any) => {
    tokens[token.name] = token.value;
  });

  const expiresAt = parseInt(tokens['google_ads_token_expires_at'] || '0');
  const fiveMinutesInMs = 5 * 60 * 1000;

  if (expiresAt > Date.now() + fiveMinutesInMs) {
    console.log('✅ Google Token: Token ainda válido.');
    return tokens['google_ads_access_token'];
  }

  console.log('⚠️ Google Token: Renovando token...');
  
  const {
    google_ads_refresh_token: refreshToken,
    google_ads_client_id: clientId,
    google_ads_client_secret: clientSecret
  } = tokens;

  if (!refreshToken || !clientId || !clientSecret) {
    throw new Error('Configuração para renovação de token incompleta.');
  }

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
    console.error('❌ Google Tokens: Falha ao renovar token:', data);
    throw new Error(`Erro ao renovar token: ${data.error_description || data.error}`);
  }

  const newAccessToken = data.access_token;
  const newExpiresAt = Date.now() + ((data.expires_in - 60) * 1000);

  await supabase
    .from('api_tokens')
    .upsert([
      { name: 'google_ads_access_token', value: newAccessToken },
      { name: 'google_ads_token_expires_at', value: newExpiresAt.toString() }
    ], { onConflict: 'name', ignoreDuplicates: false });

  console.log('✅ Google Token: Token renovado com sucesso!');
  return newAccessToken;
}

// Buscar dados do Meta Ads
async function fetchMetaActiveCampaigns(accessToken: string, accountId: string): Promise<{ cost: number; impressions: number; activeCampaigns: number }> {
  try {
    const today = getTodayInBrazil();
    console.log(`🔍 Meta: Buscando campanhas para conta ${accountId} na data ${today}`);
    
    const campaignsUrl = `https://graph.facebook.com/v18.0/act_${accountId}/campaigns?fields=id,name,effective_status&access_token=${accessToken}`;
    
    const campaignsResponse = await fetch(campaignsUrl);
    const campaignsData = await campaignsResponse.json();
    
    if (!campaignsResponse.ok || campaignsData.error) {
      console.error(`❌ Meta: Erro ao buscar campanhas:`, campaignsData.error || campaignsResponse.status);
      return { cost: 0, impressions: 0, activeCampaigns: 0 };
    }
    
    if (!campaignsData.data || !Array.isArray(campaignsData.data)) {
      console.log(`⚠️ Meta: Nenhuma campanha encontrada para conta ${accountId}`);
      return { cost: 0, impressions: 0, activeCampaigns: 0 };
    }
    
    const activeCampaigns = campaignsData.data.filter((campaign: any) => 
      campaign.effective_status === 'ACTIVE'
    );
    
    console.log(`✅ Meta: ${activeCampaigns.length} campanhas ativas encontradas`);
    
    if (activeCampaigns.length === 0) {
      return { cost: 0, impressions: 0, activeCampaigns: 0 };
    }
    
    const insightsUrl = `https://graph.facebook.com/v18.0/act_${accountId}/insights?fields=spend,impressions&time_range={"since":"${today}","until":"${today}"}&access_token=${accessToken}`;
    
    const insightsResponse = await fetch(insightsUrl);
    const insightsData = await insightsResponse.json();
    
    if (!insightsResponse.ok || insightsData.error) {
      console.error(`❌ Meta: Erro ao buscar insights:`, insightsData.error || insightsResponse.status);
      return { cost: 0, impressions: 0, activeCampaigns: activeCampaigns.length };
    }
    
    let totalCost = 0;
    let totalImpressions = 0;
    
    if (insightsData.data && Array.isArray(insightsData.data) && insightsData.data.length > 0) {
      const todayInsights = insightsData.data[0];
      totalCost = parseFloat(todayInsights.spend || '0');
      totalImpressions = parseInt(todayInsights.impressions || '0');
      
      console.log(`💰 Meta: Custo: R$ ${totalCost}, Impressões: ${totalImpressions}`);
    }
    
    return {
      cost: totalCost,
      impressions: totalImpressions,
      activeCampaigns: activeCampaigns.length
    };
    
  } catch (error) {
    console.error(`❌ Meta: Erro para conta ${accountId}:`, error);
    return { cost: 0, impressions: 0, activeCampaigns: 0 };
  }
}

// Buscar dados do Google Ads
async function fetchGoogleActiveCampaigns(clientCustomerId: string, supabase: any): Promise<{ cost: number; impressions: number; activeCampaigns: number }> {
  try {
    console.log(`🔍 Google: Buscando campanhas para conta ${clientCustomerId}`);
    
    const accessToken = await manageGoogleAdsTokens(supabase);
    
    const { data: tokensData, error: tokensError } = await supabase
      .from('api_tokens')
      .select('name, value')
      .in('name', ['google_ads_developer_token', 'google_ads_manager_id']);

    if (tokensError) {
      console.error(`❌ Google: Erro ao buscar tokens:`, tokensError);
      return { cost: 0, impressions: 0, activeCampaigns: 0 };
    }

    const tokens: { [key: string]: string } = {};
    tokensData.forEach(token => {
      tokens[token.name] = token.value;
    });

    const developerToken = tokens['google_ads_developer_token'];
    const managerId = tokens['google_ads_manager_id'];

    if (!developerToken) {
      console.log(`⚠️ Google: Developer token não encontrado`);
      return { cost: 0, impressions: 0, activeCampaigns: 0 };
    }

    const today = getTodayForGoogleAds();
    
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
    
    const googleAdsUrl = `https://googleads.googleapis.com/v20/customers/${clientCustomerId}/googleAds:search`;
    
    const headers: { [key: string]: string } = {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'developer-token': developerToken
    };

    if (managerId && managerId.trim() !== '') {
      headers['login-customer-id'] = managerId;
    }
    
    const response = await fetch(googleAdsUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({ query })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Google: Erro HTTP ${response.status}:`, errorText.substring(0, 500));
      return { cost: 0, impressions: 0, activeCampaigns: 0 };
    }
    
    const data = await response.json();
    
    if (!data.results || !Array.isArray(data.results)) {
      console.log(`⚠️ Google: Nenhum resultado encontrado para ${clientCustomerId}`);
      return { cost: 0, impressions: 0, activeCampaigns: 0 };
    }
    
    let totalCost = 0;
    let totalImpressions = 0;
    let activeCampaigns = 0;
    
    data.results.forEach((result: any) => {
      if (result.campaign?.status === 'ENABLED') {
        activeCampaigns++;
        const campaignCost = (result.metrics?.costMicros || 0) / 1000000;
        const campaignImpressions = result.metrics?.impressions || 0;
        
        totalCost += campaignCost;
        totalImpressions += parseInt(campaignImpressions);
      }
    });
    
    console.log(`✅ Google: ${activeCampaigns} campanhas ativas, Custo: R$ ${totalCost.toFixed(2)}, Impressões: ${totalImpressions}`);
    
    return {
      cost: totalCost,
      impressions: totalImpressions,
      activeCampaigns: activeCampaigns
    };
    
  } catch (error) {
    console.error(`❌ Google: Erro para conta ${clientCustomerId}:`, error);
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

    console.log('🔍 NOVA ESTRUTURA: Iniciando busca de saúde de campanhas com tabela unificada...');

    const today = getTodayInBrazil();

    // 🧹 LIMPEZA INTELIGENTE: Remover apenas dados antigos, preservar dados válidos de hoje
    console.log(`🧹 Iniciando limpeza inteligente de dados antigos...`);
    
    // 1. Verificar se já existem dados válidos de hoje
    const { data: existingTodayData, error: checkError } = await supabase
      .from('campaign_health')
      .select('id, account_id, created_at')
      .eq('snapshot_date', today);

    if (checkError) {
      console.error('❌ Erro ao verificar dados existentes:', checkError);
    } else {
      console.log(`📊 Dados existentes de hoje: ${existingTodayData?.length || 0} registros`);
    }

    // 2. Remover APENAS dados anteriores a hoje (preservar dados de hoje)
    console.log(`🗑️ Removendo dados anteriores a ${today}...`);
    const { error: deleteOldError, count: deletedOldCount } = await supabase
      .from('campaign_health')
      .delete({ count: 'exact' })
      .lt('snapshot_date', today);

    if (deleteOldError) {
      console.error('❌ ERRO ao limpar dados de dias anteriores:', deleteOldError);
    } else {
      console.log(`✅ Dados de dias anteriores removidos: ${deletedOldCount || 0} registros`);
    }

    // 3. Se já existem dados de hoje e não é forçada a atualização, pular geração
    const forceRefresh = req.headers.get('x-force-refresh') === 'true';
    if (existingTodayData && existingTodayData.length > 0 && !forceRefresh) {
      console.log(`⚠️ DADOS JÁ EXISTEM para hoje (${existingTodayData.length} registros). Use x-force-refresh: true para forçar nova geração.`);
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          data: existingTodayData,
          message: `Dados já existem para ${today}`,
          existing_records: existingTodayData.length,
          timestamp: new Date().toISOString(),
          brazil_date: today,
          skipped_generation: true
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      );
    }

    // 4. Se forçar refresh, remover dados de hoje antes de gerar novos
    if (forceRefresh && existingTodayData && existingTodayData.length > 0) {
      console.log(`🔄 FORCE REFRESH: Removendo ${existingTodayData.length} registros de hoje para gerar novos...`);
      const { error: deleteTodayError } = await supabase
        .from('campaign_health')
        .delete()
        .eq('snapshot_date', today);
      
      if (deleteTodayError) {
        console.error('❌ Erro ao limpar dados de hoje:', deleteTodayError);
      }
    }

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

    // NOVA ESTRUTURA: Buscar todas as contas ativas da tabela unificada
    const { data: accounts, error: accountsError } = await supabase
      .from('client_accounts')
      .select(`
        id,
        client_id,
        platform,
        account_id,
        account_name,
        is_primary,
        clients!inner(
          id,
          company_name,
          status
        )
      `)
      .eq('status', 'active')
      .eq('clients.status', 'active')
      .order('client_id')
      .order('platform')
      .order('is_primary', { ascending: false });

    if (accountsError) {
      console.error('❌ Erro ao buscar contas da nova estrutura:', accountsError);
      throw accountsError;
    }

    console.log(`✅ Nova estrutura: Encontradas ${accounts?.length || 0} contas ativas`);

    const healthData: CampaignHealthData[] = [];

    // Processar cada conta individualmente
    for (const account of accounts || []) {
      console.log(`\n📊 Processando conta ${account.platform}: ${account.account_id} (${account.account_name})`);
      
      let campaignData = { cost: 0, impressions: 0, activeCampaigns: 0 };
      
      if (account.platform === 'meta') {
        campaignData = await fetchMetaActiveCampaigns(metaToken.value, account.account_id);
      } else if (account.platform === 'google') {
        campaignData = await fetchGoogleActiveCampaigns(account.account_id, supabase);
      }
      
      console.log(`✅ ${account.platform.toUpperCase()}: Campanhas=${campaignData.activeCampaigns}, Custo=R$${campaignData.cost.toFixed(2)}, Impressões=${campaignData.impressions}`);

      // Calcular campanhas sem veiculação
      const unservedCampaigns = campaignData.activeCampaigns > 0 && campaignData.cost === 0 ? campaignData.activeCampaigns : 0;

      const healthSnapshot: CampaignHealthData = {
        client_id: account.client_id,
        account_id: account.id,
        snapshot_date: today,
        platform: account.platform as 'meta' | 'google',
        has_account: true,
        active_campaigns_count: campaignData.activeCampaigns,
        unserved_campaigns_count: unservedCampaigns,
        cost_today: campaignData.cost,
        impressions_today: campaignData.impressions
      };

      healthData.push(healthSnapshot);
    }

    // Salvar dados na nova tabela unificada
    console.log(`\n💾 NOVA ESTRUTURA: Salvando ${healthData.length} snapshots na tabela campaign_health...`);
    
    const { error: upsertError } = await supabase
      .from('campaign_health')
      .upsert(healthData, { 
        onConflict: 'account_id,snapshot_date',
        ignoreDuplicates: false 
      });

    if (upsertError) {
      console.error('❌ Erro ao salvar na nova estrutura:', upsertError);
      throw upsertError;
    }

    console.log('✅ NOVA ESTRUTURA: Dados salvos com sucesso na tabela unificada!');

    // Estatísticas finais
    const metaAccounts = healthData.filter(d => d.platform === 'meta');
    const googleAccounts = healthData.filter(d => d.platform === 'google');
    const accountsWithData = healthData.filter(d => d.cost_today > 0);
    const uniqueClients = new Set(healthData.map(d => d.client_id)).size;

    console.log(`\n📈 NOVA ESTRUTURA: Resumo dos dados processados:`);
    console.log(`📊 Total de snapshots: ${healthData.length} para ${today}`);
    console.log(`🟦 Contas Meta: ${metaAccounts.length}`);
    console.log(`🟥 Contas Google: ${googleAccounts.length}`);
    console.log(`💰 Contas com dados: ${accountsWithData.length} de ${healthData.length}`);
    console.log(`👥 Clientes únicos: ${uniqueClients}`);
    console.log(`🧹 Limpeza automática: mantendo apenas dados de ${today}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: healthData,
        timestamp: new Date().toISOString(),
        brazil_date: today,
        totalSnapshots: healthData.length,
        metaAccounts: metaAccounts.length,
        googleAccounts: googleAccounts.length,
        new_structure: true,
        auto_cleanup: true,
        debug: {
          accountsWithData: accountsWithData.length,
          uniqueClients: uniqueClients,
          timezone: 'America/Sao_Paulo',
          unified_structure: 'client_accounts + campaign_health tables',
          cleanup_enabled: 'automatic removal of old data'
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('❌ NOVA ESTRUTURA: Erro na edge function:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        timestamp: new Date().toISOString(),
        brazil_date: getTodayInBrazil(),
        new_structure: false,
        auto_cleanup: false
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
