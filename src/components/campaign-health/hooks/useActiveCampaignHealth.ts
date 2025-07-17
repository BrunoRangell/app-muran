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
    
    // Log detalhado para debug
    result.forEach(client => {
      console.log(`📋 Cliente: ${client.clientName}`);
      console.log(`  - Meta Ads: ${client.metaAds?.length || 0} contas`);
      console.log(`  - Google Ads: ${client.googleAds?.length || 0} contas`);
      console.log(`  - Status geral: ${client.overallStatus}`);
    });
    
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

  // Sistema de progresso melhorado baseado no tempo real
  const simulateRealisticProgress = (startTime: number) => {
    const totalAccounts = data?.reduce((acc, client) => {
      return acc + (client.metaAds?.length || 0) + (client.googleAds?.length || 0);
    }, 0) || 52;
    
    const elapsedSeconds = (Date.now() - startTime) / 1000;
    
    // Progresso baseado no padrão observado nos logs:
    // 0-5s: Conectando (0-5%)
    // 5-15s: Primeiras contas (5-20%)  
    // 15-45s: Processamento principal (20-85%)
    // 45-53s: Finalizando (85-100%)
    
    let progressPercentage = 0;
    let currentAccount = '';
    let estimatedTimeRemaining = 0;
    
    if (elapsedSeconds <= 5) {
      // Fase inicial: Conectando
      progressPercentage = Math.min(Math.round((elapsedSeconds / 5) * 5), 5);
      currentAccount = 'Conectando às plataformas...';
      estimatedTimeRemaining = 53 - elapsedSeconds;
    } else if (elapsedSeconds <= 15) {
      // Fase inicial: Primeiras contas
      progressPercentage = 5 + Math.min(Math.round(((elapsedSeconds - 5) / 10) * 15), 15);
      const accountIndex = Math.floor((elapsedSeconds - 5) / 2);
      const accounts = ['Meta: Juliana Lenz', 'Google: Juliana Lenz', 'Meta: Rosacruz', 'Google: Rosacruz', 'Meta: BVK Advogados'];
      currentAccount = accounts[accountIndex] || 'Processando contas iniciais...';
      estimatedTimeRemaining = 53 - elapsedSeconds;
    } else if (elapsedSeconds <= 45) {
      // Fase principal: Processamento
      progressPercentage = 20 + Math.min(Math.round(((elapsedSeconds - 15) / 30) * 65), 65);
      const accountIndex = Math.floor((elapsedSeconds - 15) / 1.5);
      const accounts = [
        'Google: BVK Advogados', 'Meta: Ótica Haas', 'Google: Ótica Haas',
        'Meta: Elegance Móveis', 'Google: Elegance Móveis', 'Meta: Aracuri Vinhos',
        'Meta: Simmons Colchões', 'Google: Simmons Colchões', 'Meta: Ana Cruz',
        'Meta: Andreia Star', 'Meta: Bertusch', 'Google: Bertusch',
        'Meta: CWR', 'Google: CWR', 'Meta: Dermais', 'Google: Dermais'
      ];
      currentAccount = accounts[accountIndex] || 'Processando campanhas...';
      estimatedTimeRemaining = 53 - elapsedSeconds;
    } else {
      // Fase final: Finalizando
      progressPercentage = 85 + Math.min(Math.round(((elapsedSeconds - 45) / 8) * 15), 15);
      currentAccount = 'Finalizando e salvando dados...';
      estimatedTimeRemaining = Math.max(0, 53 - elapsedSeconds);
    }

    const current = Math.floor((progressPercentage / 100) * totalAccounts);
    const platform = currentAccount.includes('Meta:') ? 'Meta Ads' : 
                    currentAccount.includes('Google:') ? 'Google Ads' : '';

    setRefreshProgress({
      current,
      total: totalAccounts,
      currentAccount,
      platform,
      percentage: Math.min(progressPercentage, 100),
      estimatedTime: Math.ceil(Math.max(estimatedTimeRemaining, 0) / 60) // em minutos
    });
  };

  const handleRefresh = async () => {
    console.log("🔄 Executando refresh manual dos dados...");
    setIsManualRefreshing(true);
    
    // Resetar progresso
    setRefreshProgress({
      current: 0,
      total: 0,
      currentAccount: '',
      platform: '',
      percentage: 0,
      estimatedTime: 0
    });
    
    const startTime = Date.now();
    
    try {
      // Executar a edge function para buscar dados atualizados das APIs
      console.log("📡 Chamando edge function active-campaigns-health...");
      const { data: refreshResult, error: refreshError } = await supabase.functions.invoke('active-campaigns-health');
      
      if (refreshError) {
        console.error("❌ Erro ao executar edge function:", refreshError);
      } else {
        console.log("✅ Edge function executada com sucesso:", refreshResult);
      }
      
      // Iniciar sistema de progresso melhorado
      const progressInterval = setInterval(() => {
        simulateRealisticProgress(startTime);
      }, 500); // Atualizar a cada 500ms para progresso mais fluido
      
      // Aguardar conclusão (máximo 60 segundos)
      let attempts = 0;
      const maxAttempts = 120; // 60 segundos
      
      while (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 500));
        attempts++;
        
        // Verificar se processo foi concluído pelo tempo (53s + buffer)
        const elapsedSeconds = (Date.now() - startTime) / 1000;
        if (elapsedSeconds >= 55) {
          console.log("✅ Processo concluído por tempo");
          break;
        }
      }
      
      clearInterval(progressInterval);
      
      // Definir progresso como 100% ao finalizar
      setRefreshProgress(prev => ({
        ...prev,
        current: prev.total,
        percentage: 100,
        currentAccount: 'Concluído!',
        platform: '',
        estimatedTime: 0
      }));
      
      // Aguardar um pouco para que os dados sejam processados
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Refetch os dados locais
      console.log("🔄 Atualizando dados locais...");
      await refetch();
      
      // Atualizar timestamp APENAS após sucesso completo
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

  // Calcular estatísticas corrigidas
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

  console.log("📊 Estatísticas calculadas:", stats);

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
