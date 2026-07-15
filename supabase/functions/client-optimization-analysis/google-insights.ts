import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { TrafficInsightsResponse, CampaignInsight, TimeSeriesData, Demographics, TopAd } from "./types.ts";

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Renova o google_ads_access_token usando refresh_token quando próximo de expirar.
// Espelha a lógica de unified-meta-review/account-health.ts (manageGoogleAdsTokens).
async function getValidGoogleAccessToken(): Promise<string> {
  const { data: tokensData, error: tokensError } = await supabase
    .from('api_tokens')
    .select('name, value')
    .in('name', [
      'google_ads_access_token',
      'google_ads_refresh_token',
      'google_ads_token_expires_at',
      'google_ads_client_id',
      'google_ads_client_secret',
    ]);

  if (tokensError) {
    console.error('❌ [GOOGLE-TOKEN] Erro ao buscar tokens:', tokensError);
    throw new Error('Falha ao buscar tokens do Google Ads.');
  }

  const tokens: Record<string, string> = {};
  (tokensData || []).forEach((t: any) => { tokens[t.name] = t.value; });

  const expiresAt = parseInt(tokens['google_ads_token_expires_at'] || '0');
  const fiveMinutesMs = 5 * 60 * 1000;

  if (tokens['google_ads_access_token'] && expiresAt > Date.now() + fiveMinutesMs) {
    console.log('🔐 [GOOGLE-TOKEN] Token válido em cache, reutilizando');
    return tokens['google_ads_access_token'];
  }

  const refreshToken = tokens['google_ads_refresh_token'];
  const clientId = tokens['google_ads_client_id'];
  const clientSecret = tokens['google_ads_client_secret'];

  if (!refreshToken || !clientId || !clientSecret) {
    throw new Error(
      'Configuração do Google Ads incompleta: faltam refresh_token, client_id ou client_secret em api_tokens.'
    );
  }

  console.log('🔄 [GOOGLE-TOKEN] Renovando access_token via refresh_token');
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
    console.error('❌ [GOOGLE-TOKEN] Falha na renovação:', data?.error || data);
    throw new Error(`Erro ao renovar token Google Ads: ${data?.error_description || data?.error || 'desconhecido'}`);
  }

  const newAccessToken = data.access_token as string;
  const newExpiresAt = Date.now() + ((data.expires_in - 60) * 1000);

  await supabase.from('api_tokens').upsert([
    { name: 'google_ads_access_token', value: newAccessToken },
    { name: 'google_ads_token_expires_at', value: newExpiresAt.toString() },
  ], { onConflict: 'name', ignoreDuplicates: false });

  console.log('✅ [GOOGLE-TOKEN] Token renovado e salvo');
  return newAccessToken;
}

