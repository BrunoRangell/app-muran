import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { TrafficInsightsResponse, CampaignInsight, TimeSeriesData } from "./types.ts";

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function fetchGoogleInsights(
  clientId: string,
  accountId: string,
  dateRange: { start: string; end: string },
  compareWithPrevious: boolean = true
): Promise<TrafficInsightsResponse> {
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

  // Buscar tokens de acesso
  const { data: tokenData, error: tokenError } = await supabase
    .from('api_tokens')
    .select('access_token, refresh_token, developer_token')
    .eq('client_id', clientId)
    .eq('platform', 'google')
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (tokenError || !tokenData?.access_token) {
    throw new Error('Token de acesso Google não encontrado');
  }

  const accessToken = tokenData.access_token;
  const developerToken = tokenData.developer_token;
  const customerId = accountData.account_id.replace(/-/g, '');

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
    dateRange.start,
    dateRange.end
  );

  // Buscar insights do período anterior
  let previousInsights = null;
  if (compareWithPrevious) {
    previousInsights = await fetchGoogleAdsApiInsights(
      customerId,
      accessToken,
      developerToken,
      previousStart.toISOString().split('T')[0],
      previousEnd.toISOString().split('T')[0]
    );
  }

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
    }
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
    timeSeries: currentInsights.timeSeries
  };
}

async function fetchGoogleAdsApiInsights(
  customerId: string,
  accessToken: string,
  developerToken: string,
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

  const url = `https://googleads.googleapis.com/v18/customers/${customerId}/googleAds:searchStream`;

  console.log(`🌐 [GOOGLE-API] Fetching insights: ${startDate} to ${endDate}`);

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'developer-token': developerToken,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query })
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`❌ [GOOGLE-API] Error:`, errorText);
    throw new Error(`Google Ads API error: ${response.status}`);
  }

  const results = await response.json();

  const campaignsMap = new Map<string, any>();
  const timeSeriesMap = new Map<string, any>();

  let totalImpressions = 0;
  let totalClicks = 0;
  let totalSpend = 0;
  let totalConversions = 0;

  if (results && Array.isArray(results)) {
    for (const result of results) {
      if (!result.results) continue;

      for (const row of result.results) {
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
  }

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

function calculatePercentChange(current: number, previous: number): number {
  if (previous === 0) {
    return current > 0 ? 100 : 0;
  }
  return ((current - previous) / previous) * 100;
}
