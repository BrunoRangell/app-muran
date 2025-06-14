import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CampaignHealthService } from "../services/campaignHealthService";
import { ClientHealthData, CampaignStatus, PlatformHealthData } from "../types";

// Função para determinar o status baseado nos dados
function determineStatus(hasAccount: boolean, activeCampaigns: number, costToday: number, impressionsToday: number): CampaignStatus {
  if (!hasAccount) {
    return "nao-configurado";
  }
  
  if (activeCampaigns === 0) {
    return "sem-campanhas";
  }
  
  if (costToday > 0 && impressionsToday > 0) {
    return "funcionando";
  } else {
    return "sem-veiculacao";
  }
}

// Função corrigida para determinar status geral do cliente
function determineOverallStatus(metaAds?: PlatformHealthData, googleAds?: PlatformHealthData): CampaignStatus {
  const platforms = [metaAds, googleAds].filter(Boolean);
  
  if (platforms.length === 0) return "nao-configurado";
  
  console.log("🔍 Determinando status geral:", {
    platforms: platforms.map(p => ({ status: p?.status, hasAccount: !!p })),
    metaStatus: metaAds?.status,
    googleStatus: googleAds?.status
  });
  
  // CORREÇÃO: Cliente só está "funcionando" se TODAS as contas configuradas estiverem funcionando
  const allFunctioning = platforms.every(p => p?.status === "funcionando");
  if (allFunctioning) {
    console.log("✅ Todas as plataformas funcionando");
    return "funcionando";
  }
  
  // Se não estão todas funcionando, priorizar o pior status
  // Ordem de prioridade: sem-veiculacao > sem-campanhas > nao-configurado
  if (platforms.some(p => p?.status === "sem-veiculacao")) {
    console.log("❌ Alguma plataforma sem veiculação");
    return "sem-veiculacao";
  }
  
  if (platforms.some(p => p?.status === "sem-campanhas")) {
    console.log("⚠️ Alguma plataforma sem campanhas");
    return "sem-campanhas";
  }
  
  console.log("➖ Status padrão: não configurado");
  return "nao-configurado";
}

// Processa os snapshots e converte para ClientHealthData
function processSnapshots(snapshots: any[]): ClientHealthData[] {
  const clientMap = new Map<string, ClientHealthData>();

  snapshots.forEach((snapshot) => {
    const clientId = snapshot.client_id;
    const clientName = snapshot.clients.company_name;
    
    if (!clientMap.has(clientId)) {
      clientMap.set(clientId, {
        clientId,
        clientName,
        overallStatus: "nao-configurado"
      });
    }

    const client = clientMap.get(clientId)!;
    
    // Processar Meta Ads
    if (snapshot.meta_has_account) {
      const metaStatus = determineStatus(
        snapshot.meta_has_account,
        snapshot.meta_active_campaigns_count,
        snapshot.meta_cost_today,
        snapshot.meta_impressions_today
      );

      client.metaAds = {
        hasAccount: snapshot.meta_has_account,
        hasActiveCampaigns: snapshot.meta_active_campaigns_count > 0,
        costToday: snapshot.meta_cost_today,
        impressionsToday: snapshot.meta_impressions_today,
        activeCampaignsCount: snapshot.meta_active_campaigns_count,
        accountId: snapshot.meta_account_id,
        accountName: snapshot.meta_account_name,
        status: metaStatus
      };
    }

    // Processar Google Ads
    if (snapshot.google_has_account) {
      const googleStatus = determineStatus(
        snapshot.google_has_account,
        snapshot.google_active_campaigns_count,
        snapshot.google_cost_today,
        snapshot.google_impressions_today
      );

      client.googleAds = {
        hasAccount: snapshot.google_has_account,
        hasActiveCampaigns: snapshot.google_active_campaigns_count > 0,
        costToday: snapshot.google_cost_today,
        impressionsToday: snapshot.google_impressions_today,
        activeCampaignsCount: snapshot.google_active_campaigns_count,
        accountId: snapshot.google_account_id,
        accountName: snapshot.google_account_name,
        status: googleStatus
      };
    }
  });

  // Calcular status geral para cada cliente
  const processedData = Array.from(clientMap.values()).map(client => ({
    ...client,
    overallStatus: determineOverallStatus(client.metaAds, client.googleAds)
  }));

  console.log(`✅ Processados ${processedData.length} clientes dos snapshots`);
  return processedData;
}

// Busca dados da tabela campaign_health_snapshots
async function fetchActiveCampaignHealth(): Promise<ClientHealthData[]> {
  console.log("🔍 Buscando dados de snapshots de saúde de campanhas...");
  
  try {
    // Buscar snapshots do dia atual primeiro
    const todaySnapshots = await CampaignHealthService.fetchTodaySnapshots();
    
    if (todaySnapshots && todaySnapshots.length > 0) {
      console.log(`✅ Encontrados ${todaySnapshots.length} snapshots de hoje`);
      return processSnapshots(todaySnapshots);
    }

    console.log("⚠️ Nenhum snapshot encontrado para hoje. Gerando dados...");
    
    // Se não há snapshots para hoje, tentar gerar
    const generateSuccess = await CampaignHealthService.generateSnapshots();
    
    if (generateSuccess) {
      // Aguardar um pouco para os dados serem processados
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Buscar novamente após gerar
      const newSnapshots = await CampaignHealthService.fetchTodaySnapshots();
      if (newSnapshots && newSnapshots.length > 0) {
        console.log(`✅ Snapshots gerados com sucesso: ${newSnapshots.length} registros`);
        return processSnapshots(newSnapshots);
      }
    }

    console.log("⚠️ Falha ao gerar dados. Usando dados históricos...");
    
    // Como fallback, buscar dados mais recentes disponíveis
    const latestSnapshots = await CampaignHealthService.fetchLatestSnapshots();
    if (latestSnapshots && latestSnapshots.length > 0) {
      console.log(`📅 Usando dados históricos: ${latestSnapshots.length} registros`);
      return processSnapshots(latestSnapshots);
    }

    console.log("⚠️ Nenhum dado encontrado");
    return [];

  } catch (error) {
    console.error("❌ Erro ao buscar dados de saúde:", error);
    throw error;
  }
}