export async function fetchGoogleInsights(
  clientId: string,
  accountId: string,
  dateRange: { start: string; end: string },
  compareWithPrevious: boolean = true,
  includeAdDeltas: boolean = false
): Promise<TrafficInsightsResponse & { adDeltas?: any[] }> {
  console.log(`📊 [GOOGLE-INSIGHTS] Fetching for account ${accountId}`);

  // Buscar informações da conta
  const { data: accountData, error: accountError } = await supabase
    .from('client_accounts')
    .select('account_name, account_id, client_id, clients(company_name)')
    .eq('id', accountId)
    .eq('platform', 'google')
    .single();

  if (accountError || !accountData) {
    throw new Error(`Conta Google não encontrada: ${accountError?.message}`);
  }

  // Buscar developer token e manager id (access token é renovado separadamente)
  const { data: devTokenData, error: devError } = await supabase
    .from('api_tokens')
    .select('value')
    .eq('name', 'google_ads_developer_token')
    .single();

  const { data: managerIdData } = await supabase
    .from('api_tokens')
    .select('value')
    .eq('name', 'google_ads_manager_id')
    .single();

  if (devError || !devTokenData?.value) {
    throw new Error('Developer Token Google não encontrado. Configure o token em Configurações → API Tokens');
  }

  // Renova/recupera access token válido (espelha unified-meta-review)
  const accessToken = await getValidGoogleAccessToken();
  const developerToken = devTokenData.value;
  const managerId = managerIdData?.value || null;
  const customerId = accountData.account_id.replace(/-/g, '');

  // Validar tokens carregados
  console.log(`🔐 [GOOGLE-INSIGHTS] Tokens loaded:`);
  console.log(`   - Access Token: ${accessToken ? '✅ Present' : '❌ Missing'}`);
  console.log(`   - Developer Token: ${developerToken ? '✅ Present' : '❌ Missing'}`);
  console.log(`   - Manager ID: ${managerId || 'Not configured (optional)'}`);
  console.log(`   - Customer ID: ${customerId}`);

  // Calcular período anterior
  const startDate = new Date(dateRange.start);
  const endDate = new Date(dateRange.end);
  const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  
  const previousStart = new Date(startDate);
  previousStart.setDate(previousStart.getDate() - daysDiff);
  const previousEnd = new Date(startDate);
  previousEnd.setDate(previousEnd.getDate() - 1);

  // Buscar insights do período atual
  const currentInsights = await fetchGoogleAdsApiInsights(
    customerId,
    accessToken,
    developerToken,
    managerId,
    dateRange.start,
    dateRange.end
  );

  // Buscar quebra de conversões por categoria (Resultados por tipo de conversão)
  const currentCategoryBreakdown = await fetchGoogleConversionsByCategory(
    customerId, accessToken, developerToken, managerId, dateRange.start, dateRange.end,
  );

  // Buscar dados demográficos
  const demographics = await fetchGoogleAdsDemographics(
    customerId,
    accessToken,
    developerToken,
    managerId,
    dateRange.start,
    dateRange.end
  );

  // Buscar top ads
  const topAds = await fetchGoogleTopAds(
    customerId,
    accessToken,
    developerToken,
    managerId,
    dateRange.start,
    dateRange.end
  );

  // Deltas por anúncio (só na janela pedida)
  let adDeltas: any[] | undefined;
  if (includeAdDeltas) {
    try {
      const prevTopAds = await fetchGoogleTopAds(
        customerId,
        accessToken,
        developerToken,
        managerId,
        previousStart.toISOString().split('T')[0],
        previousEnd.toISOString().split('T')[0]
      );
      adDeltas = computeGoogleAdDeltas(topAds, prevTopAds);
    } catch (e) {
      console.warn('[GOOGLE-INSIGHTS] adDeltas skipped:', e);
    }
  }


  // Buscar insights do período anterior
  let previousInsights = null;
  let previousCategoryBreakdown: Record<string, number> = {};
  if (compareWithPrevious) {
    previousInsights = await fetchGoogleAdsApiInsights(
      customerId,
      accessToken,
      developerToken,
      managerId,
      previousStart.toISOString().split('T')[0],
      previousEnd.toISOString().split('T')[0]
    );
    previousCategoryBreakdown = await fetchGoogleConversionsByCategory(
      customerId, accessToken, developerToken, managerId,
      previousStart.toISOString().split('T')[0],
      previousEnd.toISOString().split('T')[0],
    );
  }

  // Determina a categoria "Resultados" principal: a com maior volume no período atual.
  let primaryCategory: string | null = null;
  let primaryResultsCurrent = 0;
  for (const [cat, val] of Object.entries(currentCategoryBreakdown)) {
    if (val > primaryResultsCurrent) {
      primaryResultsCurrent = val;
      primaryCategory = cat;
    }
  }
  const primaryResultsPrevious = primaryCategory ? (previousCategoryBreakdown[primaryCategory] || 0) : 0;


  // Processar dados agregados
  const overview = {
    impressions: {
      current: currentInsights.aggregate.impressions,
      previous: previousInsights?.aggregate.impressions || 0,
      change: calculatePercentChange(currentInsights.aggregate.impressions, previousInsights?.aggregate.impressions || 0)
    },
    reach: {
      current: 0,
      previous: 0,
      change: 0
    },
    clicks: {
      current: currentInsights.aggregate.clicks,
      previous: previousInsights?.aggregate.clicks || 0,
      change: calculatePercentChange(currentInsights.aggregate.clicks, previousInsights?.aggregate.clicks || 0)
    },
    ctr: {
      current: currentInsights.aggregate.impressions > 0 
        ? (currentInsights.aggregate.clicks / currentInsights.aggregate.impressions) * 100 
        : 0,
      previous: previousInsights && previousInsights.aggregate.impressions > 0
        ? (previousInsights.aggregate.clicks / previousInsights.aggregate.impressions) * 100
        : 0,
      change: 0
    },
    conversions: {
      current: currentInsights.aggregate.conversions,
      previous: previousInsights?.aggregate.conversions || 0,
      change: calculatePercentChange(currentInsights.aggregate.conversions, previousInsights?.aggregate.conversions || 0)
    },
    spend: {
      current: currentInsights.aggregate.spend,
      previous: previousInsights?.aggregate.spend || 0,
      change: calculatePercentChange(currentInsights.aggregate.spend, previousInsights?.aggregate.spend || 0)
    },
    cpa: {
      current: currentInsights.aggregate.conversions > 0
        ? currentInsights.aggregate.spend / currentInsights.aggregate.conversions
        : 0,
      previous: previousInsights && previousInsights.aggregate.conversions > 0
        ? previousInsights.aggregate.spend / previousInsights.aggregate.conversions
        : 0,
      change: 0
    },
    cpc: {
      current: currentInsights.aggregate.clicks > 0
        ? currentInsights.aggregate.spend / currentInsights.aggregate.clicks
        : 0,
      previous: previousInsights && previousInsights.aggregate.clicks > 0
        ? previousInsights.aggregate.spend / previousInsights.aggregate.clicks
        : 0,
      change: 0
    },
    // MANCHETE: Resultados = conversões da categoria principal (LEAD, PURCHASE, etc.)
    results: {
      current: primaryResultsCurrent,
      previous: primaryResultsPrevious,
      change: calculatePercentChange(primaryResultsCurrent, primaryResultsPrevious),
    },
  };

  overview.ctr.change = calculatePercentChange(overview.ctr.current, overview.ctr.previous);
  overview.cpa.change = calculatePercentChange(overview.cpa.current, overview.cpa.previous);
  overview.cpc.change = calculatePercentChange(overview.cpc.current, overview.cpc.previous);

  return {
    success: true,
    platform: 'google',
    clientName: (accountData.clients as any)?.company_name || '',
    accountName: accountData.account_name,
    dateRange,
    overview,
    campaigns: currentInsights.campaigns,
    timeSeries: currentInsights.timeSeries,
    demographics,
    topAds,
    adDeltas,
    resultsMeta: {
      primaryCategory,
      categoryBreakdown: {
        current: currentCategoryBreakdown,
        previous: previousCategoryBreakdown,
      },
      // Se não conseguimos identificar categoria (conta sem conversões cadastradas), sinaliza estimativa.
      estimated: !primaryCategory,
    },
  } as any;
}

