import { createSupabaseClient } from "./database.ts";

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

// Renovação de tokens do Google Ads
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

// Buscar dados do Meta Ads com detalhes de cada campanha
async function fetchMetaActiveCampaigns(accessToken: string, accountId: string): Promise<{ 
  cost: number; 
  impressions: number; 
  activeCampaigns: number;
  campaignsDetailed: Array<{
    id: string;
    name: string;
    cost: number;
    impressions: number;
    status: string;
  }>;
}> {
  try {
    const today = getTodayInBrazil();
    console.log(`🔍 DEBUG Meta: Iniciando busca de campanhas para conta ${accountId} - Data: ${today}`);
    
    // Buscar todas as campanhas com paginação
    let allCampaigns: any[] = [];
    let nextUrl = `https://graph.facebook.com/v22.0/act_${accountId}/campaigns?fields=id,name,effective_status&limit=1000&access_token=${accessToken}`;
    let pageCount = 0;
    
    while (nextUrl && pageCount < 10) {
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
      
      allCampaigns = allCampaigns.concat(campaignsData.data);
      console.log(`📊 Meta: Página ${pageCount} - ${campaignsData.data.length} campanhas encontradas`);
      
      nextUrl = campaignsData.paging?.next || null;
      
      if (!nextUrl) {
        console.log(`✅ Meta: Todas as páginas processadas - Total: ${allCampaigns.length} campanhas`);
        break;
      }
    }
    
    console.log(`📋 DEBUG Meta: Campanhas encontradas:`, allCampaigns.map(c => ({ id: c.id, name: c.name, status: c.effective_status })));
    
    // Filtrar campanhas ativas
    const activeCampaigns = allCampaigns.filter((campaign: any) => 
      campaign.effective_status === 'ACTIVE'
    );
    
    console.log(`📈 Meta: ${activeCampaigns.length} campanhas ativas de ${allCampaigns.length} total`);
    
    if (activeCampaigns.length === 0) {
      console.log(`⚠️ DEBUG Meta: Nenhuma campanha ativa encontrada`);
      return { 
        cost: 0, 
        impressions: 0, 
        activeCampaigns: 0,
        campaignsDetailed: []
      };
    }
    
    // Buscar insights detalhados para cada campanha ativa
    console.log(`💰 Meta: Buscando insights detalhados para ${activeCampaigns.length} campanhas ativas`);
    const campaignsDetailed = [];
    let totalCost = 0;
    let totalImpressions = 0;
    
    // Processar campanhas em lotes para evitar muitas requisições simultâneas
    const batchSize = 10;
    for (let i = 0; i < activeCampaigns.length; i += batchSize) {
      const batch = activeCampaigns.slice(i, i + batchSize);
      const batchPromises = batch.map(async (campaign: any) => {
        try {
          const campaignInsightsUrl = `https://graph.facebook.com/v22.0/${campaign.id}/insights?fields=spend,impressions&time_range={"since":"${today}","until":"${today}"}&access_token=${accessToken}`;
          
          console.log(`🔍 DEBUG Meta: Buscando insights para campanha ${campaign.id} (${campaign.name})`);
          
          const response = await fetch(campaignInsightsUrl);
          const data = await response.json();
          
          let campaignCost = 0;
          let campaignImpressions = 0;
          
          if (response.ok && data.data && Array.isArray(data.data) && data.data.length > 0) {
            const insights = data.data[0];
            campaignCost = parseFloat(insights.spend || '0');
            campaignImpressions = parseInt(insights.impressions || '0');
            console.log(`📊 DEBUG Meta: Campanha ${campaign.name} - Custo: ${campaignCost}, Impressões: ${campaignImpressions}`);
          } else {
            console.warn(`⚠️ DEBUG Meta: Sem insights para campanha ${campaign.name}:`, data);
          }
          
          const campaignDetail = {
            id: campaign.id,
            name: campaign.name,
            cost: campaignCost,
            impressions: campaignImpressions,
            status: campaign.effective_status
          };
          
          console.log(`📋 DEBUG Meta: Detalhes da campanha processada:`, campaignDetail);
          
          return campaignDetail;
        } catch (error) {
          console.error(`❌ Meta: Erro ao buscar insights da campanha ${campaign.id}:`, error);
          return {
            id: campaign.id,
            name: campaign.name,
            cost: 0,
            impressions: 0,
            status: campaign.effective_status
          };
        }
      });
      
      const batchResults = await Promise.all(batchPromises);
      campaignsDetailed.push(...batchResults);
      
      // Pequeno delay entre lotes
      if (i + batchSize < activeCampaigns.length) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }
    
    // Calcular totais
    campaignsDetailed.forEach(campaign => {
      totalCost += campaign.cost;
      totalImpressions += campaign.impressions;
    });
    
    console.log(`💰 Meta: Custo total R$${totalCost.toFixed(2)}, Impressões totais: ${totalImpressions.toLocaleString()}`);
    console.log(`📊 Meta: Processadas ${campaignsDetailed.length} campanhas com detalhes`);
    console.log(`📋 DEBUG Meta: Campanhas detalhadas finais:`, campaignsDetailed);
    
    return {
      cost: totalCost,
      impressions: totalImpressions,
      activeCampaigns: activeCampaigns.length,
      campaignsDetailed
    };
    
  } catch (error) {
    console.error(`❌ Meta: Erro para conta ${accountId}:`, error);
    return { 
      cost: 0, 
      impressions: 0, 
      activeCampaigns: 0,
      campaignsDetailed: []
    };
  }
}

