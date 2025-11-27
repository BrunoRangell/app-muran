import { DemographicData, Demographics } from "./types.ts";

export function processDemographics(
  ageData: any[],
  genderData: any[],
  locationData: any[]
): Demographics {
  const processGroup = (data: any[], labelKey: string): DemographicData[] => {
    const grouped = new Map<string, DemographicData>();

    for (const item of data) {
      const label = item[labelKey] || 'Unknown';
      
      if (!grouped.has(label)) {
        grouped.set(label, {
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

      const demo = grouped.get(label)!;
      demo.impressions += parseInt(item.impressions || '0');
      demo.clicks += parseInt(item.clicks || '0');
      demo.conversions += parseFloat(item.conversions || '0');
      demo.spend += parseFloat(item.spend || '0');
    }

    // Calculate derived metrics
    return Array.from(grouped.values()).map(demo => {
      demo.ctr = demo.impressions > 0 ? (demo.clicks / demo.impressions) * 100 : 0;
      demo.cpa = demo.conversions > 0 ? demo.spend / demo.conversions : 0;
      return demo;
    }).sort((a, b) => b.impressions - a.impressions);
  };

  return {
    byAge: processGroup(ageData, 'age'),
    byGender: processGroup(genderData, 'gender'),
    byLocation: processGroup(locationData, 'region').slice(0, 10) // Top 10 locations
  };
}

export function mergeDemographics(meta?: Demographics, google?: Demographics): Demographics {
  const merge = (metaData: DemographicData[], googleData: DemographicData[]): DemographicData[] => {
    const merged = new Map<string, DemographicData>();

    const processArray = (arr: DemographicData[]) => {
      arr.forEach(item => {
        if (!merged.has(item.value)) {
          merged.set(item.value, { ...item });
        } else {
          const existing = merged.get(item.value)!;
          existing.impressions += item.impressions;
          existing.clicks += item.clicks;
          existing.conversions += item.conversions;
          existing.spend += item.spend;
        }
      });
    };

    if (metaData) processArray(metaData);
    if (googleData) processArray(googleData);

    // Recalculate derived metrics
    return Array.from(merged.values()).map(demo => {
      demo.ctr = demo.impressions > 0 ? (demo.clicks / demo.impressions) * 100 : 0;
      demo.cpa = demo.conversions > 0 ? demo.spend / demo.conversions : 0;
      return demo;
    }).sort((a, b) => b.impressions - a.impressions);
  };

  return {
    byAge: merge(meta?.byAge || [], google?.byAge || []),
    byGender: merge(meta?.byGender || [], google?.byGender || []),
    byLocation: merge(meta?.byLocation || [], google?.byLocation || []).slice(0, 10)
  };
}
