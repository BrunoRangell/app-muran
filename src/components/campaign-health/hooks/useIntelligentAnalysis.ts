
import { useMemo } from "react";
import { ClientHealthData } from "../types";
import { 
  EnhancedClientData, 
  EnhancedPlatformData, 
  AlertLevel, 
  HealthProblem, 
  HealthAlert, 
  DashboardStats,
  CampaignDetail
} from "../types/enhanced-types";

function determineAlertLevel(
  costToday: number,
  impressionsToday: number,
  activeCampaignsCount: number,
  unservedCampaignsCount: number
): AlertLevel {
  // 🔴 CRÍTICO: Todas as campanhas ativas sem veiculação (custo = 0 e impressões = 0)
  if (activeCampaignsCount > 0 && unservedCampaignsCount === activeCampaignsCount) {
    return "critical";
  }
  
  // 🟠 ALTO: Algumas campanhas ativas sem veiculação (não todas)
  if (activeCampaignsCount > 0 && unservedCampaignsCount > 0 && unservedCampaignsCount < activeCampaignsCount) {
    return "high";
  }
  
  // 🟡 MÉDIO: Nenhuma campanha ativa na conta
  if (activeCampaignsCount === 0) {
    return "medium";
  }
  
  // 🟢 OK: Todas as outras situações (veiculação e impressões > 0)
  return "ok";
}

function generateProblems(
  costToday: number,
  impressionsToday: number,
  activeCampaignsCount: number,
  unservedCampaignsCount: number
): HealthProblem[] {
  const problems: HealthProblem[] = [];
  
  // 🔴 CRÍTICO: Todas as campanhas ativas sem veiculação
  if (activeCampaignsCount > 0 && unservedCampaignsCount === activeCampaignsCount) {
    problems.push({
      type: "all-campaigns-no-serving",
      description: "Nenhuma campanha está rodando",
      severity: "critical"
    });
  }
  // 🟠 ALTO: Algumas campanhas ativas sem veiculação
  else if (activeCampaignsCount > 0 && unservedCampaignsCount > 0 && unservedCampaignsCount < activeCampaignsCount) {
    problems.push({
      type: "some-campaigns-no-serving",
      description: "Algumas campanhas estão sem veiculação",
      severity: "high"
    });
  }
  // 🟡 MÉDIO: Nenhuma campanha ativa na conta
  else if (activeCampaignsCount === 0) {
    problems.push({
      type: "no-active-campaigns",
      description: "Nenhuma campanha ativa na conta",
      severity: "medium"
    });
  }
  
  return problems;
}

