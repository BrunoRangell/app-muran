
export interface PlatformData {
  accountId?: string;
  accountName?: string;
  hasAccount: boolean;
  activeCampaignsCount?: number;
  unservedCampaignsCount?: number;
  costToday: number;
  impressionsToday?: number;
  errors: string[];
  status: CampaignStatus;
  campaignsDetailed?: CampaignDetail[];
}

export interface CampaignDetail {
  id: string;
  name: string;
  cost: number;
  impressions: number;
  status: string;
}

export interface ClientHealthData {
  clientId: string;
  clientName: string;
  companyEmail?: string;
  metaAds?: PlatformData[];
  googleAds?: PlatformData[];
}

export type CampaignStatus = "healthy" | "warning" | "critical" | "no-data";
