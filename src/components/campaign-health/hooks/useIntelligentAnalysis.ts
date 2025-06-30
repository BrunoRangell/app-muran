
import { useMemo } from "react";
import { CampaignHealth, PlatformData } from "./useCampaignHealthData";
import { 
  EnhancedClientData, 
  EnhancedPlatformData, 
  AlertLevel, 
  HealthProblem, 
  HealthAlert, 
  DashboardStats 
} from "../types/enhanced-types";

function determineAlertLevel(
  costToday: number,
  impressionsToday: number,
  activeCampaignsCount: number,
  unservedCampaignsCount: number
): AlertLevel {
  // Crítico: sem veiculação com campanhas ativas
  if (activeCampaignsCount > 0 && costToday === 0) {
    return "critical";
  }
  
  // Alto: campanhas sem veiculação
  if (unservedCampaignsCount > 0) {
    return "high";
  }
  
  // Médio: baixa performance
  if (costToday > 0 && impressionsToday < 100) {
    return "medium";
  }
  
  return "ok";
}

function generateProblems(
  costToday: number,
  impressionsToday: number,
  activeCampaignsCount: number,
  unservedCampaignsCount: number
): HealthProblem[] {
  const problems: HealthProblem[] = [];
  
  if (activeCampaignsCount > 0 && costToday === 0) {
    problems.push({
      type: "no-spend",
      description: "Sem veiculação com campanhas ativas",
      severity: "critical"
    });
  }
  
  if (unservedCampaignsCount > 0) {
    problems.push({
      type: "unserved-campaigns",
      description: `${unservedCampaignsCount} campanhas sem veiculação`,
      severity: "high"
    });
  }
  
  if (costToday > 0 && impressionsToday < 100) {
    problems.push({
      type: "low-impressions",
      description: "Baixo volume de impressões",
      severity: "medium"
    });
  }
  
  return problems;
}

function processPlatformData(
  platformDataArray: PlatformData | PlatformData[] | undefined,
  clientId: string,
  clientName: string,
  platform: 'meta' | 'google',
  alerts: HealthAlert[]
): EnhancedPlatformData[] {
  if (!platformDataArray) return [];
  
  const dataArray = Array.isArray(platformDataArray) ? platformDataArray : [platformDataArray];
  const enhancedPlatformArray: EnhancedPlatformData[] = [];
  
  dataArray.forEach((data, index) => {
    const activeCampaignsCount = data.hasActiveCampaigns ? 1 : 0;
    const unservedCampaignsCount = data.costToday === 0 && data.hasActiveCampaigns ? 1 : 0;
    
    const alertLevel = determineAlertLevel(
      data.costToday,
      data.impressionsToday || 0,
      activeCampaignsCount,
      unservedCampaignsCount
    );
    
    const problems = generateProblems(
      data.costToday,
      data.impressionsToday || 0,
      activeCampaignsCount,
      unservedCampaignsCount
    );
    
    if (problems.length > 0) {
      alerts.push({
        id: `${clientId}-${platform}-${data.accountId || index}`,
        clientId,
        clientName,
        platform,
        accountId: data.accountId || '',
        accountName: data.accountName,
        alertLevel,
        problems,
        timestamp: new Date()
      });
    }
    
    enhancedPlatformArray.push({
      accountId: data.accountId || '',
      accountName: data.accountName,
      hasAccount: data.hasAccount || false,
      activeCampaignsCount,
      unservedCampaignsCount,
      costToday: data.costToday,
      impressionsToday: data.impressionsToday || 0,
      alertLevel,
      problems,
      isPrimary: index === 0 // Primeira conta é considerada principal
    });
  });
  
  return enhancedPlatformArray;
}

export function useIntelligentAnalysis(data: CampaignHealth[]) {
  return useMemo(() => {
    const enhancedData: EnhancedClientData[] = [];
    const alerts: HealthAlert[] = [];
    
    data.forEach(client => {
      const enhancedClient: EnhancedClientData = {
        clientId: client.clientId,
        clientName: client.clientName,
        overallStatus: "ok"
      };
      
      // Processar contas Meta Ads
      if (client.metaAds) {
        const metaDataArray = processPlatformData(
          client.metaAds,
          client.clientId,
          client.clientName,
          'meta',
          alerts
        );
        enhancedClient.metaAds = metaDataArray;
      }
      
      // Processar contas Google Ads
      if (client.googleAds) {
        const googleDataArray = processPlatformData(
          client.googleAds,
          client.clientId,
          client.clientName,
          'google',
          alerts
        );
        enhancedClient.googleAds = googleDataArray;
      }
      
      // Determinar status geral do cliente
      const allAccounts = [
        ...(enhancedClient.metaAds || []),
        ...(enhancedClient.googleAds || [])
      ];
      
      if (allAccounts.some(acc => acc.alertLevel === "critical")) {
        enhancedClient.overallStatus = "critical";
      } else if (allAccounts.some(acc => acc.alertLevel === "high")) {
        enhancedClient.overallStatus = "high";
      } else if (allAccounts.some(acc => acc.alertLevel === "medium")) {
        enhancedClient.overallStatus = "medium";
      }
      
      enhancedData.push(enhancedClient);
    });
    
    // Calcular estatísticas do dashboard
    const dashboardStats: DashboardStats = {
      totalClients: enhancedData.length,
      criticalAlerts: alerts.filter(a => a.alertLevel === "critical").length,
      highAlerts: alerts.filter(a => a.alertLevel === "high").length,
      mediumAlerts: alerts.filter(a => a.alertLevel === "medium").length,
      totalActiveAccounts: enhancedData.reduce((acc, client) => {
        return acc + (client.metaAds?.length || 0) + (client.googleAds?.length || 0);
      }, 0),
      accountsWithIssues: alerts.length
    };
    
    return {
      enhancedData,
      alerts: alerts.sort((a, b) => {
        const severityOrder = { critical: 3, high: 2, medium: 1, ok: 0 };
        return severityOrder[b.alertLevel] - severityOrder[a.alertLevel];
      }),
      dashboardStats
    };
  }, [data]);
}