// Buscar dados do Google Ads com detalhes de cada campanha
async function fetchGoogleActiveCampaigns(clientCustomerId: string, supabase: any): Promise<{ 
  cost: number; 
  impressions: number; 
  activeCampaigns: number;
  campaignsDetailed: Array<{
    id: string;
    name: string;
    cost: number;
    impressions: number;
    status: string;
  }>;
}> {
  try {
    const accessToken = await manageGoogleAdsTokens(supabase);
    
    const { data: tokensData, error: tokensError } = await supabase
      .from('api_tokens')
      .select('name, value')
      .in('name', ['google_ads_developer_token', 'google_ads_manager_id']);

    if (tokensError) {
      console.error(`❌ Google: Erro ao buscar tokens:`, tokensError);
      return { 
        cost: 0, 
        impressions: 0, 
        activeCampaigns: 0,
        campaignsDetailed: []
      };
    }

    const tokens: { [key: string]: string } = {};
    tokensData.forEach(token => {
      tokens[token.name] = token.value;
    });

    const developerToken = tokens['google_ads_developer_token'];
    const managerId = tokens['google_ads_manager_id'];

    if (!developerToken) {
      return { 
        cost: 0, 
        impressions: 0, 
        activeCampaigns: 0,
        campaignsDetailed: []
      };
    }

    const today = getTodayForGoogleAds();
    console.log(`🔍 DEBUG Google: Iniciando busca para conta ${clientCustomerId} - Data: ${today}`);
    
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
    
    const googleAdsUrl = `https://googleads.googleapis.com/v21/customers/${clientCustomerId}/googleAds:search`;
    
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
      return { 
        cost: 0, 
        impressions: 0, 
        activeCampaigns: 0,
        campaignsDetailed: []
      };
    }
    
    const data = await response.json();
    
    if (!data.results || !Array.isArray(data.results)) {
      console.log(`⚠️ DEBUG Google: Sem resultados encontrados`);
      return { 
        cost: 0, 
        impressions: 0, 
        activeCampaigns: 0,
        campaignsDetailed: []
      };
    }
    
    console.log(`📋 DEBUG Google: Resultados encontrados:`, data.results.length);
    
    let totalCost = 0;
    let totalImpressions = 0;
    let activeCampaigns = 0;
    const campaignsDetailed = [];
    
    data.results.forEach((result: any) => {
      if (result.campaign?.status === 'ENABLED') {
        activeCampaigns++;
        const campaignCost = (result.metrics?.costMicros || 0) / 1000000;
        const campaignImpressions = result.metrics?.impressions || 0;
        
        totalCost += campaignCost;
        totalImpressions += parseInt(campaignImpressions);
        
        const campaignDetail = {
          id: result.campaign.id.toString(),
          name: result.campaign.name || 'Campanha sem nome',
          cost: campaignCost,
          impressions: parseInt(campaignImpressions),
          status: result.campaign.status
        };
        
        console.log(`📊 DEBUG Google: Campanha ${campaignDetail.name} - Custo: ${campaignCost}, Impressões: ${campaignImpressions}`);
        
        campaignsDetailed.push(campaignDetail);
      }
    });
    
    console.log(`💰 Google: Custo total R$${totalCost.toFixed(2)}, Impressões totais: ${totalImpressions.toLocaleString()}`);
    console.log(`📊 Google: Processadas ${campaignsDetailed.length} campanhas com detalhes`);
    console.log(`📋 DEBUG Google: Campanhas detalhadas finais:`, campaignsDetailed);
    
    return {
      cost: totalCost,
      impressions: totalImpressions,
      activeCampaigns: activeCampaigns,
      campaignsDetailed
    };
    
  } catch (error) {
    console.error(`❌ Google: Erro para conta ${clientCustomerId}:`, error);
    return { 
      cost: 0, 
      impressions: 0, 
      activeCampaigns: 0,
      campaignsDetailed: []
    };
  }
}

