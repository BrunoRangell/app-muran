import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { TrafficInsightsResponse, CampaignInsight, TimeSeriesData, DemographicData, Demographics } from "./types.ts";
import { processDemographics } from "./demographics-processor.ts";
import { fetchMetaTopAds } from "./ads-processor.ts";

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function fetchMetaInsights(
  clientId: string,
  accountId: string,
  dateRange: { start: string; end: string },
  compareWithPrevious: boolean = true
): Promise<TrafficInsightsResponse> {
  console.log(`📊 [META-INSIGHTS] Fetching for account ${accountId}`);

  // Buscar informações da conta
  const { data: accountData, error: accountError } = await supabase
    .from('client_accounts')
    .select('account_name, account_id, client_id, clients(company_name)')
    .eq('id', accountId)
    .eq('platform', 'meta')
    .single();

  if (accountError || !accountData) {
    throw new Error(`Conta Meta não encontrada: ${accountError?.message}`);
  }

  // Buscar token de acesso Meta global
  const { data: tokenData, error: tokenError } = await supabase
    .from('api_tokens')
    .select('value')
    .eq('name', 'meta_access_token')
    .single();

  if (tokenError || !tokenData?.value) {
    throw new Error('Token de acesso Meta não encontrado. Configure o token em Configurações → API Tokens');
  }

  const accessToken = tokenData.value;
  
  // Adicionar prefixo act_ se não existir
  let metaAccountId = accountData.account_id;
  if (!metaAccountId.startsWith('act_')) {
    metaAccountId = `act_${metaAccountId}`;
  }

  // Calcular período anterior para comparação
  const startDate = new Date(dateRange.start);
  const endDate = new Date(dateRange.end);
  const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  
  const previousStart = new Date(startDate);
  previousStart.setDate(previousStart.getDate() - daysDiff);
  const previousEnd = new Date(startDate);
  previousEnd.setDate(previousEnd.getDate() - 1);

  // Buscar insights do período atual (agora incluindo demographics)
  const currentInsights = await fetchMetaApiInsights(
    metaAccountId,
    accessToken,
    dateRange.start,
    dateRange.end
  );

  // Buscar insights do período anterior se solicitado
  let previousInsights = null;
  if (compareWithPrevious) {
    previousInsights = await fetchMetaApiInsights(
      metaAccountId,
      accessToken,
      previousStart.toISOString().split('T')[0],
      previousEnd.toISOString().split('T')[0]
    );
  }

  // Buscar top ads
  const topAds = await fetchMetaTopAds(
    metaAccountId,
    accessToken,
    dateRange.start,
    dateRange.end,
    10
  );

  // Processar dados agregados
  const overview = {
    impressions: {
      current: currentInsights.aggregate.impressions,
      previous: previousInsights?.aggregate.impressions || 0,
      change: calculatePercentChange(currentInsights.aggregate.impressions, previousInsights?.aggregate.impressions || 0)
    },
    reach: {
      current: currentInsights.aggregate.reach,
      previous: previousInsights?.aggregate.reach || 0,
      change: calculatePercentChange(currentInsights.aggregate.reach, previousInsights?.aggregate.reach || 0)
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
    }
  };

  // Calcular change para métricas derivadas
  overview.ctr.change = calculatePercentChange(overview.ctr.current, overview.ctr.previous);
  overview.cpa.change = calculatePercentChange(overview.cpa.current, overview.cpa.previous);
  overview.cpc.change = calculatePercentChange(overview.cpc.current, overview.cpc.previous);

  return {
    success: true,
    platform: 'meta',
    clientName: (accountData.clients as any)?.company_name || '',
    accountName: accountData.account_name,
    dateRange,
    overview,
    campaigns: currentInsights.campaigns,
    timeSeries: currentInsights.timeSeries,
    demographics: currentInsights.demographics,
    topAds
  };
}

