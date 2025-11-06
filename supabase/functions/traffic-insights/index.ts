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
    const { clientId, accountId, platform, dateRange, compareWithPrevious } = await req.json() as TrafficInsightsRequest;

    console.log(`🔍 [TRAFFIC-INSIGHTS] Request:`, { clientId, accountId, platform, dateRange });

    // Validações
    if (!clientId || !accountId || !platform || !dateRange) {
      return new Response(
        JSON.stringify({ success: false, error: 'Parâmetros obrigatórios: clientId, accountId, platform, dateRange' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let result: TrafficInsightsResponse;

    // Buscar insights conforme plataforma
    if (platform === 'meta') {
      result = await fetchMetaInsights(clientId, accountId, dateRange, compareWithPrevious);
    } else if (platform === 'google') {
      result = await fetchGoogleInsights(clientId, accountId, dateRange, compareWithPrevious);
    } else if (platform === 'both') {
      // Buscar ambas plataformas em paralelo
      const [metaResult, googleResult] = await Promise.all([
        fetchMetaInsights(clientId, accountId, dateRange, compareWithPrevious).catch(err => null),
        fetchGoogleInsights(clientId, accountId, dateRange, compareWithPrevious).catch(err => null)
      ]);

      // Combinar resultados
      result = {
        success: true,
        platform: 'both',
        clientName: metaResult?.clientName || googleResult?.clientName || '',
        accountName: 'Meta + Google',
        dateRange,
        overview: {
          impressions: {
            current: (metaResult?.overview.impressions.current || 0) + (googleResult?.overview.impressions.current || 0),
            previous: (metaResult?.overview.impressions.previous || 0) + (googleResult?.overview.impressions.previous || 0),
            change: 0
          },
          reach: metaResult?.overview.reach || { current: 0, previous: 0, change: 0 },
          clicks: {
            current: (metaResult?.overview.clicks.current || 0) + (googleResult?.overview.clicks.current || 0),
            previous: (metaResult?.overview.clicks.previous || 0) + (googleResult?.overview.clicks.previous || 0),
            change: 0
          },
          ctr: { current: 0, previous: 0, change: 0 },
          conversions: {
            current: (metaResult?.overview.conversions.current || 0) + (googleResult?.overview.conversions.current || 0),
            previous: (metaResult?.overview.conversions.previous || 0) + (googleResult?.overview.conversions.previous || 0),
            change: 0
          },
          spend: {
            current: (metaResult?.overview.spend.current || 0) + (googleResult?.overview.spend.current || 0),
            previous: (metaResult?.overview.spend.previous || 0) + (googleResult?.overview.spend.previous || 0),
            change: 0
          },
          cpa: { current: 0, previous: 0, change: 0 },
          cpc: { current: 0, previous: 0, change: 0 }
        },
        campaigns: [...(metaResult?.campaigns || []), ...(googleResult?.campaigns || [])],
        timeSeries: [],
        metaData: metaResult || undefined,
        googleData: googleResult || undefined
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
      return new Response(
        JSON.stringify({ success: false, error: 'Plataforma inválida. Use: meta, google ou both' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`✅ [TRAFFIC-INSIGHTS] Success for ${platform}`);

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
