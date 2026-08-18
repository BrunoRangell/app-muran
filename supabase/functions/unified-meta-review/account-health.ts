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

// Data de ontem no timezone brasileiro (YYYY-MM-DD)
function getYesterdayInBrazil(): string {
  const now = new Date();
  const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);
  const brazilTime = new Date(utcTime + (-3 * 3600000));
  brazilTime.setDate(brazilTime.getDate() - 1);

  const year = brazilTime.getFullYear();
  const month = String(brazilTime.getMonth() + 1).padStart(2, '0');
  const day = String(brazilTime.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function getTodayForGoogleAds(): string {
  return getTodayInBrazil().replace(/-/g, '');
}

function getYesterdayForGoogleAds(): string {
  return getYesterdayInBrazil().replace(/-/g, '');
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

// Janela para cálculo de "dias sem veiculação"
const META_ZERO_STREAK_WINDOW_DAYS = 10;

function shiftIsoDate(dateStr: string, deltaDays: number): string {
  // dateStr esperado em YYYY-MM-DD
  const [y, m, d] = dateStr.split('-').map((n) => parseInt(n, 10));
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + deltaDays);
  const yyyy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(dt.getUTCDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
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
    cost_2d: number;
    impressions_2d: number;
    zero_days_streak: number;
    status: string;
  }>;
}> {

  try {
    const today = getTodayInBrazil();
    const yesterday = getYesterdayInBrazil();
    console.log(`🔍 DEBUG Meta: Iniciando busca de campanhas para conta ${accountId} - Hoje: ${today} | Ontem: ${yesterday}`);
    
    // Buscar todas as campanhas com paginação
    let allCampaigns: any[] = [];
    let nextUrl = `https://graph.facebook.com/v24.0/act_${accountId}/campaigns?fields=id,name,effective_status&limit=1000&access_token=${accessToken}`;
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
          const windowStart = shiftIsoDate(today, -META_ZERO_STREAK_WINDOW_DAYS);
          // Uma única chamada com breakdown diário cobre hoje + 10 dias anteriores
          const dailyUrl = `https://graph.facebook.com/v24.0/${campaign.id}/insights?fields=spend,impressions&time_range={"since":"${windowStart}","until":"${today}"}&time_increment=1&access_token=${accessToken}`;

          console.log(`🔍 DEBUG Meta: Buscando insights diários (${windowStart}..${today}) para campanha ${campaign.id} (${campaign.name})`);

          const respDaily = await fetch(dailyUrl);
          const dataDaily = await respDaily.json();

          let campaignCost = 0;
          let campaignImpressions = 0;
          let cost2d = 0;
          let impressions2d = 0;
          let zeroDaysStreak = 0;

          if (respDaily.ok && Array.isArray(dataDaily?.data)) {
            // Map por data: { 'YYYY-MM-DD': { cost, impressions } }
            const daily = new Map<string, { cost: number; impressions: number }>();
            for (const row of dataDaily.data) {
              const date = row.date_start || row.date_stop;
              if (!date) continue;
              daily.set(date, {
                cost: parseFloat(row.spend || '0'),
                impressions: parseInt(row.impressions || '0'),
              });
            }

            const todayEntry = daily.get(today);
            if (todayEntry) {
              campaignCost = todayEntry.cost;
              campaignImpressions = todayEntry.impressions;
            }
            const yesterdayEntry = daily.get(yesterday);
            cost2d = campaignCost + (yesterdayEntry?.cost ?? 0);
            impressions2d = campaignImpressions + (yesterdayEntry?.impressions ?? 0);

            // Calcular streak (a partir de ontem, andando para trás)
            for (let k = 1; k <= META_ZERO_STREAK_WINDOW_DAYS; k++) {
              const day = shiftIsoDate(today, -k);
              const d = daily.get(day);
              if (!d || (d.cost === 0 && d.impressions === 0)) {
                zeroDaysStreak++;
              } else {
                break;
              }
            }
          } else {
            console.warn(`⚠️ Meta: insights diários indisponíveis para ${campaign.id}`, JSON.stringify(dataDaily));
          }

          const campaignDetail = {
            id: campaign.id,
            name: campaign.name,
            cost: campaignCost,
            impressions: campaignImpressions,
            cost_2d: cost2d,
            impressions_2d: impressions2d,
            zero_days_streak: zeroDaysStreak,
            status: campaign.effective_status
          };

          console.log(`📋 Meta ${campaign.name}: hoje R$${campaignCost.toFixed(2)}/${campaignImpressions} | 2d R$${cost2d.toFixed(2)}/${impressions2d} | streak ${zeroDaysStreak}d`);
          return campaignDetail;
        } catch (error) {
          console.error(`❌ Meta: ERRO ao buscar insights da campanha ${campaign.id} (${campaign.name}): ${error.message}`);
          return {
            id: campaign.id,
            name: campaign.name,
            cost: 0,
            impressions: 0,
            cost_2d: 0,
            impressions_2d: 0,
            zero_days_streak: 0,
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

// Helper para deslocar YYYYMMDD em N dias
function shiftCompactDate(dateStr: string, deltaDays: number): string {
  const y = parseInt(dateStr.slice(0, 4), 10);
  const m = parseInt(dateStr.slice(4, 6), 10) - 1;
  const d = parseInt(dateStr.slice(6, 8), 10);
  const dt = new Date(Date.UTC(y, m, d));
  dt.setUTCDate(dt.getUTCDate() + deltaDays);
  const yyyy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(dt.getUTCDate()).padStart(2, '0');
  return `${yyyy}${mm}${dd}`;
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
    cost_2d: number;
    impressions_2d: number;
    zero_days_streak: number;
    status: string;
    primary_status?: string;
    primary_status_reasons?: string[];
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
      return { cost: 0, impressions: 0, activeCampaigns: 0, campaignsDetailed: [] };
    }

    const tokens: { [key: string]: string } = {};
    tokensData.forEach(token => { tokens[token.name] = token.value; });

    const developerToken = tokens['google_ads_developer_token'];
    const managerId = tokens['google_ads_manager_id'];

    if (!developerToken) {
      return { cost: 0, impressions: 0, activeCampaigns: 0, campaignsDetailed: [] };
    }

    const today = getTodayForGoogleAds(); // YYYYMMDD
    const yesterday = getYesterdayForGoogleAds(); // YYYYMMDD
    const windowStart = shiftCompactDate(today, -META_ZERO_STREAK_WINDOW_DAYS); // 10 dias atrás
    // Formato YYYY-MM-DD para o BETWEEN do GAQL
    const fmt = (s: string) => `${s.slice(0,4)}-${s.slice(4,6)}-${s.slice(6,8)}`;
    console.log(`🔍 DEBUG Google: Janela ${fmt(windowStart)}..${fmt(today)} (conta ${clientCustomerId})`);

    // Query 1: métricas diárias na janela de 10 dias
    const metricsQuery = `
      SELECT 
        campaign.id,
        campaign.name,
        campaign.status,
        campaign.primary_status,
        campaign.primary_status_reasons,
        segments.date,
        metrics.cost_micros,
        metrics.impressions
      FROM campaign 
      WHERE 
        campaign.status = 'ENABLED'
        AND segments.date BETWEEN '${fmt(windowStart)}' AND '${fmt(today)}'
    `;

    // Query 2: todas as campanhas ENABLED (mesmo sem rows na janela)
    const enabledQuery = `
      SELECT campaign.id, campaign.name, campaign.status, campaign.primary_status, campaign.primary_status_reasons
      FROM campaign
      WHERE campaign.status = 'ENABLED'
    `;

    const googleAdsUrl = `https://googleads.googleapis.com/v25/customers/${clientCustomerId}/googleAds:search`;

    const headers: { [key: string]: string } = {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'developer-token': developerToken
    };
    if (managerId && managerId.trim() !== '') headers['login-customer-id'] = managerId;

    const [respMetrics, respEnabled] = await Promise.all([
      fetch(googleAdsUrl, { method: 'POST', headers, body: JSON.stringify({ query: metricsQuery }) }),
      fetch(googleAdsUrl, { method: 'POST', headers, body: JSON.stringify({ query: enabledQuery }) }),
    ]);

    if (!respEnabled.ok) {
      const errorText = await respEnabled.text();
      console.error(`❌ Google: Erro HTTP ${respEnabled.status} (enabled):`, errorText.substring(0, 500));
      return { cost: 0, impressions: 0, activeCampaigns: 0, campaignsDetailed: [] };
    }
    if (!respMetrics.ok) {
      const errorText = await respMetrics.text();
      console.error(`❌ Google: Erro HTTP ${respMetrics.status} (metrics):`, errorText.substring(0, 500));
    }

    const enabledData = await respEnabled.json();
    const metricsData = respMetrics.ok ? await respMetrics.json() : { results: [] };

    // map com daily acumulado
    type Entry = {
      id: string; name: string; status: string; primary_status?: string; primary_status_reasons?: string[];
      cost: number; impressions: number; cost_2d: number; impressions_2d: number;
      zero_days_streak: number;
      _daily: Map<string, { cost: number; impressions: number }>;
    };
    const map = new Map<string, Entry>();

    (enabledData.results || []).forEach((r: any) => {
      if (!r.campaign) return;
      const id = r.campaign.id.toString();
      map.set(id, {
        id,
        name: r.campaign.name || 'Campanha sem nome',
        status: r.campaign.status || 'ENABLED',
        primary_status: r.campaign.primaryStatus || undefined,
        primary_status_reasons: Array.isArray(r.campaign.primaryStatusReasons) ? r.campaign.primaryStatusReasons : [],
        cost: 0, impressions: 0, cost_2d: 0, impressions_2d: 0,
        zero_days_streak: 0,
        _daily: new Map(),
      });
    });

    (metricsData.results || []).forEach((r: any) => {
      if (!r.campaign) return;
      const id = r.campaign.id.toString();
      const date = (r.segments?.date || '').replace(/-/g, ''); // YYYYMMDD
      const cost = (r.metrics?.costMicros || 0) / 1000000;
      const impressions = parseInt(r.metrics?.impressions || 0);

      let entry = map.get(id);
      if (!entry) {
        entry = {
          id,
          name: r.campaign.name || 'Campanha sem nome',
          status: r.campaign.status || 'ENABLED',
          primary_status: r.campaign.primaryStatus || undefined,
          primary_status_reasons: Array.isArray(r.campaign.primaryStatusReasons) ? r.campaign.primaryStatusReasons : [],
          cost: 0, impressions: 0, cost_2d: 0, impressions_2d: 0,
          zero_days_streak: 0,
          _daily: new Map(),
        };
        map.set(id, entry);
      }
      const prev = entry._daily.get(date) ?? { cost: 0, impressions: 0 };
      entry._daily.set(date, { cost: prev.cost + cost, impressions: prev.impressions + impressions });

      if (date === today || date === yesterday) {
        entry.cost_2d += cost;
        entry.impressions_2d += impressions;
      }
      if (date === today) {
        entry.cost += cost;
        entry.impressions += impressions;
      }
    });

    // Calcular streak
    for (const entry of map.values()) {
      let streak = 0;
      for (let k = 1; k <= META_ZERO_STREAK_WINDOW_DAYS; k++) {
        const day = shiftCompactDate(today, -k);
        const d = entry._daily.get(day);
        if (!d || (d.cost === 0 && d.impressions === 0)) {
          streak++;
        } else {
          break;
        }
      }
      entry.zero_days_streak = streak;
    }

    const campaignsDetailed = Array.from(map.values()).map(({ _daily, ...rest }) => rest);
    let totalCost = 0;
    let totalImpressions = 0;
    campaignsDetailed.forEach(c => {
      totalCost += c.cost;
      totalImpressions += c.impressions;
      console.log(`📊 Google ${c.name}: hoje R$${c.cost.toFixed(2)}/${c.impressions} | 2d R$${c.cost_2d.toFixed(2)}/${c.impressions_2d} | streak ${c.zero_days_streak}d`);
    });

    console.log(`💰 Google: Custo HOJE R$${totalCost.toFixed(2)}, Impressões HOJE: ${totalImpressions.toLocaleString()}`);
    console.log(`📊 Google: ${campaignsDetailed.length} campanhas ativas processadas`);

    return {
      cost: totalCost,
      impressions: totalImpressions,
      activeCampaigns: campaignsDetailed.length,
      campaignsDetailed,
    };

  } catch (error) {
    console.error(`❌ Google: Erro para conta ${clientCustomerId}:`, error);
    return { cost: 0, impressions: 0, activeCampaigns: 0, campaignsDetailed: [] };
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
    
    // Campanhas sem veiculação:
    //  - Meta: apenas HOJE (cost === 0 && impressions === 0)
    //  - Google: janela de 2 dias (ontem + hoje)
    const unservedCampaigns = campaignData.campaignsDetailed.filter((campaign: any) => {
      if (account.platform === 'meta') {
        const c = Number(campaign.cost ?? 0);
        const i = Number(campaign.impressions ?? 0);
        return c === 0 && i === 0;
      }
      const c2d = Number(campaign.cost_2d ?? 0);
      const i2d = Number(campaign.impressions_2d ?? 0);
      return c2d === 0 && i2d === 0;
    }).length;

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