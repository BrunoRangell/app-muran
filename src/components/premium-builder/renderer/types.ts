// Tipos compartilhados para renderização premium-v2
export interface PremiumOverviewMetric {
  current: number;
  previous: number;
  change: number;
}

export interface PremiumDataContext {
  overview?: Record<string, PremiumOverviewMetric>;
  timeSeries?: Array<Record<string, any>>;
  demographics?: any;
  campaigns?: any[];
  topAds?: any[];
  metaData?: {
    overview?: Record<string, PremiumOverviewMetric>;
    timeSeries?: Array<Record<string, any>>;
    demographics?: any;
  };
  googleData?: {
    overview?: Record<string, PremiumOverviewMetric>;
    timeSeries?: Array<Record<string, any>>;
    demographics?: any;
  };
  platform?: 'meta' | 'google' | 'both';
  clientName?: string;
  dateRange?: { start: string; end: string };
}
