
export type AlertLevel = "critical" | "high" | "medium" | "ok";

export interface HealthProblem {
  type: string;
  description: string;
  severity: AlertLevel;
}

export interface CampaignDetail {
  id: string;
  name: string;
  cost: number;
  impressions: number;
  status: string;
}

export interface EnhancedPlatformData {
  accountId: string;
  accountName?: string;
  hasAccount: boolean;
  activeCampaignsCount: number;
  unservedCampaignsCount: number;
  costToday: number;
  impressionsToday: number;
  alertLevel: AlertLevel;
  problems: HealthProblem[];
  isPrimary?: boolean;
  campaignsDetailed?: CampaignDetail[]; // Nova propriedade para dados detalhados
}

export interface EnhancedClientData {
  clientId: string;
  clientName: string;
  metaAds?: EnhancedPlatformData[];
  googleAds?: EnhancedPlatformData[];
  overallStatus: string;
}

export interface HealthAlert {
  id: string;
  clientId: string;
  clientName: string;
  platform: 'meta' | 'google';
  accountId: string;
  accountName?: string;
  alertLevel: AlertLevel;
  problems: HealthProblem[];
  timestamp: Date;
}

export interface DashboardStats {
  totalClients: number;
  criticalAlerts: number;
  highAlerts: number;
  mediumAlerts: number;
  totalActiveAccounts: number;
  accountsWithIssues: number;
}
