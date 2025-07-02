
import { useMemo } from "react";
import { ClientHealthData, HealthStats } from "../types";

export function useCampaignHealthMetrics(data: ClientHealthData[] = []) {
  const metrics = useMemo(() => {
    const stats: HealthStats = {
      totalClients: data.length,
      clientsWithMeta: data.filter(client => client.metaAds && client.metaAds.length > 0).length,
      clientsWithGoogle: data.filter(client => client.googleAds && client.googleAds.length > 0).length,
      totalAccounts: data.reduce((acc, client) => {
        return acc + (client.metaAds?.length || 0) + (client.googleAds?.length || 0);
      }, 0),
      functioning: data.filter(client => {
        const metaActive = client.metaAds?.some(acc => acc.status === "active") || false;
        const googleActive = client.googleAds?.some(acc => acc.status === "active") || false;
        return metaActive || googleActive;
      }).length,
      noSpend: data.filter(client => {
        const metaNoSpend = client.metaAds?.some(acc => acc.status === "no-spend") || false;
        const googleNoSpend = client.googleAds?.some(acc => acc.status === "no-spend") || false;
        return metaNoSpend || googleNoSpend;
      }).length,
      noCampaigns: data.filter(client => {
        const metaNoCampaigns = client.metaAds?.some(acc => acc.status === "no-campaigns") || false;
        const googleNoCampaigns = client.googleAds?.some(acc => acc.status === "no-campaigns") || false;
        return metaNoCampaigns || googleNoCampaigns;
      }).length,
      notConfigured: data.filter(client => {
        const metaNotConfigured = client.metaAds?.some(acc => acc.status === "no-account") || false;
        const googleNotConfigured = client.googleAds?.some(acc => acc.status === "no-account") || false;
        return metaNotConfigured || googleNotConfigured;
      }).length,
    };

    const totalSpendToday = data.reduce((total, client) => {
      const metaSpend = client.metaAds?.reduce((sum, acc) => sum + acc.costToday, 0) || 0;
      const googleSpend = client.googleAds?.reduce((sum, acc) => sum + acc.costToday, 0) || 0;
      return total + metaSpend + googleSpend;
    }, 0);

    const totalImpressionsToday = data.reduce((total, client) => {
      const metaImpressions = client.metaAds?.reduce((sum, acc) => sum + acc.impressionsToday, 0) || 0;
      const googleImpressions = client.googleAds?.reduce((sum, acc) => sum + acc.impressionsToday, 0) || 0;
      return total + metaImpressions + googleImpressions;
    }, 0);

    const totalActiveCampaigns = data.reduce((total, client) => {
      const metaCampaigns = client.metaAds?.filter(acc => acc.hasActiveCampaigns).length || 0;
      const googleCampaigns = client.googleAds?.filter(acc => acc.hasActiveCampaigns).length || 0;
      return total + metaCampaigns + googleCampaigns;
    }, 0);

    const platformStats = {
      meta: {
        clients: data.filter(client => client.metaAds && client.metaAds.length > 0).length,
        spend: data.reduce((total, client) => {
          return total + (client.metaAds?.reduce((sum, acc) => sum + acc.costToday, 0) || 0);
        }, 0),
        campaigns: data.reduce((total, client) => {
          return total + (client.metaAds?.filter(acc => acc.hasActiveCampaigns).length || 0);
        }, 0),
        impressions: data.reduce((total, client) => {
          return total + (client.metaAds?.reduce((sum, acc) => sum + acc.impressionsToday, 0) || 0);
        }, 0),
      },
      google: {
        clients: data.filter(client => client.googleAds && client.googleAds.length > 0).length,
        spend: data.reduce((total, client) => {
          return total + (client.googleAds?.reduce((sum, acc) => sum + acc.costToday, 0) || 0);
        }, 0),
        campaigns: data.reduce((total, client) => {
          return total + (client.googleAds?.filter(acc => acc.hasActiveCampaigns).length || 0);
        }, 0),
        impressions: data.reduce((total, client) => {
          return total + (client.googleAds?.reduce((sum, acc) => sum + acc.impressionsToday, 0) || 0);
        }, 0),
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