export function useActiveCampaignHealth() {
  const [filterValue, setFilterValue] = useState("");
  const [statusFilter, setStatusFilter] = useState<CampaignStatus | "all">("all");
  const [platformFilter, setPlatformFilter] = useState<'meta' | 'google' | 'all'>("all");
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [isManualRefreshing, setIsManualRefreshing] = useState(false);

  const queryClient = useQueryClient();
  const queryKey = ["active-campaign-health"];

  // Query para buscar dados com cache de 5 minutos
  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey,
    queryFn: fetchActiveCampaignHealth,
    staleTime: 5 * 60 * 1000, // 5 minutos
    refetchInterval: 10 * 60 * 1000, // Auto-refresh a cada 10 minutos
    refetchOnWindowFocus: false,
    retry: 2,
    retryDelay: 3000
  });

  // Filtrar dados com logs para debug
  const filteredData = data?.filter(client => {
    const matchesName = filterValue === "" || 
      client.clientName.toLowerCase().includes(filterValue.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || client.overallStatus === statusFilter;
    
    let matchesPlatform = true;
    if (platformFilter !== "all") {
      if (platformFilter === "meta") {
        matchesPlatform = !!client.metaAds;
      } else if (platformFilter === "google") {
        matchesPlatform = !!client.googleAds;
      }
    }
    
    const passes = matchesName && matchesStatus && matchesPlatform;
    
    if (filterValue || statusFilter !== "all" || platformFilter !== "all") {
      console.log(`🔍 Filtro para ${client.clientName}:`, {
        matchesName,
        matchesStatus: { current: client.overallStatus, filter: statusFilter, matches: matchesStatus },
        matchesPlatform,
        passes
      });
    }
    
    return passes;
  }) || [];

  // Função melhorada para atualizar dados
  const handleRefresh = async () => {
    console.log("🔄 Iniciando atualização manual de dados...");
    setIsManualRefreshing(true);
    
    try {
      // Passo 1: Invalidar cache local
      console.log("📤 Invalidando cache local...");
      await queryClient.removeQueries({ queryKey });
      
      // Passo 2: Chamar edge function para forçar regeneração
      console.log("🔧 Chamando edge function para regenerar dados...");
      const forceRefreshSuccess = await CampaignHealthService.forceRefreshSnapshots();
      
      if (!forceRefreshSuccess) {
        console.warn("⚠️ Edge function pode ter falhado, tentando refetch mesmo assim...");
      }
      
      // Passo 3: Aguardar um tempo para os dados serem processados
      console.log("⏳ Aguardando processamento dos dados (5 segundos)...");
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Passo 4: Refetch dos dados
      console.log("📥 Buscando dados atualizados...");
      const result = await refetch();
      
      if (result.isSuccess) {
        setLastRefresh(new Date());
        console.log("✅ Atualização manual concluída com sucesso!");
      } else {
        console.error("❌ Falha no refetch após edge function");
        throw new Error("Falha ao buscar dados atualizados");
      }
      
    } catch (error) {
      console.error("❌ Erro durante atualização manual:", error);
      
      // Tentar um refetch simples como fallback
      console.log("🔄 Tentando refetch simples como fallback...");
      try {
        const fallbackResult = await refetch();
        if (fallbackResult.isSuccess) {
          setLastRefresh(new Date());
          console.log("✅ Fallback refetch bem-sucedido");
        }
      } catch (fallbackError) {
        console.error("❌ Fallback também falhou:", fallbackError);
      }
    } finally {
      setIsManualRefreshing(false);
    }
  };

  // Função para ações dos botões
  function handleAction(action: "details" | "review" | "configure", clientId: string, platform: 'meta' | 'google') {
    if (action === "details") {
      const platformParam = encodeURIComponent(platform);
      window.open(`/clientes/${clientId}?platform=${platformParam}`, "_blank");
    }
    
    if (action === "review") {
      const platformParam = encodeURIComponent(platform);
      window.open(`/revisao-diaria-avancada?clienteId=${clientId}&platform=${platformParam}`, "_blank");
    }
    
    if (action === "configure") {
      window.open(`/clientes/${clientId}`, "_blank");
    }
  }

  // Estatísticas para dashboard
  const stats = {
    totalClients: data?.length || 0,
    functioning: filteredData.filter(client => client.overallStatus === "funcionando").length,
    noSpend: filteredData.filter(client => client.overallStatus === "sem-veiculacao").length,
    noCampaigns: filteredData.filter(client => client.overallStatus === "sem-campanhas").length,
    notConfigured: filteredData.filter(client => client.overallStatus === "nao-configurado").length,
  };

  return {
    data: filteredData,
    isLoading,
    isFetching: isFetching || isManualRefreshing,
    error: error ? "Erro ao carregar dados de saúde das campanhas." : null,
    filterValue,
    setFilterValue,
    statusFilter,
    setStatusFilter,
    platformFilter,
    setPlatformFilter,
    handleAction,
    handleRefresh,
    lastRefresh,
    stats,
    isManualRefreshing
  };
}
