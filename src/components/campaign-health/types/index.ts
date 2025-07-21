
export interface CampaignDetail {
  id: string;
  name: string;
  cost: number;
  impressions: number;
  status: string;
}

export interface PlatformAccountData {
  accountId: string;
  accountName: string;
  hasAccount: boolean;
  hasActiveCampaigns: boolean;
  activeCampaignsCount?: number;
  unservedCampaignsCount?: number;
  costToday: number;
  impressionsToday?: number;
  errors: string[];
  status: CampaignStatus;
  campaignsDetailed?: CampaignDetail[];
}

export interface ClientHealthData {
  clientId: string;
  clientName: string;
  companyEmail?: string;
  metaAds?: PlatformAccountData[];
  googleAds?: PlatformAccountData[];
  overallStatus: CampaignStatus;
}

export type CampaignStatus = 
  | "healthy" 
  | "warning" 
  | "critical" 
  | "no-data"
  | "active"
  | "no-spend"
  | "no-campaigns"
  | "no-account"
  | "low-performance";

export interface HealthStats {
  totalClients: number;
  totalAccounts: number;
  totalCost: number;
  totalImpressions: number;
  clientsWithMeta: number;
  clientsWithGoogle: number;
  functioning: number;
  noSpend: number;
  noCampaigns: number;
  notConfigured: number;
}