async function fetchMetaApiInsights(
  accountId: string,
  accessToken: string,
  since: string,
  until: string
) {
  // Garantir que o accountId tenha o prefixo act_
  const formattedAccountId = accountId.startsWith('act_') ? accountId : `act_${accountId}`;
  
  const fields = [
    'campaign_id',
    'campaign_name',
    'impressions',
    'reach',
    'frequency',
    'clicks',
    'ctr',
    'cpc',
    'spend',
    'actions',
    'cost_per_action_type',
    'video_play_actions'
  ].join(',');

  // Fetch campaign insights
  const campaignParams = new URLSearchParams({
    access_token: accessToken,
    fields: fields,
    time_range: JSON.stringify({ since, until }),
    level: 'campaign',
    time_increment: '1',
    limit: '500'
  });

  const campaignUrl = `https://graph.facebook.com/v22.0/${formattedAccountId}/insights?${campaignParams}`;

  console.log(`🌐 [META-API] Fetching campaign insights for ${formattedAccountId}: ${since} to ${until}`);

  const campaignResponse = await fetch(campaignUrl);
  
  if (!campaignResponse.ok) {
    const errorText = await campaignResponse.text();
    console.error(`❌ [META-API] Error:`, errorText);
    throw new Error(`Meta API error: ${campaignResponse.status} - ${errorText}`);
  }

  const data = await campaignResponse.json();

  // Fetch demographic insights (age, gender, region)
  const demographicData: {
    age: any[];
    gender: any[];
    region: any[];
  } = {
    age: [],
    gender: [],
    region: []
  };

  // Fetch age demographics
  try {
    const ageParams = new URLSearchParams({
      access_token: accessToken,
      fields: fields,
      time_range: JSON.stringify({ since, until }),
      level: 'account',
      breakdowns: 'age',
      limit: '100'
    });
    const ageUrl = `https://graph.facebook.com/v22.0/${formattedAccountId}/insights?${ageParams}`;
    const ageResponse = await fetch(ageUrl);
    if (ageResponse.ok) {
      const ageData = await ageResponse.json();
      demographicData.age = ageData.data || [];
    }
  } catch (e) {
    console.log('⚠️ [META-API] Could not fetch age demographics:', e);
  }

  // Fetch gender demographics
  try {
    const genderParams = new URLSearchParams({
      access_token: accessToken,
      fields: fields,
      time_range: JSON.stringify({ since, until }),
      level: 'account',
      breakdowns: 'gender',
      limit: '100'
    });
    const genderUrl = `https://graph.facebook.com/v22.0/${formattedAccountId}/insights?${genderParams}`;
    const genderResponse = await fetch(genderUrl);
    if (genderResponse.ok) {
      const genderData = await genderResponse.json();
      demographicData.gender = genderData.data || [];
    }
  } catch (e) {
    console.log('⚠️ [META-API] Could not fetch gender demographics:', e);
  }

  // Fetch region demographics
  try {
    const regionParams = new URLSearchParams({
      access_token: accessToken,
      fields: fields,
      time_range: JSON.stringify({ since, until }),
      level: 'account',
      breakdowns: 'region',
      limit: '100'
    });
    const regionUrl = `https://graph.facebook.com/v22.0/${formattedAccountId}/insights?${regionParams}`;
    const regionResponse = await fetch(regionUrl);
    if (regionResponse.ok) {
      const regionData = await regionResponse.json();
      demographicData.region = regionData.data || [];
    }
  } catch (e) {
    console.log('⚠️ [META-API] Could not fetch region demographics:', e);
  }

  // Process demographics
  const demographics = processDemographics(
    demographicData.age,
    demographicData.gender,
    demographicData.region
  );

  // Processar dados por campanha
  const campaignsMap = new Map<string, any>();
  const timeSeriesMap = new Map<string, any>();

  let totalImpressions = 0;
  let totalReach = 0;
  let totalClicks = 0;
  let totalSpend = 0;
  let totalConversions = 0;

  if (data.data && Array.isArray(data.data)) {
    for (const insight of data.data) {
      const campaignId = insight.campaign_id || 'unknown';
      const campaignName = insight.campaign_name || 'Unknown Campaign';
      const date = insight.date_start;

      const impressions = parseInt(insight.impressions || '0');
      const reach = parseInt(insight.reach || '0');
      const clicks = parseInt(insight.clicks || '0');
      const spend = parseFloat(insight.spend || '0');
      const ctr = parseFloat(insight.ctr || '0');
      const cpc = parseFloat(insight.cpc || '0');
      
      // Extrair conversões
      let conversions = 0;
      if (insight.actions && Array.isArray(insight.actions)) {
        const conversionActions = insight.actions.filter((action: any) => 
          action.action_type === 'lead' || 
          action.action_type === 'purchase' ||
          action.action_type === 'omni_purchase' ||
          action.action_type === 'onsite_conversion.post_save'
        );
        conversions = conversionActions.reduce((sum: number, action: any) => 
          sum + parseInt(action.value || '0'), 0
        );
      }

      const videoViews = insight.video_play_actions?.[0]?.value || 0;

      // Agregar por campanha
      if (!campaignsMap.has(campaignId)) {
        campaignsMap.set(campaignId, {
          id: campaignId,
          name: campaignName,
          platform: 'meta' as const,
          status: 'active',
          impressions: 0,
          reach: 0,
          clicks: 0,
          ctr: 0,
          cpc: 0,
          conversions: 0,
          cpa: 0,
          spend: 0,
          frequency: 0,
          videoViews: 0
        });
      }

      const campaign = campaignsMap.get(campaignId);
      campaign.impressions += impressions;
      campaign.reach += reach;
      campaign.clicks += clicks;
      campaign.spend += spend;
      campaign.conversions += conversions;
      campaign.videoViews += videoViews;

      // Agregar por data para série temporal
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

      // Totais
      totalImpressions += impressions;
      totalReach += reach;
      totalClicks += clicks;
      totalSpend += spend;
      totalConversions += conversions;
    }
  }

  // Calcular métricas derivadas por campanha
  const campaigns: CampaignInsight[] = Array.from(campaignsMap.values()).map(c => {
    c.ctr = c.impressions > 0 ? (c.clicks / c.impressions) * 100 : 0;
    c.cpc = c.clicks > 0 ? c.spend / c.clicks : 0;
    c.cpa = c.conversions > 0 ? c.spend / c.conversions : 0;
    c.frequency = c.reach > 0 ? c.impressions / c.reach : 0;
    return c;
  });

  const timeSeries: TimeSeriesData[] = Array.from(timeSeriesMap.values())
    .sort((a, b) => a.date.localeCompare(b.date));

  return {
    aggregate: {
      impressions: totalImpressions,
      reach: totalReach,
      clicks: totalClicks,
      spend: totalSpend,
      conversions: totalConversions
    },
    campaigns,
    timeSeries,
    demographics
  };
}

function calculatePercentChange(current: number, previous: number): number {
  if (previous === 0) {
    return current > 0 ? 100 : 0;
  }
  return ((current - previous) / previous) * 100;
}
