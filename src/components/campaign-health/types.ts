
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
  costToday: number;
  impressionsToday?: number;
  status: CampaignStatus;
  errors: string[];
}

export type CampaignStatus = 
  | "active" 
  | "no-spend" 
  | "no-campaigns" 
  | "no-account" 
  | "low-performance"
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
