
import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ClientHealthData, HealthStats } from "../types";
import { getTodayInBrazil } from "@/utils/brazilTimezone";

const LAST_REFRESH_KEY = 'campaign-health-last-refresh';

export function useActiveCampaignHealth() {
  const [filterValue, setFilterValue] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [platformFilter, setPlatformFilter] = useState<string>("all");
  // Carregar timestamp do localStorage na inicialização
  const [lastRefreshTimestamp, setLastRefreshTimestamp] = useState<number | null>(() => {
    const saved = localStorage.getItem(LAST_REFRESH_KEY);
    return saved ? parseInt(saved, 10) : null;
  });
  const [isManualRefreshing, setIsManualRefreshing] = useState(false);
  const [refreshProgress, setRefreshProgress] = useState(0);

  const todayDate = getTodayInBrazil();

  // Função para salvar timestamp no localStorage
  const updateLastRefreshTimestamp = useCallback((timestamp: number) => {
    setLastRefreshTimestamp(timestamp);
    localStorage.setItem(LAST_REFRESH_KEY, timestamp.toString());
  }, []);

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
            overallStatus: "healthy",
          });
        }

        const client = clientsMap.get(clientId)!;
        
        const platformData = {
          accountId: record.client_accounts.account_id,
          accountName: record.client_accounts.account_name,
          hasAccount: record.has_account,
          hasActiveCampaigns: (record.active_campaigns_count || 0) > 0,
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
    // Configuração manual - sem atualização automática
    enabled: true,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    refetchOnReconnect: false,
    staleTime: Infinity, // Dados nunca ficam obsoletos automaticamente
  });

  const handleRefresh = useCallback(async () => {
    if (isManualRefreshing) return;
    
    setIsManualRefreshing(true);
    setRefreshProgress(0);
    
    try {
      console.log("🔄 Iniciando atualização manual...");
      
      // 1. Primeiro fazer limpeza dos dados antigos
      console.log("🧹 Executando limpeza automática...");
      const { data: cleanupResult, error: cleanupError } = await supabase.rpc('manual_cleanup_campaign_health');
      
      if (cleanupError) {
        console.warn("⚠️ Aviso na limpeza automática:", cleanupError);
      } else {
        console.log("✅ Limpeza automática concluída:", cleanupResult);
      }
      
      // 2. Buscar todas as contas ativas
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
      updateLastRefreshTimestamp(Date.now());
      
      // Refetch dos dados
      await refetch();
      
    } catch (error) {
      console.error("❌ Erro durante atualização manual:", error);
      throw error;
    } finally {
      setIsManualRefreshing(false);
      setRefreshProgress(0);
    }
  }, [isManualRefreshing, refetch, updateLastRefreshTimestamp]);

  const stats: HealthStats = {
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
    clientsWithMeta: data?.filter(client => client.metaAds && client.metaAds.length > 0).length || 0,
    clientsWithGoogle: data?.filter(client => client.googleAds && client.googleAds.length > 0).length || 0,
    functioning: data?.filter(client => {
      const metaFunctioning = client.metaAds?.some(account => account.costToday > 0 || (account.impressionsToday || 0) > 0);
      const googleFunctioning = client.googleAds?.some(account => account.costToday > 0 || (account.impressionsToday || 0) > 0);
      return metaFunctioning || googleFunctioning;
    }).length || 0,
    noSpend: data?.filter(client => {
      const metaNoSpend = client.metaAds?.every(account => account.costToday === 0 && (account.impressionsToday || 0) === 0);
      const googleNoSpend = client.googleAds?.every(account => account.costToday === 0 && (account.impressionsToday || 0) === 0);
      return metaNoSpend && googleNoSpend;
    }).length || 0,
    noCampaigns: data?.filter(client => {
      const metaNoCampaigns = client.metaAds?.every(account => (account.activeCampaignsCount || 0) === 0);
      const googleNoCampaigns = client.googleAds?.every(account => (account.activeCampaignsCount || 0) === 0);
      return metaNoCampaigns && googleNoCampaigns;
    }).length || 0,
    notConfigured: data?.filter(client => {
      return (!client.metaAds || client.metaAds.length === 0) && (!client.googleAds || client.googleAds.length === 0);
    }).length || 0,
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