// Consulta separada segmentando por categoria de conversion action.
// Retorna { LEAD: 25.0, PURCHASE: 12.0, ... }.
async function fetchGoogleConversionsByCategory(
  customerId: string,
  accessToken: string,
  developerToken: string,
  managerId: string | null,
  startDate: string,
  endDate: string,
): Promise<Record<string, number>> {
  const query = `
    SELECT
      segments.conversion_action_category,
      metrics.conversions
    FROM campaign
    WHERE segments.date BETWEEN '${startDate}' AND '${endDate}'
    AND campaign.status IN ('ENABLED', 'PAUSED')
  `;
  const url = `https://googleads.googleapis.com/v21/customers/${customerId}/googleAds:search`;
  const headers: Record<string, string> = {
    'Authorization': `Bearer ${accessToken}`,
    'developer-token': developerToken,
    'Content-Type': 'application/json',
  };
  if (managerId) headers['login-customer-id'] = managerId.replace(/-/g, '');

  const out: Record<string, number> = {};
  try {
    const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify({ query }) });
    if (!res.ok) {
      console.warn(`[GOOGLE-CATEG] HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
      return out;
    }
    const data = await res.json();
    if (Array.isArray(data?.results)) {
      for (const row of data.results) {
        const cat = row?.segments?.conversionActionCategory || 'UNSPECIFIED';
        const val = parseFloat(row?.metrics?.conversions || '0');
        out[cat] = (out[cat] || 0) + val;
      }
    }
    console.log(`🎯 [GOOGLE-CATEG] categories:`, out);
  } catch (e) {
    console.warn('[GOOGLE-CATEG] error:', e);
  }
  return out;
}


function computeGoogleAdDeltas(current: any[], previous: any[]): any[] {
  const prevById = new Map<string, any>();
  for (const p of previous || []) {
    if (p?.id) prevById.set(p.id, p);
  }
  const out: any[] = [];
  const pct = (cur: number, prev: number) => {
    if (!prev) return cur > 0 ? 100 : 0;
    return ((cur - prev) / prev) * 100;
  };
  for (const c of current || []) {
    const impressions = c?.metrics?.impressions || 0;
    if (impressions < 300) continue;
    const p = prevById.get(c.id);
    if (!p) continue;
    out.push({
      id: c.id,
      name: c.name,
      platform: 'google',
      impressions_current: impressions,
      ctr_change: pct(c.metrics.ctr, p.metrics?.ctr || 0),
      cpc_change: pct(c.metrics.cpc, p.metrics?.cpc || 0),
      cpa_change: pct(c.metrics.cpa, p.metrics?.cpa || 0),
      spend_change: pct(c.metrics.spend, p.metrics?.spend || 0),
      impressions_change: pct(impressions, p.metrics?.impressions || 0),
    });
  }
  out.sort((a, b) => (a.ctr_change - b.ctr_change));
  return out.slice(0, 15);
}


async function fetchGoogleAdsApiInsights(
  customerId: string,
  accessToken: string,
  developerToken: string,
  managerId: string | null,
  startDate: string,
  endDate: string
) {
  const query = `
    SELECT
      campaign.id,
      campaign.name,
      campaign.status,
      metrics.impressions,
      metrics.clicks,
      metrics.ctr,
      metrics.average_cpc,
      metrics.conversions,
      metrics.cost_per_conversion,
      metrics.cost_micros,
      metrics.video_views,
      segments.date
    FROM campaign
    WHERE segments.date BETWEEN '${startDate}' AND '${endDate}'
    AND campaign.status IN ('ENABLED', 'PAUSED')
    ORDER BY segments.date ASC
  `;

  const url = `https://googleads.googleapis.com/v21/customers/${customerId}/googleAds:search`;

  console.log(`🌐 [GOOGLE-API] Fetching insights: ${startDate} to ${endDate}`);
  console.log(`🔑 [GOOGLE-API] Customer ID: ${customerId}`);
  console.log(`📊 [GOOGLE-API] URL: ${url}`);

  const headers: Record<string, string> = {
    'Authorization': `Bearer ${accessToken}`,
    'developer-token': developerToken,
    'Content-Type': 'application/json'
  };

  // Adicionar login-customer-id se houver Manager ID configurado
  if (managerId) {
    headers['login-customer-id'] = managerId.replace(/-/g, '');
    console.log(`🔑 [GOOGLE-API] Using Manager ID: ${managerId}`);
  }

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({ query })
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`❌ [GOOGLE-API] HTTP ${response.status}:`, errorText);
    
    let errorDetails;
    try {
      errorDetails = JSON.parse(errorText);
    } catch {
      errorDetails = { message: errorText };
    }
    
    throw new Error(
      `Google Ads API error ${response.status}: ${errorDetails?.error?.message || errorText}`
    );
  }

  const results = await response.json();

  console.log(`✅ [GOOGLE-API] Response received, processing...`);
  console.log(`📦 [GOOGLE-API] Results structure:`, JSON.stringify(results).substring(0, 200));

  const campaignsMap = new Map<string, any>();
  const timeSeriesMap = new Map<string, any>();

  let totalImpressions = 0;
  let totalClicks = 0;
  let totalSpend = 0;
  let totalConversions = 0;

  // Processar results.results diretamente (API v21 retorna { results: [...] })
  if (results && results.results && Array.isArray(results.results)) {
    for (const row of results.results) {
      const campaign = row.campaign;
      const metrics = row.metrics;
      const date = row.segments?.date;

      if (!campaign || !metrics) continue;

      const campaignId = campaign.id?.toString() || 'unknown';
      const campaignName = campaign.name || 'Unknown Campaign';
      const status = campaign.status || 'UNKNOWN';

      const impressions = parseInt(metrics.impressions || '0');
      const clicks = parseInt(metrics.clicks || '0');
      const spend = parseFloat(metrics.costMicros || '0') / 1000000;
      const conversions = parseFloat(metrics.conversions || '0');
      const ctr = parseFloat(metrics.ctr || '0') * 100;
      const cpc = parseFloat(metrics.averageCpc || '0') / 1000000;
      const videoViews = parseInt(metrics.videoViews || '0');

      // Agregar por campanha
      if (!campaignsMap.has(campaignId)) {
        campaignsMap.set(campaignId, {
          id: campaignId,
          name: campaignName,
          platform: 'google' as const,
          status: status.toLowerCase(),
          impressions: 0,
          clicks: 0,
          ctr: 0,
          cpc: 0,
          conversions: 0,
          cpa: 0,
          spend: 0,
          videoViews: 0
        });
      }

      const campaignData = campaignsMap.get(campaignId);
      campaignData.impressions += impressions;
      campaignData.clicks += clicks;
      campaignData.spend += spend;
      campaignData.conversions += conversions;
      campaignData.videoViews += videoViews;

      // Agregar por data
      if (date) {
        if (!timeSeriesMap.has(date)) {
          timeSeriesMap.set(date, {
            date,
            impressions: 0,
            clicks: 0,
            conversions: 0,
            spend: 0
          });
        }

        const timePoint = timeSeriesMap.get(date);
        timePoint.impressions += impressions;
        timePoint.clicks += clicks;
        timePoint.conversions += conversions;
        timePoint.spend += spend;
      }

      totalImpressions += impressions;
      totalClicks += clicks;
      totalSpend += spend;
      totalConversions += conversions;
    }
  }

  console.log(`✅ [GOOGLE-INSIGHTS] Processed ${campaignsMap.size} campaigns, ${timeSeriesMap.size} days of data`);

  // Calcular métricas derivadas por campanha
  const campaigns: CampaignInsight[] = Array.from(campaignsMap.values()).map(c => {
    c.ctr = c.impressions > 0 ? (c.clicks / c.impressions) * 100 : 0;
    c.cpc = c.clicks > 0 ? c.spend / c.clicks : 0;
    c.cpa = c.conversions > 0 ? c.spend / c.conversions : 0;
    return c;
  });

  const timeSeries: TimeSeriesData[] = Array.from(timeSeriesMap.values())
    .sort((a, b) => a.date.localeCompare(b.date));

  return {
    aggregate: {
      impressions: totalImpressions,
      clicks: totalClicks,
      spend: totalSpend,
      conversions: totalConversions
    },
    campaigns,
    timeSeries
  };
}

