export interface DateRangeFilter {
  startDate: string;
  endDate: string;
}

export interface MetricVariation {
  current: number;
  previous: number;
  percentChange: number;
  absoluteChange: number;
}

export interface OverviewMetrics {
  reach: MetricVariation;
  boosted: MetricVariation;
  videoViews: MetricVariation;
  leads: MetricVariation;
  investment: MetricVariation;
}

export interface CampaignDetail {
  name: string;
  investment: number;
  reach: number;
  frequency?: number;
  cpm?: number;
  clicks: number;
  ctr: number;
  cpc: number;
  conversions: number;
  costPerConversion: number;
  impressions?: number;
}

export interface LeadsDataPoint {
  date: string;
  metaLeads: number;
  googleLeads: number;
  totalLeads: number;
  investment: number;
  costPerLead: number;
}

export interface FunnelData {
  impressions: number;
  clicks: number;
  conversions: number;
  clickRate: number;
  conversionRate: number;
}

export interface DemographicData {
  label: string;
  conversions: number;
  percentage: number;
}

export interface TrafficReportData {
  clientId: string;
  clientName: string;
  dateRange: DateRangeFilter;
  overview: OverviewMetrics;
  leadsTimeSeries: LeadsDataPoint[];
  metaCampaigns: CampaignDetail[];
  googleCampaigns: CampaignDetail[];
  metaFunnel: FunnelData;
  googleFunnel: FunnelData;
  demographics: {
    byAge: DemographicData[];
    byGender: DemographicData[];
  };
}
