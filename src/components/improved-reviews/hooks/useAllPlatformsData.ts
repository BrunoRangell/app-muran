import { useMemo, useState } from "react";
import { useUnifiedReviewsData } from "./useUnifiedReviewsData";
import { useGoogleAdsData } from "./useGoogleAdsData";

export interface PlatformAccount {
  platform: "meta" | "google";
  clientData: any;
}

export interface ClientGroup {
  clientId: string;
  clientName: string;
  accounts: PlatformAccount[];
}

export interface AllPlatformsMetrics {
  totalClients: number;
  totalAccounts: number;
  totalBudget: number;
  totalSpent: number;
  spentPercentage: number;
  metaAccounts: number;
  googleAccounts: number;
  clientsNeedingAdjustment: number;
}

export function useAllPlatformsData() {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: metaData, isLoading: metaLoading } = useUnifiedReviewsData();
  const { data: googleData, isLoading: googleLoading } = useGoogleAdsData();

  const isLoading = metaLoading || googleLoading;

  const { groups, metrics } = useMemo(() => {
    const clientMap = new Map<string, ClientGroup>();

    // Add Meta accounts
    if (metaData && Array.isArray(metaData)) {
      for (const client of metaData) {
        if (!client?.id || !client?.company_name) continue;
        if (!clientMap.has(client.id)) {
          clientMap.set(client.id, {
            clientId: client.id,
            clientName: client.company_name,
            accounts: [],
          });
        }
        clientMap.get(client.id)!.accounts.push({
          platform: "meta",
          clientData: client,
        });
      }
    }

    // Add Google accounts
    if (googleData && Array.isArray(googleData)) {
      for (const client of googleData) {
        if (!client?.id || !client?.company_name) continue;
        if (!clientMap.has(client.id)) {
          clientMap.set(client.id, {
            clientId: client.id,
            clientName: client.company_name,
            accounts: [],
          });
        }
        clientMap.get(client.id)!accounts.push({
          platform: "google",
          clientData: client,
        });
      }
    }

    const allGroups = Array.from(clientMap.values()).sort((a, b) =>
      a.clientName.localeCompare(b.clientName)
    );

    // Metrics
    let totalBudget = 0;
    let totalSpent = 0;
    let metaAccounts = 0;
    let googleAccounts = 0;
    let clientsNeedingAdjustment = 0;

    for (const group of allGroups) {
      let groupNeedsAdjustment = false;
      for (const acc of group.accounts) {
        if (acc.platform === "meta") metaAccounts++;
        else googleAccounts++;

        totalBudget += acc.clientData.budget_amount || 0;
        totalSpent += acc.clientData.review?.total_spent || 0;

        if (acc.clientData.needsAdjustment) groupNeedsAdjustment = true;
      }
      if (groupNeedsAdjustment) clientsNeedingAdjustment++;
    }

    return {
      groups: allGroups,
      metrics: {
        totalClients: allGroups.length,
        totalAccounts: metaAccounts + googleAccounts,
        totalBudget,
        totalSpent,
        spentPercentage: totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0,
        metaAccounts,
        googleAccounts,
        clientsNeedingAdjustment,
      } as AllPlatformsMetrics,
    };
  }, [metaData, googleData]);

  const filteredGroups = useMemo(() => {
    if (!searchQuery) return groups;
    const q = searchQuery.toLowerCase();
    return groups.filter((g) => g.clientName.toLowerCase().includes(q));
  }, [groups, searchQuery]);

  return {
    groups: filteredGroups,
    allGroups: groups,
    metrics,
    isLoading,
    searchQuery,
    setSearchQuery,
  };
}
