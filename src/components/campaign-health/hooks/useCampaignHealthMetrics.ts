
import { useMemo } from "react";
import { ClientHealthData, HealthStats } from "../types";

export function useCampaignHealthMetrics(data: ClientHealthData[] = []) {
  const metrics = useMemo(() => {
    const stats: HealthStats = {
      totalClients: data.length,
      functioning: data.filter(client => client.overallStatus === "funcionando").length,
      noSpend: data.filter(client => client.overallStatus === "sem-veiculacao").length,
      noCampaigns: data.filter(client => client.overallStatus === "sem-campanhas").length,
      notConfigured: data.filter(client => client.overallStatus === "nao-configurado").length,
    };

    const totalSpendToday = data.reduce((total, client) => {
      const metaSpend = client.metaAds?.costToday || 0;
      const googleSpend = client.googleAds?.costToday || 0;
      return total + metaSpend + googleSpend;
    }, 0);

    const totalImpressionsToday = data.reduce((total, client) => {
      const metaImpressions = client.metaAds?.impressionsToday || 0;
      const googleImpressions = client.googleAds?.impressionsToday || 0;
      return total + metaImpressions + googleImpressions;
    }, 0);

    const totalActiveCampaigns = data.reduce((total, client) => {
      const metaCampaigns = client.metaAds?.activeCampaignsCount || 0;
      const googleCampaigns = client.googleAds?.activeCampaignsCount || 0;
      return total + metaCampaigns + googleCampaigns;
    }, 0);

    const platformStats = {
      meta: {
        clients: data.filter(client => !!client.metaAds).length,
        spend: data.reduce((total, client) => total + (client.metaAds?.costToday || 0), 0),
        campaigns: data.reduce((total, client) => total + (client.metaAds?.activeCampaignsCount || 0), 0),
        impressions: data.reduce((total, client) => total + (client.metaAds?.impressionsToday || 0), 0),
      },
      google: {
        clients: data.filter(client => !!client.googleAds).length,
        spend: data.reduce((total, client) => total + (client.googleAds?.costToday || 0), 0),
        campaigns: data.reduce((total, client) => total + (client.googleAds?.activeCampaignsCount || 0), 0),
        impressions: data.reduce((total, client) => total + (client.googleAds?.impressionsToday || 0), 0),
      }
    };

    const healthPercentage = stats.totalClients > 0 
      ? Math.round((stats.functioning / stats.totalClients) * 100)
      : 0;

    return {
      stats,
      totalSpendToday,
      totalImpressionsToday,
      totalActiveCampaigns,
      platformStats,
      healthPercentage
    };
  }, [data]);

  return metrics;
}
