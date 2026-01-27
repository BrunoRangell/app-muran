import { TopAd } from "./types.ts";

export async function fetchMetaTopAds(
  accountId: string,
  accessToken: string,
  since: string,
  until: string,
  limit: number = 10
): Promise<TopAd[]> {
  const fields = [
    'id',
    'name',
    'creative{title,body,thumbnail_url,image_url,object_story_spec}',
    'insights.time_range({"since":"' + since + '","until":"' + until + '"}).fields(impressions,clicks,ctr,spend,actions,cost_per_action_type)'
  ].join(',');

  const params = new URLSearchParams({
    access_token: accessToken,
    fields: fields,
    limit: '100',
    effective_status: '["ACTIVE","PAUSED"]'
  });

  const url = `https://graph.facebook.com/v22.0/${accountId}/ads?${params}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`❌ [META-ADS] Error fetching ads:`, response.statusText);
      return [];
    }

    const data = await response.json();
    const ads: TopAd[] = [];

    if (data.data && Array.isArray(data.data)) {
      for (const ad of data.data) {
        if (!ad.insights?.data?.[0]) continue;

        const insight = ad.insights.data[0];
        const impressions = parseInt(insight.impressions || '0');
        const clicks = parseInt(insight.clicks || '0');
        const spend = parseFloat(insight.spend || '0');
        const ctr = parseFloat(insight.ctr || '0');

        // Extract conversions
        let conversions = 0;
        if (insight.actions && Array.isArray(insight.actions)) {
          const convActions = insight.actions.filter((action: any) =>
            action.action_type === 'lead' ||
            action.action_type === 'purchase' ||
            action.action_type === 'omni_purchase'
          );
          conversions = convActions.reduce((sum: number, action: any) =>
            sum + parseInt(action.value || '0'), 0
          );
        }

        const cpa = conversions > 0 ? spend / conversions : 0;
        const cpc = clicks > 0 ? spend / clicks : 0;

        // Extract creative info
        const creative = ad.creative || {};
        const thumbnail = creative.thumbnail_url || creative.image_url || undefined;

        ads.push({
          id: ad.id,
          name: ad.name || 'Unnamed Ad',
          platform: 'meta',
          creative: {
            thumbnail,
            title: creative.title,
            body: creative.body,
            type: creative.object_story_spec?.link_data ? 'link' : 'image'
          },
          metrics: {
            impressions,
            clicks,
            ctr,
            conversions,
            cpa,
            cpc,
            spend
          }
        });
      }
    }

    // Sort by impressions and return top N
    return ads.sort((a, b) => b.metrics.impressions - a.metrics.impressions).slice(0, limit);
  } catch (error) {
    console.error(`❌ [META-ADS] Error:`, error);
    return [];
  }
}

export async function fetchGoogleTopAds(
  customerId: string,
  accessToken: string,
  developerToken: string,
  managerId: string | null,
  startDate: string,
  endDate: string,
  limit: number = 10
): Promise<TopAd[]> {
  const query = `
    SELECT
      ad_group_ad.ad.id,
      ad_group_ad.ad.name,
      ad_group_ad.ad.type,
      ad_group_ad.ad.responsive_display_ad.marketing_images,
      ad_group_ad.ad.image_ad.image_url,
      metrics.impressions,
      metrics.clicks,
      metrics.ctr,
      metrics.conversions,
      metrics.cost_per_conversion,
      metrics.average_cpc,
      metrics.cost_micros
    FROM ad_group_ad
    WHERE segments.date BETWEEN '${startDate}' AND '${endDate}'
    AND ad_group_ad.status IN ('ENABLED', 'PAUSED')
    AND metrics.impressions > 0
    ORDER BY metrics.impressions DESC
    LIMIT ${limit}
  `;

  const url = `https://googleads.googleapis.com/v21/customers/${customerId}/googleAds:search`;

  const headers: Record<string, string> = {
    'Authorization': `Bearer ${accessToken}`,
    'developer-token': developerToken,
    'Content-Type': 'application/json'
  };

  if (managerId) {
    headers['login-customer-id'] = managerId.replace(/-/g, '');
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({ query })
    });

    if (!response.ok) {
      console.error(`❌ [GOOGLE-ADS] Error fetching ads:`, response.statusText);
      return [];
    }

    const results = await response.json();
    const ads: TopAd[] = [];

    if (results?.results && Array.isArray(results.results)) {
      for (const row of results.results) {
        const ad = row.adGroupAd?.ad;
        const metrics = row.metrics;

        if (!ad || !metrics) continue;

        const impressions = parseInt(metrics.impressions || '0');
        const clicks = parseInt(metrics.clicks || '0');
        const spend = parseFloat(metrics.costMicros || '0') / 1000000;
        const conversions = parseFloat(metrics.conversions || '0');
        const ctr = parseFloat(metrics.ctr || '0') * 100;
        const cpa = parseFloat(metrics.costPerConversion || '0') / 1000000;
        const cpc = parseFloat(metrics.averageCpc || '0') / 1000000;

        // Extract thumbnail
        let thumbnail: string | undefined;
        if (ad.responsiveDisplayAd?.marketingImages?.[0]?.asset) {
          thumbnail = ad.responsiveDisplayAd.marketingImages[0].asset;
        } else if (ad.imageAd?.imageUrl) {
          thumbnail = ad.imageAd.imageUrl;
        }

        ads.push({
          id: ad.id?.toString() || 'unknown',
          name: ad.name || 'Unnamed Ad',
          platform: 'google',
          creative: {
            thumbnail,
            type: ad.type?.toLowerCase()
          },
          metrics: {
            impressions,
            clicks,
            ctr,
            conversions,
            cpa,
            cpc,
            spend
          }
        });
      }
    }

    return ads;
  } catch (error) {
    console.error(`❌ [GOOGLE-ADS] Error:`, error);
    return [];
  }
}

export function mergeTopAds(metaAds: TopAd[], googleAds: TopAd[], limit: number = 10): TopAd[] {
  const combined = [...metaAds, ...googleAds];
  return combined.sort((a, b) => b.metrics.impressions - a.metrics.impressions).slice(0, limit);
}
