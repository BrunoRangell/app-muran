
import { CampaignStatus } from "../types";

export type AlertLevel = "critical" | "high" | "medium" | "low" | "ok";

export interface ProblemDiagnostic {
  type: "budget" | "performance" | "technical" | "configuration";
  severity: AlertLevel;
  description: string;
  suggestedAction: string;
  estimatedImpact?: string;
  lastActivity?: Date;
  affectedCampaigns?: number;
}

export interface EnhancedPlatformData {
  hasAccount: boolean;
  hasActiveCampaigns: boolean;
  costToday: number;
  impressionsToday: number;
  activeCampaignsCount: number;
  accountId?: string;
  accountName?: string;
  status: CampaignStatus;
  alertLevel: AlertLevel;
  problems: ProblemDiagnostic[];
  lastActivity?: Date;
  estimatedLoss?: number;
  quickActions: QuickAction[];
}

export interface QuickAction {
  id: string;
  label: string;
  type: "primary" | "secondary" | "danger";
  action: () => void;
  icon?: string;
}

export interface HealthAlert {
  id: string;
  clientId: string;
  clientName: string;
  platform: 'meta' | 'google';
  severity: AlertLevel;
  title: string;
  description: string;
  suggestedAction: string;
  estimatedImpact?: string;
  createdAt: Date;
}

export interface HealthDashboardStats {
  totalClients: number;
  criticalAlerts: number;
  highAlerts: number;
  mediumAlerts: number;
  estimatedLoss: number;
  functioning: number;
  trends: {
    criticalTrend: number; // % change from yesterday
    totalSpendTrend: number;
    healthScore: number; // 0-100
  };
}
