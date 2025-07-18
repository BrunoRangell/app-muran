
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { formatDateForDisplay } from "@/utils/brazilTimezone";
import { ClientHealthData, CampaignStatus, PlatformAccountData } from "../types";

const fetchActiveCampaignHealth = async (): Promise<ClientHealthData[]> => {
  console.log("🔍 Iniciando busca de dados de saúde das campanhas...");
  
  const today = new Date().toISOString().split('T')[0];
  console.log("📅 Data de hoje:", today);
  
  try {
    // Primeira query: buscar todas as contas de clientes ativos
    console.log("🔍 Buscando contas de clientes...");
    const { data: accountsData, error: accountsError } = await supabase
      .from('client_accounts')
      .select('*')
      .eq('status', 'active');

    if (accountsError) {
      console.error("❌ Erro ao buscar contas de clientes:", accountsError);
      throw accountsError;
    }

    console.log(`📊 Encontradas ${accountsData?.length || 0} contas de clientes`);

    if (!accountsData || accountsData.length === 0) {
      console.log("⚠️ Nenhuma conta de cliente encontrada");
      return [];
    }

    // Segunda query: buscar todos os clientes ativos
    console.log("🔍 Buscando dados dos clientes...");
    const { data: clientsData, error: clientsError } = await supabase
      .from('clients')
      .select('*')
      .eq('status', 'active');

    if (clientsError) {
      console.error("❌ Erro ao buscar clientes:", clientsError);
      throw clientsError;
    }

    console.log(`👥 Encontrados ${clientsData?.length || 0} clientes ativos`);

    // Terceira query: buscar dados de saúde das campanhas para hoje
    console.log("🔍 Buscando dados de saúde das campanhas...");
    const { data: healthData, error: healthError } = await supabase
      .from('campaign_health')
      .select('*')
      .eq('snapshot_date', today);

    if (healthError) {
      console.error("❌ Erro ao buscar dados de saúde:", healthError);
      // Continuar mesmo com erro, mas mostrar que não há dados
    }

    console.log(`📈 Encontrados ${healthData?.length || 0} registros de saúde para hoje`);

    // Criar Map de clientes para lookup rápido
    const clientsMap = new Map();
    clientsData?.forEach(client => {
      clientsMap.set(client.id, client);
    });

    // Agrupar contas por cliente e fazer JOIN manual
    const clientAccountsMap = new Map<string, ClientHealthData>();

    accountsData.forEach((account: any) => {
      const client = clientsMap.get(account.client_id);
      
      if (!client) {
        console.warn(`⚠️ Cliente não encontrado para conta ${account.id}`);
        return;
      }

      const clientId = client.id;
      
      if (!clientAccountsMap.has(clientId)) {
        clientAccountsMap.set(clientId, {
          clientId,
          clientName: client.company_name,
          metaAds: [],
          googleAds: [],
          overallStatus: "no-data"
        });
      }

      const clientData = clientAccountsMap.get(clientId)!;
      
      // Buscar dados de saúde para esta conta
      const accountHealth = healthData?.find(h => 
        h.account_id === account.id && h.platform === account.platform
      );

      const accountData: PlatformAccountData = {
        accountId: account.account_id,
        accountName: account.account_name,
        hasAccount: accountHealth?.has_account ?? true,
        hasActiveCampaigns: (accountHealth?.active_campaigns_count || 0) > 0,
        activeCampaignsCount: accountHealth?.active_campaigns_count || 0,
        costToday: accountHealth?.cost_today ?? 0,
        impressionsToday: accountHealth?.impressions_today ?? 0,
        status: accountHealth ? determineAccountStatus(accountHealth) : "no-data",
        errors: accountHealth ? generateErrors(accountHealth) : ["Dados não disponíveis para hoje"]
      };

      if (account.platform === 'meta') {
        clientData.metaAds = clientData.metaAds || [];
        clientData.metaAds.push(accountData);
      } else if (account.platform === 'google') {
        clientData.googleAds = clientData.googleAds || [];
        clientData.googleAds.push(accountData);
      }
    });

    // Determinar status geral de cada cliente
    clientAccountsMap.forEach((client) => {
      const allAccounts = [...(client.metaAds || []), ...(client.googleAds || [])];
      
      if (allAccounts.some(acc => acc.status === "active")) {
        client.overallStatus = "active";
      } else if (allAccounts.some(acc => acc.status === "no-spend")) {
        client.overallStatus = "no-spend";
      } else if (allAccounts.some(acc => acc.status === "no-campaigns")) {
        client.overallStatus = "no-campaigns";
      } else if (allAccounts.some(acc => acc.status === "no-account")) {
        client.overallStatus = "no-account";
      } else {
        client.overallStatus = "no-data";
      }
    });

    // Converter para array e ordenar por nome da empresa
    const result = Array.from(clientAccountsMap.values()).sort((a, b) => 
      a.clientName.localeCompare(b.clientName, 'pt-BR', { 
        sensitivity: 'base',
        numeric: true 
      })
    );
    
    console.log(`✅ Processados ${result.length} clientes com dados de saúde`);
    
    return result;
    
  } catch (error) {
    console.error("❌ Erro geral na busca de dados:", error);
    throw error;
  }
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
  
  return errors.length > 0 ? errors : [];
};

