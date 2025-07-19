import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.48.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Função para obter a data atual no timezone brasileiro
function getTodayInBrazil(): string {
  const now = new Date();
  const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);
  const brazilTime = new Date(utcTime + (-3 * 3600000));
  
  const year = brazilTime.getFullYear();
  const month = String(brazilTime.getMonth() + 1).padStart(2, '0');
  const day = String(brazilTime.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

function getTodayForGoogleAds(): string {
  return getTodayInBrazil().replace(/-/g, '');
}

// Renovação de tokens do Google Ads (reutilizada da função original)
async function manageGoogleAdsTokens(supabase: any): Promise<string> {
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
    return tokens['google_ads_access_token'];
  }

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

  return newAccessToken;
}

// Buscar dados do Meta Ads com paginação completa
async function fetchMetaActiveCampaigns(accessToken: string, accountId: string): Promise<{ cost: number; impressions: number; activeCampaigns: number }> {
  try {
    const today = getTodayInBrazil();
    console.log(`📊 Meta: Iniciando busca de campanhas para conta ${accountId}`);
    
    // Buscar todas as campanhas com paginação
    let allCampaigns: any[] = [];
    let nextUrl = `https://graph.facebook.com/v22.0/act_${accountId}/campaigns?fields=id,name,effective_status&limit=1000&access_token=${accessToken}`;
    let pageCount = 0;
    
    while (nextUrl && pageCount < 10) { // Limite de segurança para evitar loops infinitos
      pageCount++;
      console.log(`📄 Meta: Buscando página ${pageCount} de campanhas`);
      
      const campaignsResponse = await fetch(nextUrl);
      const campaignsData = await campaignsResponse.json();
      
      if (!campaignsResponse.ok || campaignsData.error) {
        console.error(`❌ Meta: Erro ao buscar campanhas página ${pageCount}:`, campaignsData.error || campaignsResponse.status);
        break;
      }
      
      if (!campaignsData.data || !Array.isArray(campaignsData.data)) {
        console.log(`⚠️ Meta: Página ${pageCount} sem dados válidos`);
        break;
      }
      
      // Adicionar campanhas desta página
      allCampaigns = allCampaigns.concat(campaignsData.data);
      console.log(`📊 Meta: Página ${pageCount} - ${campaignsData.data.length} campanhas encontradas`);
      
      // Verificar se há próxima página
      nextUrl = campaignsData.paging?.next || null;
      
      if (!nextUrl) {
        console.log(`✅ Meta: Todas as páginas processadas - Total: ${allCampaigns.length} campanhas`);
        break;
      }
    }
    
    if (pageCount >= 10) {
      console.warn(`⚠️ Meta: Limite de páginas atingido (10) para conta ${accountId}`);
    }
    
    // Filtrar campanhas ativas
    const activeCampaigns = allCampaigns.filter((campaign: any) => 
      campaign.effective_status === 'ACTIVE'
    );
    
    console.log(`📈 Meta: ${activeCampaigns.length} campanhas ativas de ${allCampaigns.length} total`);
    
    if (activeCampaigns.length === 0) {
      return { cost: 0, impressions: 0, activeCampaigns: 0 };
    }
    
    // Buscar insights para hoje
    console.log(`💰 Meta: Buscando insights para ${activeCampaigns.length} campanhas ativas`);
    const insightsUrl = `https://graph.facebook.com/v22.0/act_${accountId}/insights?fields=spend,impressions&time_range={"since":"${today}","until":"${today}"}&access_token=${accessToken}`;
    
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
      console.log(`💰 Meta: Custo hoje R$${totalCost.toFixed(2)}, Impressões: ${totalImpressions.toLocaleString()}`);
    } else {
      console.log(`📊 Meta: Sem insights para hoje - campanhas podem não ter veiculado ainda`);
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

    const { accountId: requestAccountId } = await req.json();

    if (!requestAccountId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Account ID is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    console.log(`🔍 Processando conta individual: ${requestAccountId}`);

    // Buscar token do Meta Ads
    const { data: metaToken } = await supabase
      .from('api_tokens')
      .select('value')
      .eq('name', 'meta_access_token')
      .maybeSingle();

    if (!metaToken?.value) {
      throw new Error('Token Meta Ads não configurado');
    }

    // Buscar dados da conta específica
    const { data: account, error: accountError } = await supabase
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
      .eq('id', requestAccountId)
      .eq('status', 'active')
      .eq('clients.status', 'active')
      .maybeSingle();

    if (accountError || !account) {
      throw new Error(`Conta não encontrada: ${requestAccountId}`);
    }

    console.log(`📊 Processando ${account.platform}: ${account.account_name}`);
    
    let campaignData = { cost: 0, impressions: 0, activeCampaigns: 0 };
    
    if (account.platform === 'meta') {
      campaignData = await fetchMetaActiveCampaigns(metaToken.value, account.account_id);
    } else if (account.platform === 'google') {
      campaignData = await fetchGoogleActiveCampaigns(account.account_id, supabase);
    }
    
    const today = getTodayInBrazil();
    const unservedCampaigns = campaignData.activeCampaigns > 0 && campaignData.cost === 0 ? campaignData.activeCampaigns : 0;

    const healthSnapshot = {
      client_id: account.client_id,
      account_id: account.id,
      snapshot_date: today,
      platform: account.platform,
      has_account: true,
      active_campaigns_count: campaignData.activeCampaigns,
      unserved_campaigns_count: unservedCampaigns,
      cost_today: campaignData.cost,
      impressions_today: campaignData.impressions
    };

    // Salvar dados
    const { error: upsertError } = await supabase
      .from('campaign_health')
      .upsert(healthSnapshot, { 
        onConflict: 'account_id,snapshot_date',
        ignoreDuplicates: false 
      });

    if (upsertError) {
      console.error('❌ Erro ao salvar dados:', upsertError);
      throw upsertError;
    }

    console.log(`✅ ${account.platform.toUpperCase()}: Campanhas=${campaignData.activeCampaigns}, Custo=R$${campaignData.cost.toFixed(2)}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: healthSnapshot,
        accountName: account.account_name,
        clientName: account.clients.company_name,
        platform: account.platform,
        timestamp: new Date().toISOString()
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
