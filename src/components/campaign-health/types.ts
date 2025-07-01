
export type CampaignStatus = "active" | "no-spend" | "no-campaigns" | "no-account" | "low-performance";

export interface PlatformAccountData {
  accountId: string;
  accountName: string;
  hasAccount: boolean;
  hasActiveCampaigns: boolean;
  costToday: number;
  impressionsToday: number;
  status: CampaignStatus;
  errors: string[];
}

export interface ClientHealthData {
  clientId: string;
  clientName: string;
  metaAds?: PlatformAccountData[];
  googleAds?: PlatformAccountData[];
}

export interface HealthStats {
  totalClients: number;
  clientsWithMeta: number;
  clientsWithGoogle: number;
  totalAccounts: number;
  functioning: number;
  noSpend: number;
  noCampaigns: number;
  notConfigured: number;
}
