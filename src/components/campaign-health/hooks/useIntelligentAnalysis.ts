
import { useMemo } from "react";
import { ClientHealthData } from "./useCampaignHealthData";
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
      
      // Processar contas Meta Ads (agora assumindo múltiplas contas)
      if (client.metaAds) {
        // Se for uma única conta, converter para array
        const metaAccounts = Array.isArray(client.metaAds) ? client.metaAds : [client.metaAds];
        
        enhancedClient.metaAds = metaAccounts.map((account, index) => {
          const alertLevel = determineAlertLevel(
            account.costToday,
            account.impressionsToday || 0,
            account.hasActiveCampaigns ? 1 : 0, // Usar hasActiveCampaigns
            account.costToday === 0 && account.hasActiveCampaigns ? 1 : 0
          );
          
          const problems = generateProblems(
            account.costToday,
            account.impressionsToday || 0,
            account.hasActiveCampaigns ? 1 : 0,
            account.costToday === 0 && account.hasActiveCampaigns ? 1 : 0
          );
          
          if (problems.length > 0) {
            alerts.push({
              id: `${client.clientId}-meta-${account.accountId || index}`,
              clientId: client.clientId,
              clientName: client.clientName,
              platform: 'meta',
              accountId: account.accountId || '',
              accountName: account.accountName,
              alertLevel,
              problems,
              timestamp: new Date()
            });
          }
          
          return {
            accountId: account.accountId || '',
            accountName: account.accountName,
            hasAccount: account.hasAccount,
            activeCampaignsCount: account.hasActiveCampaigns ? 1 : 0,
            unservedCampaignsCount: account.costToday === 0 && account.hasActiveCampaigns ? 1 : 0,
            costToday: account.costToday,
            impressionsToday: account.impressionsToday || 0,
            alertLevel,
            problems,
            isPrimary: index === 0 // Primeira conta é considerada principal
          };
        });
      }
      
      // Processar contas Google Ads (agora assumindo múltiplas contas)
      if (client.googleAds) {
        // Se for uma única conta, converter para array
        const googleAccounts = Array.isArray(client.googleAds) ? client.googleAds : [client.googleAds];
        
        enhancedClient.googleAds = googleAccounts.map((account, index) => {
          const alertLevel = determineAlertLevel(
            account.costToday,
            account.impressionsToday || 0,
            account.hasActiveCampaigns ? 1 : 0, // Usar hasActiveCampaigns
            account.costToday === 0 && account.hasActiveCampaigns ? 1 : 0
          );
          
          const problems = generateProblems(
            account.costToday,
            account.impressionsToday || 0,
            account.hasActiveCampaigns ? 1 : 0,
            account.costToday === 0 && account.hasActiveCampaigns ? 1 : 0
          );
          
          if (problems.length > 0) {
            alerts.push({
              id: `${client.clientId}-google-${account.accountId || index}`,
              clientId: client.clientId,
              clientName: client.clientName,
              platform: 'google',
              accountId: account.accountId || '',
              accountName: account.accountName,
              alertLevel,
              problems,
              timestamp: new Date()
            });
          }
          
          return {
            accountId: account.accountId || '',
            accountName: account.accountName,
            hasAccount: account.hasAccount,
            activeCampaignsCount: account.hasActiveCampaigns ? 1 : 0,
            unservedCampaignsCount: account.costToday === 0 && account.hasActiveCampaigns ? 1 : 0,
            costToday: account.costToday,
            impressionsToday: account.impressionsToday || 0,
            alertLevel,
            problems,
            isPrimary: index === 0 // Primeira conta é considerada principal
          };
        });
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