export async function processAccountHealth(accountId: string) {
  const processStartTime = Date.now();
  console.log(`🏥 [ACCOUNT-HEALTH] INICIANDO processamento de health para conta ${accountId}`);
  
  const supabase = createSupabaseClient();
  
  try {
    console.log(`🔍 Processando conta individual: ${accountId}`);

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
      .eq('id', accountId)
      .eq('status', 'active')
      .eq('clients.status', 'active')
      .maybeSingle();

    if (accountError || !account) {
      throw new Error(`Conta não encontrada: ${accountId}`);
    }

    console.log(`📊 Processando ${account.platform}: ${account.account_name}`);
    
    let campaignData = { 
      cost: 0, 
      impressions: 0, 
      activeCampaigns: 0,
      campaignsDetailed: []
    };
    
    if (account.platform === 'meta') {
      campaignData = await fetchMetaActiveCampaigns(metaToken.value, account.account_id);
    } else if (account.platform === 'google') {
      campaignData = await fetchGoogleActiveCampaigns(account.account_id, supabase);
    }
    
    const today = getTodayInBrazil();
    
    // Calcular campanhas sem veiculação baseado em impressões = 0 AND custo = 0
    const unservedCampaigns = campaignData.campaignsDetailed.filter(campaign => 
      campaign.impressions === 0 && campaign.cost === 0
    ).length;

    const healthSnapshot = {
      client_id: account.client_id,
      account_id: account.id,
      snapshot_date: today,
      platform: account.platform,
      has_account: true,
      active_campaigns_count: campaignData.activeCampaigns,
      unserved_campaigns_count: unservedCampaigns,
      cost_today: campaignData.cost,
      impressions_today: campaignData.impressions,
      campaigns_detailed: campaignData.campaignsDetailed
    };

    console.log(`💾 Salvando snapshot:`, {
      client: account.clients.company_name,
      platform: account.platform,
      campaigns: campaignData.activeCampaigns,
      unserved: unservedCampaigns,
      cost: `R$ ${campaignData.cost.toFixed(2)}`,
      impressions: campaignData.impressions.toLocaleString()
    });

    const { error: upsertError } = await supabase
      .from('campaign_health')
      .upsert(healthSnapshot, {
        onConflict: 'client_id,account_id,snapshot_date',
        ignoreDuplicates: false
      });

    if (upsertError) {
      console.error(`❌ Erro ao salvar snapshot:`, upsertError);
      throw new Error(`Erro ao salvar snapshot: ${upsertError.message}`);
    }

    const totalTime = Date.now() - processStartTime;
    console.log(`🎉 [ACCOUNT-HEALTH] PROCESSAMENTO CONCLUÍDO (${totalTime}ms)`);

    return {
      success: true,
      data: {
        account: {
          id: account.id,
          name: account.account_name,
          platform: account.platform
        },
        client: {
          id: account.client_id,
          name: account.clients.company_name
        },
        snapshot: {
          date: today,
          activeCampaigns: campaignData.activeCampaigns,
          unservedCampaigns: unservedCampaigns,
          cost: campaignData.cost,
          impressions: campaignData.impressions
        },
        processing_time: totalTime
      }
    };

  } catch (error) {
    const totalTime = Date.now() - processStartTime;
    console.error(`❌ [ACCOUNT-HEALTH] ERRO NO PROCESSAMENTO (${totalTime}ms):`, error);
    return { success: false, error: error.message };
  }
}