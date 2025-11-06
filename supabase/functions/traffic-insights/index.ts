import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "./cors.ts";
import { fetchMetaInsights } from "./meta-insights.ts";
import { fetchGoogleInsights } from "./google-insights.ts";
import { TrafficInsightsRequest, TrafficInsightsResponse } from "./types.ts";

serve(async (req: Request) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { clientId, accountIds, platform, dateRange, compareWithPrevious } = await req.json() as TrafficInsightsRequest;

    console.log(`🔍 [TRAFFIC-INSIGHTS] Request:`, { clientId, accountIds, platform, dateRange });

    // Validações
    if (!clientId || !accountIds || accountIds.length === 0 || !platform || !dateRange) {
      return new Response(
        JSON.stringify({ success: false, error: 'Parâmetros obrigatórios: clientId, accountIds (array), platform, dateRange' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let result: TrafficInsightsResponse;

    // Buscar insights para múltiplas contas
    const allResults = await Promise.all(
      accountIds.map(async (accountId) => {
        try {
          if (platform === 'meta' || platform === 'both') {
            return await fetchMetaInsights(clientId, accountId, dateRange, compareWithPrevious);
          } else if (platform === 'google') {
            return await fetchGoogleInsights(clientId, accountId, dateRange, compareWithPrevious);
          }
        } catch (error) {
          console.error(`❌ Error fetching insights for account ${accountId}:`, error);
          return null;
        }
      })
    );

    const validResults = allResults.filter(r => r !== null);

    if (validResults.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'Nenhum dado disponível para as contas selecionadas' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Agregar resultados de múltiplas contas
    if (platform === 'both') {
      // Separar Meta e Google
      const metaResults = validResults.filter(r => r.platform === 'meta');
      const googleResults = validResults.filter(r => r.platform === 'google');

      const aggregatedMeta = metaResults.length > 0 ? aggregateResults(metaResults) : null;
      const aggregatedGoogle = googleResults.length > 0 ? aggregateResults(googleResults) : null;

      // Combinar Meta e Google
      result = {
        success: true,
        platform: 'both',
        clientName: aggregatedMeta?.clientName || aggregatedGoogle?.clientName || '',
        accountName: `${accountIds.length} contas`,
        dateRange,
        overview: {
          impressions: {
            current: (aggregatedMeta?.overview.impressions.current || 0) + (aggregatedGoogle?.overview.impressions.current || 0),
            previous: (aggregatedMeta?.overview.impressions.previous || 0) + (aggregatedGoogle?.overview.impressions.previous || 0),
            change: 0
          },
          reach: aggregatedMeta?.overview.reach || { current: 0, previous: 0, change: 0 },
          clicks: {
            current: (aggregatedMeta?.overview.clicks.current || 0) + (aggregatedGoogle?.overview.clicks.current || 0),
            previous: (aggregatedMeta?.overview.clicks.previous || 0) + (aggregatedGoogle?.overview.clicks.previous || 0),
            change: 0
          },
          ctr: { current: 0, previous: 0, change: 0 },
          conversions: {
            current: (aggregatedMeta?.overview.conversions.current || 0) + (aggregatedGoogle?.overview.conversions.current || 0),
            previous: (aggregatedMeta?.overview.conversions.previous || 0) + (aggregatedGoogle?.overview.conversions.previous || 0),
            change: 0
          },
          spend: {
            current: (aggregatedMeta?.overview.spend.current || 0) + (aggregatedGoogle?.overview.spend.current || 0),
            previous: (aggregatedMeta?.overview.spend.previous || 0) + (aggregatedGoogle?.overview.spend.previous || 0),
            change: 0
          },
          cpa: { current: 0, previous: 0, change: 0 },
          cpc: { current: 0, previous: 0, change: 0 }
        },
        campaigns: [...(aggregatedMeta?.campaigns || []), ...(aggregatedGoogle?.campaigns || [])],
        timeSeries: [],
        metaData: aggregatedMeta || undefined,
        googleData: aggregatedGoogle || undefined
      };

      // Calcular métricas derivadas
      if (result.overview.impressions.current > 0) {
        result.overview.ctr.current = (result.overview.clicks.current / result.overview.impressions.current) * 100;
      }
      if (result.overview.impressions.previous > 0) {
        result.overview.ctr.previous = (result.overview.clicks.previous / result.overview.impressions.previous) * 100;
      }
      if (result.overview.conversions.current > 0) {
        result.overview.cpa.current = result.overview.spend.current / result.overview.conversions.current;
      }
      if (result.overview.conversions.previous > 0) {
        result.overview.cpa.previous = result.overview.spend.previous / result.overview.conversions.previous;
      }
      if (result.overview.clicks.current > 0) {
        result.overview.cpc.current = result.overview.spend.current / result.overview.clicks.current;
      }
      if (result.overview.clicks.previous > 0) {
        result.overview.cpc.previous = result.overview.spend.previous / result.overview.clicks.previous;
      }

      // Calcular changes
      Object.keys(result.overview).forEach(key => {
        const metric = result.overview[key as keyof typeof result.overview];
        if (metric.previous > 0) {
          metric.change = ((metric.current - metric.previous) / metric.previous) * 100;
        } else if (metric.current > 0) {
          metric.change = 100;
        }
      });
    } else {
      // Plataforma específica (meta ou google)
      result = aggregateResults(validResults);
    }

    console.log(`✅ [TRAFFIC-INSIGHTS] Success for ${platform}, ${validResults.length} accounts`);

    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ [TRAFFIC-INSIGHTS] Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Função auxiliar para agregar múltiplos resultados
function aggregateResults(results: TrafficInsightsResponse[]): TrafficInsightsResponse {
  if (results.length === 1) return results[0];

  const aggregated: TrafficInsightsResponse = {
    success: true,
    platform: results[0].platform,
    clientName: results[0].clientName,
    accountName: `${results.length} contas`,
    dateRange: results[0].dateRange,
    overview: {
      impressions: { current: 0, previous: 0, change: 0 },
      reach: { current: 0, previous: 0, change: 0 },
      clicks: { current: 0, previous: 0, change: 0 },
      ctr: { current: 0, previous: 0, change: 0 },
      conversions: { current: 0, previous: 0, change: 0 },
      spend: { current: 0, previous: 0, change: 0 },
      cpa: { current: 0, previous: 0, change: 0 },
      cpc: { current: 0, previous: 0, change: 0 }
    },
    campaigns: [],
    timeSeries: []
  };

  // Somar métricas
  results.forEach(result => {
    aggregated.overview.impressions.current += result.overview.impressions.current;
    aggregated.overview.impressions.previous += result.overview.impressions.previous;
    aggregated.overview.reach.current += result.overview.reach?.current || 0;
    aggregated.overview.reach.previous += result.overview.reach?.previous || 0;
    aggregated.overview.clicks.current += result.overview.clicks.current;
    aggregated.overview.clicks.previous += result.overview.clicks.previous;
    aggregated.overview.conversions.current += result.overview.conversions.current;
    aggregated.overview.conversions.previous += result.overview.conversions.previous;
    aggregated.overview.spend.current += result.overview.spend.current;
    aggregated.overview.spend.previous += result.overview.spend.previous;
    aggregated.campaigns.push(...result.campaigns);
  });

  // Calcular métricas derivadas
  if (aggregated.overview.impressions.current > 0) {
    aggregated.overview.ctr.current = (aggregated.overview.clicks.current / aggregated.overview.impressions.current) * 100;
  }
  if (aggregated.overview.impressions.previous > 0) {
    aggregated.overview.ctr.previous = (aggregated.overview.clicks.previous / aggregated.overview.impressions.previous) * 100;
  }
  if (aggregated.overview.conversions.current > 0) {
    aggregated.overview.cpa.current = aggregated.overview.spend.current / aggregated.overview.conversions.current;
  }
  if (aggregated.overview.conversions.previous > 0) {
    aggregated.overview.cpa.previous = aggregated.overview.spend.previous / aggregated.overview.conversions.previous;
  }
  if (aggregated.overview.clicks.current > 0) {
    aggregated.overview.cpc.current = aggregated.overview.spend.current / aggregated.overview.clicks.current;
  }
  if (aggregated.overview.clicks.previous > 0) {
    aggregated.overview.cpc.previous = aggregated.overview.spend.previous / aggregated.overview.clicks.previous;
  }

  // Calcular changes
  Object.keys(aggregated.overview).forEach(key => {
    const metric = aggregated.overview[key as keyof typeof aggregated.overview];
    if (metric.previous > 0) {
      metric.change = ((metric.current - metric.previous) / metric.previous) * 100;
    } else if (metric.current > 0) {
      metric.change = 100;
    }
  });

  return aggregated;
}
