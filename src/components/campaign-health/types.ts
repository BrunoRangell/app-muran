
export interface ClientHealthData {
  clientId: string;
  clientName: string;
  companyEmail?: string;
  metaAds?: PlatformAccountData[];
  googleAds?: PlatformAccountData[];
  overallStatus: CampaignStatus;
}

export interface PlatformAccountData {
  accountId: string;
  accountName: string;
  hasAccount: boolean;
  hasActiveCampaigns: boolean;
  activeCampaignsCount?: number;
  costToday: number;
  impressionsToday?: number;
  status: CampaignStatus;
  errors: string[];
  campaignsDetailed?: CampaignDetail[];
}

export interface CampaignDetail {
  id: string;
  name: string;
  cost: number;
  impressions: number;
  status: string;
}

export type CampaignStatus = 
  | "healthy"
  | "warning" 
  | "critical"
  | "no-data";

export interface CampaignHealthStats {
  totalClients: number;
  clientsWithMeta: number;
  clientsWithGoogle: number;
  totalAccounts: number;
  functioning: number;
  noSpend: number;
  noCampaigns: number;
  notConfigured: number;
}

export interface HealthStats {
  totalClients: number;
  clientsWithMeta: number;
  clientsWithGoogle: number;
  totalAccounts: number;
  totalCost: number;
  totalImpressions: number;
  functioning: number;
  noSpend: number;
  noCampaigns: number;
  notConfigured: number;
}
