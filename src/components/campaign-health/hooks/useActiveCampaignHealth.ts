import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CampaignHealthService } from "../services/campaignHealthService";
import { ClientHealthData, CampaignStatus, PlatformHealthData } from "../types";
import { getTodayInBrazil } from "@/utils/brazilTimezone";

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

// Função corrigida para processar APENAS dados de hoje (timezone brasileiro)
function processSnapshots(snapshots: any[]): ClientHealthData[] {
  const today = getTodayInBrazil();
  
  // Validação rigorosa: todos os snapshots devem ser de hoje (timezone brasileiro)
  const todaySnapshots = snapshots.filter(snapshot => 
    snapshot.snapshot_date === today
  );

  if (todaySnapshots.length !== snapshots.length) {
    console.warn(`⚠️ Removendo ${snapshots.length - todaySnapshots.length} snapshots que não são de hoje (timezone brasileiro)`);
  }

  if (todaySnapshots.length === 0) {
    console.log("❌ Nenhum snapshot de hoje encontrado (timezone brasileiro)");
    return [];
  }

  const clientMap = new Map<string, ClientHealthData>();

  todaySnapshots.forEach((snapshot) => {
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

  console.log(`✅ Processados ${processedData.length} clientes APENAS com dados de hoje (timezone brasileiro: ${today})`);
  return processedData;
}

// Busca dados RIGOROSAMENTE de hoje - sem fallbacks (timezone brasileiro)
async function fetchTodayOnlyCampaignHealth(): Promise<ClientHealthData[]> {
  const today = getTodayInBrazil();
  console.log(`🔍 Buscando dados RIGOROSAMENTE de hoje (timezone brasileiro): ${today}`);
  
  try {
    // Passo 1: Tentar buscar snapshots de hoje
    const todaySnapshots = await CampaignHealthService.fetchTodaySnapshots();
    
    // Passo 2: Validar que todos os dados são realmente de hoje
    if (!CampaignHealthService.validateDataIsFromToday(todaySnapshots)) {
      console.log("❌ Dados não são válidos para hoje (timezone brasileiro). Gerando novos dados...");
      
      // Passo 3: Se não há dados válidos de hoje, gerar
      const generateSuccess = await CampaignHealthService.generateTodaySnapshots();
      
      if (generateSuccess) {
        // Aguardar processamento
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Buscar novamente
        const newSnapshots = await CampaignHealthService.fetchTodaySnapshots();
        
        if (CampaignHealthService.validateDataIsFromToday(newSnapshots)) {
          console.log(`✅ Novos snapshots gerados com sucesso para hoje (timezone brasileiro)`);
          return processSnapshots(newSnapshots);
        }
      }

      console.log("❌ Falha ao gerar dados de hoje (timezone brasileiro). Retornando array vazio.");
      return [];
    }

    console.log(`✅ Dados válidos de hoje encontrados (timezone brasileiro): ${todaySnapshots.length} registros`);
    return processSnapshots(todaySnapshots);

  } catch (error) {
    console.error("❌ Erro ao buscar dados de hoje (timezone brasileiro):", error);
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
  const today = getTodayInBrazil();
  const queryKey = ["active-campaign-health", today]; // Cache baseado na data (timezone brasileiro)

  // Query para buscar APENAS dados de hoje (timezone brasileiro)
  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey,
    queryFn: fetchTodayOnlyCampaignHealth,
    staleTime: 5 * 60 * 1000, // 5 minutos
    refetchInterval: 10 * 60 * 1000, // Auto-refresh a cada 10 minutos
    refetchOnWindowFocus: false,
    retry: 2,
    retryDelay: 3000
  });

  // Invalidar cache automaticamente quando a data muda (timezone brasileiro)
  useEffect(() => {
    const checkDateChange = () => {
      const currentDate = getTodayInBrazil();
      const cachedDate = queryKey[1];
      
      if (currentDate !== cachedDate) {
        console.log(`📅 Data mudou de ${cachedDate} para ${currentDate} (timezone brasileiro). Invalidando cache...`);
        queryClient.removeQueries({ queryKey: ["active-campaign-health"] });
        window.location.reload(); // Force reload para garantir dados frescos
      }
    };

    // Verificar mudança de data a cada minuto
    const interval = setInterval(checkDateChange, 60000);
    return () => clearInterval(interval);
  }, [queryClient, queryKey]);

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

  // Função melhorada para atualizar APENAS dados de hoje (timezone brasileiro)
  const handleRefresh = async () => {
    console.log("🔄 Iniciando atualização manual APENAS para hoje (timezone brasileiro)...");
    setIsManualRefreshing(true);
    
    try {
      // Invalidar cache local
      await queryClient.removeQueries({ queryKey });
      
      // Forçar regeneração para hoje
      const forceRefreshSuccess = await CampaignHealthService.forceRefreshTodaySnapshots();
      
      if (!forceRefreshSuccess) {
        console.warn("⚠️ Edge function pode ter falhado, tentando refetch...");
      }
      
      // Aguardar processamento
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Refetch dos dados
      const result = await refetch();
      
      if (result.isSuccess) {
        setLastRefresh(new Date());
        console.log("✅ Atualização manual concluída para hoje (timezone brasileiro)!");
      } else {
        throw new Error("Falha ao buscar dados atualizados");
      }
      
    } catch (error) {
      console.error("❌ Erro durante atualização manual:", error);
      
      // Fallback: refetch simples
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
    isManualRefreshing,
    todayDate: today // Expor data atual para a UI (timezone brasileiro)
  };
}