export function useActiveCampaignHealth() {
  const [filterValue, setFilterValue] = useState("");
  const [statusFilter, setStatusFilter] = useState<CampaignStatus | "all">("all");
  const [platformFilter, setPlatformFilter] = useState<"all" | "meta" | "google">("all");
  const [isManualRefreshing, setIsManualRefreshing] = useState(false);
  const [lastManualRefreshTimestamp, setLastManualRefreshTimestamp] = useState<number | null>(null);
  const [refreshProgress, setRefreshProgress] = useState({
    current: 0,
    total: 0,
    currentAccount: '',
    platform: '',
    percentage: 0,
    estimatedTime: 0
  });

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
      // Buscar todas as contas para processar
      const { data: accountsToProcess, error: accountsError } = await supabase
        .from('client_accounts')
        .select(`
          id,
          account_name,
          platform,
          clients!inner(company_name, status)
        `)
        .eq('status', 'active')
        .eq('clients.status', 'active')
        .order('platform');

      if (accountsError) {
        throw accountsError;
      }

      // Ordenar por nome da empresa no frontend
      const sortedAccounts = accountsToProcess?.sort((a, b) => 
        a.clients.company_name.localeCompare(b.clients.company_name, 'pt-BR', { 
          sensitivity: 'base',
          numeric: true 
        })
      ) || [];

      const totalAccounts = sortedAccounts.length;
      console.log(`📊 Processando ${totalAccounts} contas`);
      
      // Resetar progresso
      setRefreshProgress({
        current: 0,
        total: totalAccounts,
        currentAccount: '',
        platform: '',
        percentage: 0,
        estimatedTime: 0
      });

      const startTime = Date.now();
      
      // Processar cada conta individualmente
      for (let i = 0; i < totalAccounts; i++) {
        const account = sortedAccounts[i];
        const clientName = account.clients.company_name;
        const platformName = account.platform === 'meta' ? 'Meta Ads' : 'Google Ads';
        
        console.log(`🔄 Processando ${i + 1}/${totalAccounts}: ${clientName} - ${platformName}`);
        
        // Atualizar progresso
        const currentProgress = i + 1;
        const percentage = Math.round((currentProgress / totalAccounts) * 100);
        const elapsedTime = (Date.now() - startTime) / 1000;
        const avgTimePerAccount = currentProgress > 0 ? elapsedTime / currentProgress : 2;
        const remainingAccounts = totalAccounts - currentProgress;
        const estimatedRemainingTime = Math.ceil(remainingAccounts * avgTimePerAccount / 60); // em minutos
        
        setRefreshProgress({
          current: currentProgress,
          total: totalAccounts,
          currentAccount: `${clientName} - ${platformName}`,
          platform: platformName,
          percentage,
          estimatedTime: estimatedRemainingTime
        });
        
        try {
          // Processar conta individual
          const { data: result, error: processError } = await supabase.functions.invoke(
            'process-single-account-health',
            {
              body: { accountId: account.id }
            }
          );
          
          if (processError) {
            console.error(`❌ Erro ao processar conta ${account.id}:`, processError);
          } else {
            console.log(`✅ Conta processada: ${result?.accountName}`);
          }
          
        } catch (error) {
          console.error(`❌ Erro no processamento da conta ${account.id}:`, error);
        }
        
        // Pequeno delay para não sobrecarregar as APIs
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      // Finalizar progresso
      setRefreshProgress({
        current: totalAccounts,
        total: totalAccounts,
        currentAccount: 'Concluído!',
        platform: '',
        percentage: 100,
        estimatedTime: 0
      });
      
      // Aguardar um pouco antes de refetch
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Refetch os dados locais
      console.log("🔄 Atualizando dados locais...");
      await refetch();
      
      // Atualizar timestamp
      setLastManualRefreshTimestamp(Date.now());
      
      console.log("✅ Refresh manual concluído com sucesso");
      
    } catch (error) {
      console.error("❌ Erro no refresh manual:", error);
    } finally {
      setIsManualRefreshing(false);
      // Limpar progresso após um delay
      setTimeout(() => {
        setRefreshProgress({
          current: 0,
          total: 0,
          currentAccount: '',
          platform: '',
          percentage: 0,
          estimatedTime: 0
        });
      }, 2000);
    }
  };

  // Calcular estatísticas
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
    lastRefreshTimestamp: lastManualRefreshTimestamp,
    stats,
    isManualRefreshing,
    refreshProgress,
    todayDate
  };
}
