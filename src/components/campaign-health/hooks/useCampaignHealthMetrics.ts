
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
      totalCost: data.reduce((acc, client) => {
        const metaCost = client.metaAds?.reduce((sum, account) => sum + account.costToday, 0) || 0;
        const googleCost = client.googleAds?.reduce((sum, account) => sum + account.costToday, 0) || 0;
        return acc + metaCost + googleCost;
      }, 0),
      totalImpressions: data.reduce((acc, client) => {
        const metaImpressions = client.metaAds?.reduce((sum, account) => sum + (account.impressionsToday || 0), 0) || 0;
        const googleImpressions = client.googleAds?.reduce((sum, account) => sum + (account.impressionsToday || 0), 0) || 0;
        return acc + metaImpressions + googleImpressions;
      }, 0),
      functioning: data.filter(client => {
        const metaActive = client.metaAds?.some(acc => acc.status === "active" || acc.status === "healthy") || false;
        const googleActive = client.googleAds?.some(acc => acc.status === "active" || acc.status === "healthy") || false;
        return metaActive || googleActive;
      }).length,
      noSpend: data.filter(client => {
        const metaNoSpend = client.metaAds?.some(acc => acc.status === "no-spend" || acc.costToday === 0) || false;
        const googleNoSpend = client.googleAds?.some(acc => acc.status === "no-spend" || acc.costToday === 0) || false;
        return metaNoSpend || googleNoSpend;
      }).length,
      noCampaigns: data.filter(client => {
        const metaNoCampaigns = client.metaAds?.some(acc => acc.status === "no-campaigns" || (acc.activeCampaignsCount || 0) === 0) || false;
        const googleNoCampaigns = client.googleAds?.some(acc => acc.status === "no-campaigns" || (acc.activeCampaignsCount || 0) === 0) || false;
        return metaNoCampaigns || googleNoCampaigns;
      }).length,
      notConfigured: data.filter(client => {
        const metaNotConfigured = client.metaAds?.some(acc => acc.status === "no-account") || false;
        const googleNotConfigured = client.googleAds?.some(acc => acc.status === "no-account") || false;
        return metaNotConfigured || googleNotConfigured;
      }).length,
    };

    // Usar activeCampaignsCount real ao invés de hasActiveCampaigns
    const totalActiveCampaigns = data.reduce((total, client) => {
      const metaCampaigns = client.metaAds?.reduce((sum, acc) => sum + (acc.activeCampaignsCount || 0), 0) || 0;
      const googleCampaigns = client.googleAds?.reduce((sum, acc) => sum + (acc.activeCampaignsCount || 0), 0) || 0;
      return total + metaCampaigns + googleCampaigns;
    }, 0);

    const platformStats = {
      meta: {
        clients: data.filter(client => client.metaAds && client.metaAds.length > 0).length,
        spend: data.reduce((total, client) => {
          return total + (client.metaAds?.reduce((sum, acc) => sum + acc.costToday, 0) || 0);
        }, 0),
        campaigns: data.reduce((total, client) => {
          return total + (client.metaAds?.reduce((sum, acc) => sum + (acc.activeCampaignsCount || 0), 0) || 0);
        }, 0),
        impressions: data.reduce((total, client) => {
          return total + (client.metaAds?.reduce((sum, acc) => sum + (acc.impressionsToday || 0), 0) || 0);
        }, 0),
      },
      google: {
        clients: data.filter(client => client.googleAds && client.googleAds.length > 0).length,
        spend: data.reduce((total, client) => {
          return total + (client.googleAds?.reduce((sum, acc) => sum + acc.costToday, 0) || 0);
        }, 0),
        campaigns: data.reduce((total, client) => {
          return total + (client.googleAds?.reduce((sum, acc) => sum + (acc.activeCampaignsCount || 0), 0) || 0);
        }, 0),
        impressions: data.reduce((total, client) => {
          return total + (client.googleAds?.reduce((sum, acc) => sum + (acc.impressionsToday || 0), 0) || 0);
        }, 0),
      }
    };

    const healthPercentage = stats.totalClients > 0 
      ? Math.round((stats.functioning / stats.totalClients) * 100)
      : 0;

    return {
      stats,
      totalSpendToday: stats.totalCost,
      totalImpressionsToday: stats.totalImpressions,
      totalActiveCampaigns,
      platformStats,
      healthPercentage
    };
  }, [data]);

  return metrics;
}
