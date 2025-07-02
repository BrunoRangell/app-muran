
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { formatDateForDisplay } from "@/utils/brazilTimezone";
import { ClientHealthData, CampaignStatus, PlatformAccountData } from "../types";

interface UnifiedAccountData {
  id: string;
  client_id: string;
  platform: 'meta' | 'google';
  account_id: string;
  account_name: string;
  is_primary: boolean;
  clients: {
    id: string;
    company_name: string;
  };
  campaign_health: Array<{
    has_account: boolean;
    active_campaigns_count: number;
    unserved_campaigns_count: number;
    cost_today: number;
    impressions_today: number;
    snapshot_date: string;
  }>;
}

const fetchActiveCampaignHealth = async (): Promise<ClientHealthData[]> => {
  console.log("🔍 Buscando dados de saúde das campanhas da estrutura unificada...");
  
  const today = new Date().toISOString().split('T')[0];
  
  // Buscar dados da estrutura unificada - REMOVIDO .order() que causava erro
  const { data: accountsData, error } = await supabase
    .from('client_accounts')
    .select(`
      id,
      client_id,
      platform,
      account_id,
      account_name,
      is_primary,
      clients!inner(
        id,
        company_name
      ),
      campaign_health!inner(
        has_account,
        active_campaigns_count,
        unserved_campaigns_count,
        cost_today,
        impressions_today,
        snapshot_date
      )
    `)
    .eq('status', 'active')
    .eq('clients.status', 'active')
    .eq('campaign_health.snapshot_date', today);

  if (error) {
    console.error("❌ Erro ao buscar dados da estrutura unificada:", error);
    throw error;
  }

  if (!accountsData || accountsData.length === 0) {
    console.log("⚠️ Nenhum dado encontrado para hoje na estrutura unificada");
    return [];
  }

  console.log(`✅ Estrutura unificada: ${accountsData.length} contas encontradas`);

  // Agrupar dados por cliente
  const clientsMap = new Map<string, ClientHealthData>();

  accountsData.forEach((account: UnifiedAccountData) => {
    const clientId = account.client_id;
    
    if (!clientsMap.has(clientId)) {
      clientsMap.set(clientId, {
        clientId,
        clientName: account.clients.company_name,
        metaAds: [],
        googleAds: [],
        overallStatus: "ok"
      });
    }

    const client = clientsMap.get(clientId)!;
    const healthData = account.campaign_health[0]; // Sempre haverá um item devido ao inner join

    const accountData: PlatformAccountData = {
      accountId: account.account_id,
      accountName: account.account_name,
      hasAccount: healthData.has_account,
      hasActiveCampaigns: healthData.active_campaigns_count > 0,
      costToday: healthData.cost_today,
      impressionsToday: healthData.impressions_today,
      status: determineAccountStatus(healthData),
      errors: generateErrors(healthData)
    };

    if (account.platform === 'meta') {
      client.metaAds = client.metaAds || [];
      client.metaAds.push(accountData);
    } else if (account.platform === 'google') {
      client.googleAds = client.googleAds || [];
      client.googleAds.push(accountData);
    }
  });

  // Converter para array e ordenar localmente por nome da empresa
  const result = Array.from(clientsMap.values()).sort((a, b) => 
    a.clientName.localeCompare(b.clientName, 'pt-BR', { 
      sensitivity: 'base',
      numeric: true 
    })
  );
  
  console.log(`✅ Estrutura unificada: Processados ${result.length} clientes (ordenados localmente)`);
  return result;
};

const determineAccountStatus = (healthData: any): CampaignStatus => {
  if (!healthData.has_account) return "no-account";
  if (healthData.active_campaigns_count === 0) return "no-campaigns";
  if (healthData.cost_today === 0) return "no-spend";
  if (healthData.cost_today > 0 && healthData.impressions_today < 100) return "low-performance";
  return "active";
};

