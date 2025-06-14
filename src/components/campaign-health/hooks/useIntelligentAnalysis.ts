
import { useMemo } from "react";
import { ClientHealthData } from "../types";
import { AlertLevel, ProblemDiagnostic, EnhancedPlatformData, HealthAlert, HealthDashboardStats } from "../types/enhanced-types";

export function useIntelligentAnalysis(data: ClientHealthData[]) {
  
  const analyzeAlertLevel = (
    hasAccount: boolean, 
    activeCampaigns: number, 
    costToday: number, 
    impressionsToday: number
  ): AlertLevel => {
    if (!hasAccount) return "medium";
    if (activeCampaigns === 0) return "medium";
    if (costToday > 0 && impressionsToday > 0) return "ok";
    if (costToday > 0 && impressionsToday === 0) return "critical";
    if (costToday === 0 && activeCampaigns > 0) return "high";
    return "medium";
  };

  const generateProblems = (
    hasAccount: boolean,
    activeCampaigns: number,
    costToday: number,
    impressionsToday: number,
    accountName?: string
  ): ProblemDiagnostic[] => {
    const problems: ProblemDiagnostic[] = [];

    if (!hasAccount) {
      problems.push({
        type: "configuration",
        severity: "medium",
        description: "Conta não configurada",
        suggestedAction: "Conectar conta publicitária",
        estimatedImpact: "Potencial de +R$ 1.500/mês"
      });
    } else if (activeCampaigns === 0) {
      problems.push({
        type: "configuration",
        severity: "medium", 
        description: "Nenhuma campanha ativa",
        suggestedAction: "Criar e ativar campanhas",
        estimatedImpact: "Sem veiculação ativa"
      });
    } else if (costToday > 0 && impressionsToday === 0) {
      problems.push({
        type: "performance",
        severity: "critical",
        description: "Gastando sem impressões",
        suggestedAction: "Verificar aprovação de anúncios",
        estimatedImpact: "Perda: R$ " + costToday.toFixed(2),
        affectedCampaigns: activeCampaigns
      });
    } else if (costToday === 0 && activeCampaigns > 0) {
      problems.push({
        type: "budget",
        severity: "high",
        description: "Campanhas ativas sem gasto",
        suggestedAction: "Verificar orçamento e aprovação",
        estimatedImpact: "Sem alcance atual",
        affectedCampaigns: activeCampaigns
      });
    }

    return problems;
  };

  const enhancedData = useMemo(() => {
    return data.map(client => {
      const enhancedMeta: EnhancedPlatformData | undefined = client.metaAds ? {
        ...client.metaAds,
        alertLevel: analyzeAlertLevel(
          client.metaAds.hasAccount,
          client.metaAds.activeCampaignsCount,
          client.metaAds.costToday,
          client.metaAds.impressionsToday
        ),
        problems: generateProblems(
          client.metaAds.hasAccount,
          client.metaAds.activeCampaignsCount,
          client.metaAds.costToday,
          client.metaAds.impressionsToday,
          client.metaAds.accountName
        ),
        quickActions: [] // Will be populated based on problems
      } : undefined;

      const enhancedGoogle: EnhancedPlatformData | undefined = client.googleAds ? {
        ...client.googleAds,
        alertLevel: analyzeAlertLevel(
          client.googleAds.hasAccount,
          client.googleAds.activeCampaignsCount,
          client.googleAds.costToday,
          client.googleAds.impressionsToday
        ),
        problems: generateProblems(
          client.googleAds.hasAccount,
          client.googleAds.activeCampaignsCount,
          client.googleAds.costToday,
          client.googleAds.impressionsToday,
          client.googleAds.accountName
        ),
        quickActions: [] // Will be populated based on problems
      } : undefined;

      return {
        ...client,
        metaAds: enhancedMeta,
        googleAds: enhancedGoogle
      };
    });
  }, [data]);

  const alerts = useMemo((): HealthAlert[] => {
    const alertsList: HealthAlert[] = [];
    
    enhancedData.forEach(client => {
      [client.metaAds, client.googleAds].forEach((platform, index) => {
        if (platform && platform.problems.length > 0) {
          const platformName = index === 0 ? 'meta' : 'google';
          platform.problems.forEach(problem => {
            alertsList.push({
              id: `${client.clientId}-${platformName}-${problem.type}`,
              clientId: client.clientId,
              clientName: client.clientName,
              platform: platformName,
              severity: problem.severity,
              title: problem.description,
              description: problem.suggestedAction,
              suggestedAction: problem.suggestedAction,
              estimatedImpact: problem.estimatedImpact,
              createdAt: new Date()
            });
          });
        }
      });
    });

    return alertsList.sort((a, b) => {
      const severityOrder = { critical: 4, high: 3, medium: 2, low: 1, ok: 0 };
      return severityOrder[b.severity] - severityOrder[a.severity];
    });
  }, [enhancedData]);

  const dashboardStats = useMemo((): HealthDashboardStats => {
    const criticalAlerts = alerts.filter(a => a.severity === "critical").length;
    const highAlerts = alerts.filter(a => a.severity === "high").length;
    const mediumAlerts = alerts.filter(a => a.severity === "medium").length;
    
    const totalSpend = enhancedData.reduce((acc, client) => {
      const metaCost = client.metaAds?.costToday || 0;
      const googleCost = client.googleAds?.costToday || 0;
      return acc + metaCost + googleCost;
    }, 0);

    // Calcular clientes "OK" - aqueles que têm pelo menos uma plataforma funcionando sem problemas críticos/altos/médios
    const functioning = enhancedData.filter(client => {
      const metaIsOk = client.metaAds && client.metaAds.alertLevel === "ok";
      const googleIsOk = client.googleAds && client.googleAds.alertLevel === "ok";
      const hasOkPlatform = metaIsOk || googleIsOk;
      
      // Verificar se não tem alertas críticos, altos ou médios
      const hasProblems = alerts.some(alert => 
        alert.clientId === client.clientId && 
        (alert.severity === "critical" || alert.severity === "high" || alert.severity === "medium")
      );
      
      return hasOkPlatform && !hasProblems;
    }).length;
    
    const healthScore = Math.max(0, 100 - (criticalAlerts * 20) - (highAlerts * 10) - (mediumAlerts * 5));

    console.log("📊 Dashboard Stats:", {
      totalClients: enhancedData.length,
      criticalAlerts,
      highAlerts,
      mediumAlerts,
      functioning,
      totalAlerts: alerts.length
    });

    return {
      totalClients: enhancedData.length,
      criticalAlerts,
      highAlerts, 
      mediumAlerts,
      estimatedLoss: criticalAlerts * 500 + highAlerts * 200, // Simplified calculation
      functioning,
      trends: {
        criticalTrend: 0, // Would need historical data
        totalSpendTrend: 0, // Would need historical data  
        healthScore
      }
    };
  }, [alerts, enhancedData]);

  return {
    enhancedData,
    alerts,
    dashboardStats
  };
}