// Simular dados detalhados das campanhas para compatibilidade com dados existentes
function generateMockCampaignDetails(
  activeCampaignsCount: number,
  unservedCampaignsCount: number,
  costToday: number,
  impressionsToday: number,
  platform: string
): CampaignDetail[] {
  const campaigns: CampaignDetail[] = [];
  
  // Se temos dados detalhados reais, eles virão da API
  // Esta função é apenas um fallback para dados legados
  
  if (activeCampaignsCount === 0) {
    return campaigns;
  }
  
  const servingCampaigns = activeCampaignsCount - unservedCampaignsCount;
  const avgCostPerServing = servingCampaigns > 0 ? costToday / servingCampaigns : 0;
  const avgImpressionsPerServing = servingCampaigns > 0 ? impressionsToday / servingCampaigns : 0;
  
  // Criar campanhas que estão veiculando
  for (let i = 0; i < servingCampaigns; i++) {
    campaigns.push({
      id: `mock-serving-${i}`,
      name: `Campanha ${platform} ${i + 1}`,
      cost: avgCostPerServing,
      impressions: Math.floor(avgImpressionsPerServing),
      status: 'ACTIVE'
    });
  }
  
  // Criar campanhas sem veiculação
  for (let i = 0; i < unservedCampaignsCount; i++) {
    campaigns.push({
      id: `mock-unserved-${i}`,
      name: `Campanha ${platform} Sem Veiculação ${i + 1}`,
      cost: 0,
      impressions: 0,
      status: 'ACTIVE'
    });
  }
  
  return campaigns;
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
      if (client.metaAds && client.metaAds.length > 0) {
        const metaDataArray: EnhancedPlatformData[] = [];
        
        client.metaAds.forEach((metaAccount, index) => {
          const activeCampaignsCount = metaAccount.activeCampaignsCount || 0;
          
          // CORREÇÃO: Calcular unservedCampaignsCount corretamente
          // Baseado em campanhas com impressões = 0 AND custo = 0
          const unservedCampaignsCount = (activeCampaignsCount > 0 && metaAccount.costToday === 0 && (metaAccount.impressionsToday || 0) === 0) 
            ? activeCampaignsCount 
            : 0;
          
          const alertLevel = determineAlertLevel(
            metaAccount.costToday,
            metaAccount.impressionsToday || 0,
            activeCampaignsCount,
            unservedCampaignsCount
          );
          
          const problems = generateProblems(
            metaAccount.costToday,
            metaAccount.impressionsToday || 0,
            activeCampaignsCount,
            unservedCampaignsCount
          );
          
          if (problems.length > 0) {
            alerts.push({
              id: `${client.clientId}-meta-${metaAccount.accountId || index}`,
              clientId: client.clientId,
              clientName: client.clientName,
              platform: 'meta',
              accountId: metaAccount.accountId || '',
              accountName: metaAccount.accountName,
              alertLevel,
              problems,
              timestamp: new Date()
            });
          }
          
          // Gerar dados detalhados mock se não houver dados reais
          const campaignsDetailed = generateMockCampaignDetails(
            activeCampaignsCount,
            unservedCampaignsCount,
            metaAccount.costToday,
            metaAccount.impressionsToday || 0,
            'Meta'
          );
          
          metaDataArray.push({
            accountId: metaAccount.accountId || '',
            accountName: metaAccount.accountName,
            hasAccount: metaAccount.hasAccount,
            activeCampaignsCount,
            unservedCampaignsCount,
            costToday: metaAccount.costToday,
            impressionsToday: metaAccount.impressionsToday || 0,
            alertLevel,
            problems,
            isPrimary: index === 0,
            campaignsDetailed
          });
        });
        
        enhancedClient.metaAds = metaDataArray;
      }
      
      // Processar contas Google Ads
      if (client.googleAds && client.googleAds.length > 0) {
        const googleDataArray: EnhancedPlatformData[] = [];
        
        client.googleAds.forEach((googleAccount, index) => {
          const activeCampaignsCount = googleAccount.activeCampaignsCount || 0;
          
          // CORREÇÃO: Calcular unservedCampaignsCount corretamente  
          const unservedCampaignsCount = (activeCampaignsCount > 0 && googleAccount.costToday === 0 && (googleAccount.impressionsToday || 0) === 0) 
            ? activeCampaignsCount 
            : 0;
          
          const alertLevel = determineAlertLevel(
            googleAccount.costToday,
            googleAccount.impressionsToday || 0,
            activeCampaignsCount,
            unservedCampaignsCount
          );
          
          const problems = generateProblems(
            googleAccount.costToday,
            googleAccount.impressionsToday || 0,
            activeCampaignsCount,
            unservedCampaignsCount
          );
          
          if (problems.length > 0) {
            alerts.push({
              id: `${client.clientId}-google-${googleAccount.accountId || index}`,
              clientId: client.clientId,
              clientName: client.clientName,
              platform: 'google',
              accountId: googleAccount.accountId || '',
              accountName: googleAccount.accountName,
              alertLevel,
              problems,
              timestamp: new Date()
            });
          }
          
          // Gerar dados detalhados mock se não houver dados reais
          const campaignsDetailed = generateMockCampaignDetails(
            activeCampaignsCount,
            unservedCampaignsCount,
            googleAccount.costToday,
            googleAccount.impressionsToday || 0,
            'Google'
          );
          
          googleDataArray.push({
            accountId: googleAccount.accountId || '',
            accountName: googleAccount.accountName,
            hasAccount: googleAccount.hasAccount,
            activeCampaignsCount,
            unservedCampaignsCount,
            costToday: googleAccount.costToday,
            impressionsToday: googleAccount.impressionsToday || 0,
            alertLevel,
            problems,
            isPrimary: index === 0,
            campaignsDetailed
          });
        });
        
        enhancedClient.googleAds = googleDataArray;
      }
      
      // Determinar status geral do cliente (pior case entre todas as contas)
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