// Buscar dados demográficos do Google Ads
async function fetchGoogleAdsDemographics(
  customerId: string,
  accessToken: string,
  developerToken: string,
  managerId: string | null,
  startDate: string,
  endDate: string
): Promise<Demographics> {
  const headers: Record<string, string> = {
    'Authorization': `Bearer ${accessToken}`,
    'developer-token': developerToken,
    'Content-Type': 'application/json'
  };

  if (managerId) {
    headers['login-customer-id'] = managerId.replace(/-/g, '');
  }

  const url = `https://googleads.googleapis.com/v21/customers/${customerId}/googleAds:search`;

  const demographics: Demographics = {
    byAge: [],
    byGender: [],
    byLocation: []
  };

  // Fetch age demographics
  try {
    const ageQuery = `
      SELECT
        ad_group_criterion.age_range_type,
        metrics.impressions,
        metrics.clicks,
        metrics.conversions,
        metrics.cost_micros
      FROM age_range_view
      WHERE segments.date BETWEEN '${startDate}' AND '${endDate}'
    `;

    const ageResponse = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({ query: ageQuery })
    });

    if (ageResponse.ok) {
      const ageData = await ageResponse.json();
      const ageMap = new Map<string, any>();

      if (ageData.results) {
        for (const row of ageData.results) {
          const ageType = row.adGroupCriterion?.ageRangeType || 'UNKNOWN';
          const label = mapGoogleAgeRange(ageType);
          
          if (!ageMap.has(label)) {
            ageMap.set(label, {
              label,
              value: label,
              impressions: 0,
              clicks: 0,
              conversions: 0,
              spend: 0,
              ctr: 0,
              cpa: 0
            });
          }

          const item = ageMap.get(label);
          item.impressions += parseInt(row.metrics?.impressions || '0');
          item.clicks += parseInt(row.metrics?.clicks || '0');
          item.conversions += parseFloat(row.metrics?.conversions || '0');
          item.spend += parseFloat(row.metrics?.costMicros || '0') / 1000000;
        }
      }

      demographics.byAge = Array.from(ageMap.values()).map(d => {
        d.ctr = d.impressions > 0 ? (d.clicks / d.impressions) * 100 : 0;
        d.cpa = d.conversions > 0 ? d.spend / d.conversions : 0;
        return d;
      }).sort((a, b) => b.impressions - a.impressions);
    }
  } catch (e) {
    console.log('⚠️ [GOOGLE-API] Could not fetch age demographics:', e);
  }

  // Fetch gender demographics
  try {
    const genderQuery = `
      SELECT
        ad_group_criterion.gender.type,
        metrics.impressions,
        metrics.clicks,
        metrics.conversions,
        metrics.cost_micros
      FROM gender_view
      WHERE segments.date BETWEEN '${startDate}' AND '${endDate}'
    `;

    const genderResponse = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({ query: genderQuery })
    });

    if (genderResponse.ok) {
      const genderData = await genderResponse.json();
      const genderMap = new Map<string, any>();

      if (genderData.results) {
        for (const row of genderData.results) {
          const genderType = row.adGroupCriterion?.gender?.type || 'UNKNOWN';
          const label = mapGoogleGender(genderType);
          
          if (!genderMap.has(label)) {
            genderMap.set(label, {
              label,
              value: label,
              impressions: 0,
              clicks: 0,
              conversions: 0,
              spend: 0,
              ctr: 0,
              cpa: 0
            });
          }

          const item = genderMap.get(label);
          item.impressions += parseInt(row.metrics?.impressions || '0');
          item.clicks += parseInt(row.metrics?.clicks || '0');
          item.conversions += parseFloat(row.metrics?.conversions || '0');
          item.spend += parseFloat(row.metrics?.costMicros || '0') / 1000000;
        }
      }

      demographics.byGender = Array.from(genderMap.values()).map(d => {
        d.ctr = d.impressions > 0 ? (d.clicks / d.impressions) * 100 : 0;
        d.cpa = d.conversions > 0 ? d.spend / d.conversions : 0;
        return d;
      }).sort((a, b) => b.impressions - a.impressions);
    }
  } catch (e) {
    console.log('⚠️ [GOOGLE-API] Could not fetch gender demographics:', e);
  }

  // Fetch location demographics
  try {
    const locationQuery = `
      SELECT
        campaign_criterion.location.geo_target_constant,
        geo_target_constant.canonical_name,
        metrics.impressions,
        metrics.clicks,
        metrics.conversions,
        metrics.cost_micros
      FROM location_view
      WHERE segments.date BETWEEN '${startDate}' AND '${endDate}'
    `;

    const locationResponse = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({ query: locationQuery })
    });

    if (locationResponse.ok) {
      const locationData = await locationResponse.json();
      const locationMap = new Map<string, any>();

      if (locationData.results) {
        for (const row of locationData.results) {
          const label = row.geoTargetConstant?.canonicalName || 'Unknown';
          
          if (!locationMap.has(label)) {
            locationMap.set(label, {
              label,
              value: label,
              impressions: 0,
              clicks: 0,
              conversions: 0,
              spend: 0,
              ctr: 0,
              cpa: 0
            });
          }

          const item = locationMap.get(label);
          item.impressions += parseInt(row.metrics?.impressions || '0');
          item.clicks += parseInt(row.metrics?.clicks || '0');
          item.conversions += parseFloat(row.metrics?.conversions || '0');
          item.spend += parseFloat(row.metrics?.costMicros || '0') / 1000000;
        }
      }

      demographics.byLocation = Array.from(locationMap.values()).map(d => {
        d.ctr = d.impressions > 0 ? (d.clicks / d.impressions) * 100 : 0;
        d.cpa = d.conversions > 0 ? d.spend / d.conversions : 0;
        return d;
      }).sort((a, b) => b.impressions - a.impressions).slice(0, 10);
    }
  } catch (e) {
    console.log('⚠️ [GOOGLE-API] Could not fetch location demographics:', e);
  }

  console.log(`✅ [GOOGLE-DEMOGRAPHICS] Age: ${demographics.byAge.length}, Gender: ${demographics.byGender.length}, Location: ${demographics.byLocation.length}`);

  return demographics;
}

