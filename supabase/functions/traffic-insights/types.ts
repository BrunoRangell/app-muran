export interface TrafficInsightsRequest {
  clientId: string;
  accountId: string;
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
  metaData?: TrafficInsightsResponse;
  googleData?: TrafficInsightsResponse;
  error?: string;
}
