
export type CampaignStatus = "funcionando" | "sem-veiculacao" | "sem-campanhas" | "nao-configurado";

export interface PlatformHealthData {
  hasAccount: boolean;
  hasActiveCampaigns: boolean;
  costToday: number;
  impressionsToday: number;
  activeCampaignsCount: number;
  accountId?: string;
  accountName?: string;
  status: CampaignStatus;
}

export interface ClientHealthData {
  clientId: string;
  clientName: string;
  metaAds?: PlatformHealthData;
  googleAds?: PlatformHealthData;
  overallStatus: CampaignStatus;
}

export interface HealthStats {
  totalClients: number;
  functioning: number;
  noSpend: number;
  noCampaigns: number;
  notConfigured: number;
}