const generateErrors = (healthData: any): string[] => {
  const errors: string[] = [];
  
  if (!healthData.has_account) {
    errors.push("Conta não configurada");
  } else if (healthData.active_campaigns_count === 0) {
    errors.push("Nenhuma campanha ativa");
  } else if (healthData.cost_today === 0) {
    errors.push("Sem veiculação hoje");
  } else if (healthData.impressions_today < 100) {
    errors.push("Baixo volume de impressões");
  }
  
  return errors;
};

export function useActiveCampaignHealth() {
  const [filterValue, setFilterValue] = useState("");
  const [statusFilter, setStatusFilter] = useState<CampaignStatus | "all">("all");
  const [platformFilter, setPlatformFilter] = useState<"all" | "meta" | "google">("all");
  const [isManualRefreshing, setIsManualRefreshing] = useState(false);
  const [lastRefreshTimestamp, setLastRefreshTimestamp] = useState(Date.now());

  const todayDate = new Date().toISOString().split('T')[0];

  const {
    data,
    isLoading,
    isFetching,
    error,
    refetch
  } = useQuery({
    queryKey: ['active-campaign-health-unified', todayDate],
    queryFn: fetchActiveCampaignHealth,
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
    refetchInterval: 5 * 60 * 1000, // Auto refresh a cada 5 minutos
    retry: 2
  });

  const handleRefresh = async () => {
    console.log("🔄 Executando refresh manual dos dados...");
    setIsManualRefreshing(true);
    
    try {
      // Executar a edge function para buscar dados atualizados das APIs
      const { data: refreshResult, error: refreshError } = await supabase.functions.invoke('active-campaigns-health');
      
      if (refreshError) {
        console.error("❌ Erro ao executar edge function:", refreshError);
      } else {
        console.log("✅ Edge function executada com sucesso:", refreshResult);
      }
      
      // Refetch os dados locais
      await refetch();
      setLastRefreshTimestamp(Date.now());
      
    } catch (error) {
      console.error("❌ Erro no refresh manual:", error);
    } finally {
      setIsManualRefreshing(false);
    }
  };

  // Calcular estatísticas corrigidas usando o hook useCampaignHealthMetrics
  const stats = {
    totalClients: data?.length || 0,
    clientsWithMeta: data?.filter(c => c.metaAds && c.metaAds.length > 0).length || 0,
    clientsWithGoogle: data?.filter(c => c.googleAds && c.googleAds.length > 0).length || 0,
    totalAccounts: data?.reduce((acc, client) => {
      return acc + (client.metaAds?.length || 0) + (client.googleAds?.length || 0);
    }, 0) || 0,
    functioning: data?.filter(client => {
      const metaActive = client.metaAds?.some(acc => acc.status === "active") || false;
      const googleActive = client.googleAds?.some(acc => acc.status === "active") || false;
      return metaActive || googleActive;
    }).length || 0,
    noSpend: data?.filter(client => {
      const metaNoSpend = client.metaAds?.some(acc => acc.status === "no-spend") || false;
      const googleNoSpend = client.googleAds?.some(acc => acc.status === "no-spend") || false;
      return metaNoSpend || googleNoSpend;
    }).length || 0,
    noCampaigns: data?.filter(client => {
      const metaNoCampaigns = client.metaAds?.some(acc => acc.status === "no-campaigns") || false;
      const googleNoCampaigns = client.googleAds?.some(acc => acc.status === "no-campaigns") || false;
      return metaNoCampaigns || googleNoCampaigns;
    }).length || 0,
    notConfigured: data?.filter(client => {
      const metaNotConfigured = client.metaAds?.some(acc => acc.status === "no-account") || false;
      const googleNotConfigured = client.googleAds?.some(acc => acc.status === "no-account") || false;
      return metaNotConfigured || googleNotConfigured;
    }).length || 0
  };

  return {
    data,
    isLoading,
    isFetching,
    error: error?.message,
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
    todayDate
  };
}
