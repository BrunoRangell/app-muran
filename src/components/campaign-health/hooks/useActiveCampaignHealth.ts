
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ClientHealthData } from "../types";
import { useState, useCallback } from "react";
import { getTodayInBrazil } from "@/utils/brazilTimezone";

export function useActiveCampaignHealth() {
  const [filterValue, setFilterValue] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [platformFilter, setPlatformFilter] = useState<string>("all");
  const [lastRefreshTimestamp, setLastRefreshTimestamp] = useState<number | null>(null);
  const [isManualRefreshing, setIsManualRefreshing] = useState(false);
  const [refreshProgress, setRefreshProgress] = useState(0);

  const todayDate = getTodayInBrazil();

  const {
    data,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useQuery({
    queryKey: ["active-campaign-health", todayDate],
    queryFn: async (): Promise<ClientHealthData[]> => {
      console.log("🔍 Buscando dados de saúde das campanhas para:", todayDate);
      
      const { data: healthData, error: healthError } = await supabase
        .from("campaign_health")
        .select(`
          *,
          client_accounts!inner(
            id,
            account_id,
            account_name,
            platform,
            is_primary,
            clients!inner(
              id,
              company_name,
              status
            )
          )
        `)
        .eq("snapshot_date", todayDate)
        .eq("client_accounts.status", "active")
        .eq("client_accounts.clients.status", "active");

      if (healthError) {
        console.error("❌ Erro ao buscar dados de saúde:", healthError);
        throw new Error(`Erro ao buscar dados: ${healthError.message}`);
      }

      console.log("📊 Dados brutos encontrados:", healthData?.length || 0);

      if (!healthData || healthData.length === 0) {
        console.log("⚠️ Nenhum dado encontrado para hoje");
        return [];
      }

      // Agrupar por cliente
      const clientsMap = new Map<string, ClientHealthData>();

      healthData.forEach((record: any) => {
        const clientId = record.client_accounts.clients.id;
        const clientName = record.client_accounts.clients.company_name;
        const platform = record.platform;

        if (!clientsMap.has(clientId)) {
          clientsMap.set(clientId, {
            clientId,
            clientName,
            metaAds: [],
            googleAds: [],
          });
        }

        const client = clientsMap.get(clientId)!;
        
        const platformData = {
          accountId: record.client_accounts.account_id,
          accountName: record.client_accounts.account_name,
          hasAccount: record.has_account,
          activeCampaignsCount: record.active_campaigns_count,
          unservedCampaignsCount: record.unserved_campaigns_count,
          costToday: Number(record.cost_today),
          impressionsToday: record.impressions_today,
          errors: [],
          status: "healthy" as const,
          campaignsDetailed: record.campaigns_detailed || []
        };

        if (platform === "meta") {
          client.metaAds!.push(platformData);
        } else if (platform === "google") {
          client.googleAds!.push(platformData);
        }
      });

      const result = Array.from(clientsMap.values());
      console.log("✅ Dados processados:", result.length, "clientes");
      
      return result;
    },
    refetchInterval: 5 * 60 * 1000, // 5 minutos
    staleTime: 2 * 60 * 1000, // 2 minutos
  });

  const handleRefresh = useCallback(async () => {
    if (isManualRefreshing) return;
    
    setIsManualRefreshing(true);
    setRefreshProgress(0);
    
    try {
      console.log("🔄 Iniciando atualização manual...");
      
      // Buscar todas as contas ativas
      const { data: accounts, error: accountsError } = await supabase
        .from('client_accounts')
        .select(`
          id,
          account_id,
          account_name,
          platform,
          clients!inner(
            id,
            company_name,
            status
          )
        `)
        .eq('status', 'active')
        .eq('clients.status', 'active');

      if (accountsError) {
        throw new Error(`Erro ao buscar contas: ${accountsError.message}`);
      }

      if (!accounts || accounts.length === 0) {
        console.log("⚠️ Nenhuma conta encontrada para atualizar");
        return;
      }

      console.log(`📊 Encontradas ${accounts.length} contas para atualizar`);

      // Processar contas em lotes
      const batchSize = 3;
      let processedCount = 0;

      for (let i = 0; i < accounts.length; i += batchSize) {
        const batch = accounts.slice(i, i + batchSize);
        
        const batchPromises = batch.map(async (account) => {
          try {
            console.log(`🔄 Atualizando conta ${account.platform}: ${account.account_name}`);
            
            const response = await supabase.functions.invoke('process-single-account-health', {
              body: { accountId: account.id }
            });
            
            if (response.error) {
              console.error(`❌ Erro ao atualizar conta ${account.id}:`, response.error);
              return { success: false, accountId: account.id, error: response.error };
            }
            
            console.log(`✅ Conta ${account.platform} atualizada: ${account.account_name}`);
            return { success: true, accountId: account.id };
          } catch (error) {
            console.error(`❌ Erro ao processar conta ${account.id}:`, error);
            return { success: false, accountId: account.id, error: error.message };
          }
        });

        await Promise.all(batchPromises);
        processedCount += batch.length;
        
        const progress = Math.round((processedCount / accounts.length) * 100);
        setRefreshProgress(progress);
        
        console.log(`📊 Progresso: ${processedCount}/${accounts.length} contas (${progress}%)`);
        
        // Pequeno delay entre lotes
        if (i + batchSize < accounts.length) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      console.log("✅ Atualização manual concluída!");
      setLastRefreshTimestamp(Date.now());
      
      // Refetch dos dados
      await refetch();
      
    } catch (error) {
      console.error("❌ Erro durante atualização manual:", error);
      throw error;
    } finally {
      setIsManualRefreshing(false);
      setRefreshProgress(0);
    }
  }, [isManualRefreshing, refetch]);

  const stats = {
    totalClients: data?.length || 0,
    totalAccounts: data?.reduce((acc, client) => {
      return acc + (client.metaAds?.length || 0) + (client.googleAds?.length || 0);
    }, 0) || 0,
    totalCost: data?.reduce((acc, client) => {
      const metaCost = client.metaAds?.reduce((sum, account) => sum + account.costToday, 0) || 0;
      const googleCost = client.googleAds?.reduce((sum, account) => sum + account.costToday, 0) || 0;
      return acc + metaCost + googleCost;
    }, 0) || 0,
    totalImpressions: data?.reduce((acc, client) => {
      const metaImpressions = client.metaAds?.reduce((sum, account) => sum + (account.impressionsToday || 0), 0) || 0;
      const googleImpressions = client.googleAds?.reduce((sum, account) => sum + (account.impressionsToday || 0), 0) || 0;
      return acc + metaImpressions + googleImpressions;
    }, 0) || 0,
  };

  return {
    data,
    isLoading,
    isFetching,
    error: error?.message || null,
    filterValue,
    setFilterValue,
    statusFilter,
    setStatusFilter,
    platformFilter,
    setPlatformFilter,
    handleRefresh,
    lastRefreshTimestamp,
    stats,
    isManualRefreshing,
    refreshProgress,
    todayDate,
  };
}