// Buscar top ads do Google Ads
async function fetchGoogleTopAds(
  customerId: string,
  accessToken: string,
  developerToken: string,
  managerId: string | null,
  startDate: string,
  endDate: string
): Promise<TopAd[]> {
  const headers: Record<string, string> = {
    'Authorization': `Bearer ${accessToken}`,
    'developer-token': developerToken,
    'Content-Type': 'application/json'
  };

  if (managerId) {
    headers['login-customer-id'] = managerId.replace(/-/g, '');
  }

  const url = `https://googleads.googleapis.com/v21/customers/${customerId}/googleAds:search`;

  try {
    const query = `
      SELECT
        ad_group_ad.ad.id,
        ad_group_ad.ad.name,
        ad_group_ad.ad.type,
        ad_group_ad.ad.responsive_display_ad.headlines,
        ad_group_ad.ad.responsive_display_ad.descriptions,
        ad_group_ad.ad.responsive_search_ad.headlines,
        ad_group_ad.ad.responsive_search_ad.descriptions,
        metrics.impressions,
        metrics.clicks,
        metrics.conversions,
        metrics.cost_micros
      FROM ad_group_ad
      WHERE segments.date BETWEEN '${startDate}' AND '${endDate}'
      AND ad_group_ad.status IN ('ENABLED', 'PAUSED')
      ORDER BY metrics.impressions DESC
      LIMIT 10
    `;

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({ query })
    });

    if (!response.ok) {
      console.log('⚠️ [GOOGLE-API] Could not fetch top ads');
      return [];
    }

    const data = await response.json();
    const topAds: TopAd[] = [];

    if (data.results) {
      for (const row of data.results) {
        const ad = row.adGroupAd?.ad;
        const metrics = row.metrics;

        if (!ad || !metrics) continue;

        const impressions = parseInt(metrics.impressions || '0');
        const clicks = parseInt(metrics.clicks || '0');
        const conversions = parseFloat(metrics.conversions || '0');
        const spend = parseFloat(metrics.costMicros || '0') / 1000000;

        // Extract headline/title from responsive ads
        let title = ad.name || 'Unknown Ad';
        let body = '';

        if (ad.responsiveDisplayAd) {
          title = ad.responsiveDisplayAd.headlines?.[0]?.text || title;
          body = ad.responsiveDisplayAd.descriptions?.[0]?.text || '';
        } else if (ad.responsiveSearchAd) {
          title = ad.responsiveSearchAd.headlines?.[0]?.text || title;
          body = ad.responsiveSearchAd.descriptions?.[0]?.text || '';
        }

        topAds.push({
          id: ad.id?.toString() || 'unknown',
          name: title,
          platform: 'google',
          creative: {
            title,
            body,
            type: ad.type || 'unknown'
          },
          metrics: {
            impressions,
            clicks,
            ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
            conversions,
            cpa: conversions > 0 ? spend / conversions : 0,
            cpc: clicks > 0 ? spend / clicks : 0,
            spend
          }
        });
      }
    }

    console.log(`✅ [GOOGLE-TOP-ADS] Found ${topAds.length} ads`);
    return topAds;
  } catch (e) {
    console.log('⚠️ [GOOGLE-API] Error fetching top ads:', e);
    return [];
  }
}

// Mapeamento de faixas etárias Google para labels padronizados
function mapGoogleAgeRange(ageType: string): string {
  const mapping: Record<string, string> = {
    'AGE_RANGE_18_24': '18-24',
    'AGE_RANGE_25_34': '25-34',
    'AGE_RANGE_35_44': '35-44',
    'AGE_RANGE_45_54': '45-54',
    'AGE_RANGE_55_64': '55-64',
    'AGE_RANGE_65_UP': '65+',
    'AGE_RANGE_UNDETERMINED': 'Indefinido'
  };
  return mapping[ageType] || ageType;
}

// Mapeamento de gênero Google para labels padronizados
function mapGoogleGender(genderType: string): string {
  const mapping: Record<string, string> = {
    'MALE': 'male',
    'FEMALE': 'female',
    'UNDETERMINED': 'unknown'
  };
  return mapping[genderType] || genderType;
}

function calculatePercentChange(current: number, previous: number): number {
  if (previous === 0) {
    return current > 0 ? 100 : 0;
  }
  return ((current - previous) / previous) * 100;
}
