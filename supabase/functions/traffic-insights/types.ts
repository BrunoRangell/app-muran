export interface TrafficInsightsRequest {
  clientId: string;
  accountIds: string[];
  platform: 'meta' | 'google' | 'both';
  dateRange: {
    start: string;
    end: string;
  };
  compareWithPrevious?: boolean;
}

export interface MetricValue {
  current: number;
  previous: number;
  change: number;
}

export interface OverviewMetrics {
  impressions: MetricValue;
  reach: MetricValue;
  clicks: MetricValue;
  ctr: MetricValue;
  conversions: MetricValue;
  spend: MetricValue;
  cpa: MetricValue;
  cpc: MetricValue;
}

export interface CampaignInsight {
  id: string;
  name: string;
  platform: 'meta' | 'google';
  status: string;
  impressions: number;
  reach?: number;
  clicks: number;
  ctr: number;
  cpc: number;
  conversions: number;
  cpa: number;
  spend: number;
  frequency?: number;
  videoViews?: number;
}

export interface TimeSeriesData {
  date: string;
  impressions: number;
  clicks: number;
  conversions: number;
  spend: number;
}

export interface DemographicData {
  label: string;
  value: string;
  impressions: number;
  clicks: number;
  conversions: number;
  spend: number;
  ctr: number;
  cpa: number;
}

export interface Demographics {
  byAge: DemographicData[];
  byGender: DemographicData[];
  byLocation: DemographicData[];
}

export interface TopAd {
  id: string;
  name: string;
  platform: 'meta' | 'google';
  creative: {
    thumbnail?: string;
    title?: string;
    body?: string;
    type?: string;
  };
  metrics: {
    impressions: number;
    clicks: number;
    ctr: number;
    conversions: number;
    cpa: number;
    cpc: number;
    spend: number;
  };
}

export interface TrafficInsightsResponse {
  success: boolean;
  platform: 'meta' | 'google' | 'both';
  clientName: string;
  accountName: string;
  dateRange: {
    start: string;
    end: string;
  };
  overview: OverviewMetrics;
  campaigns: CampaignInsight[];
  timeSeries: TimeSeriesData[];
  demographics?: Demographics;
  topAds?: TopAd[];
  metaData?: TrafficInsightsResponse;
  googleData?: TrafficInsightsResponse;
  error?: string;
}
