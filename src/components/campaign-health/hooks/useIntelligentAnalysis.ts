
import { useMemo } from "react";
import { CampaignHealth } from "./useCampaignHealthData";
import { ClientHealthData } from "../types";
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

export function useIntelligentAnalysis(data: ClientHealthData[]) {
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
        const metaData = client.metaAds;
        const activeCampaignsCount = metaData.hasActiveCampaigns ? 1 : 0;
        const unservedCampaignsCount = metaData.costToday === 0 && metaData.hasActiveCampaigns ? 1 : 0;
        
        const alertLevel = determineAlertLevel(
          metaData.costToday,
          metaData.impressionsToday || 0,
          activeCampaignsCount,
          unservedCampaignsCount
        );
        
        const problems = generateProblems(
          metaData.costToday,
          metaData.impressionsToday || 0,
          activeCampaignsCount,
          unservedCampaignsCount
        );
        
        if (problems.length > 0) {
          alerts.push({
            id: `${client.clientId}-meta`,
            clientId: client.clientId,
            clientName: client.clientName,
            platform: 'meta',
            accountId: metaData.accountId || '',
            accountName: metaData.accountName,
            alertLevel,
            problems,
            timestamp: new Date()
          });
        }
        
        enhancedClient.metaAds = [{
          accountId: metaData.accountId || '',
          accountName: metaData.accountName,
          hasAccount: metaData.hasAccount,
          activeCampaignsCount,
          unservedCampaignsCount,
          costToday: metaData.costToday,
          impressionsToday: metaData.impressionsToday || 0,
          alertLevel,
          problems,
          isPrimary: true
        }];
      }
      
      // Processar contas Google Ads
      if (client.googleAds) {
        const googleData = client.googleAds;
        const activeCampaignsCount = googleData.hasActiveCampaigns ? 1 : 0;
        const unservedCampaignsCount = googleData.costToday === 0 && googleData.hasActiveCampaigns ? 1 : 0;
        
        const alertLevel = determineAlertLevel(
          googleData.costToday,
          googleData.impressionsToday || 0,
          activeCampaignsCount,
          unservedCampaignsCount
        );
        
        const problems = generateProblems(
          googleData.costToday,
          googleData.impressionsToday || 0,
          activeCampaignsCount,
          unservedCampaignsCount
        );
        
        if (problems.length > 0) {
          alerts.push({
            id: `${client.clientId}-google`,
            clientId: client.clientId,
            clientName: client.clientName,
            platform: 'google',
            accountId: googleData.accountId || '',
            accountName: googleData.accountName,
            alertLevel,
            problems,
            timestamp: new Date()
          });
        }
        
        enhancedClient.googleAds = [{
          accountId: googleData.accountId || '',
          accountName: googleData.accountName,
          hasAccount: googleData.hasAccount,
          activeCampaignsCount,
          unservedCampaignsCount,
          costToday: googleData.costToday,
          impressionsToday: googleData.impressionsToday || 0,
          alertLevel,
          problems,
          isPrimary: true
        }];
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
