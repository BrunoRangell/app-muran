
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { ClientHealthData, CampaignStatus, PlatformHealthData, HealthStats } from "../types";

// Função para determinar o status baseado nos dados
function determineStatus(data: Omit<PlatformHealthData, 'status'>): CampaignStatus {
  if (!data.hasAccount) {
    return "nao-configurado";
  }
  
  if (!data.hasActiveCampaigns) {
    return "sem-campanhas";
  }
  
  if (data.costToday > 0 && data.impressionsToday > 0) {
    return "funcionando";
  } else {
    return "sem-veiculacao";
  }
}

// Função para determinar status geral do cliente
function determineOverallStatus(metaAds?: PlatformHealthData, googleAds?: PlatformHealthData): CampaignStatus {
  const platforms = [metaAds, googleAds].filter(Boolean);
  
  if (platforms.length === 0) return "nao-configurado";
  
  // Se alguma plataforma está funcionando, cliente está funcionando
  if (platforms.some(p => p?.status === "funcionando")) return "funcionando";
  
  // Se alguma plataforma tem campanhas mas sem veiculação
  if (platforms.some(p => p?.status === "sem-veiculacao")) return "sem-veiculacao";
  
  // Se alguma plataforma tem contas mas sem campanhas
  if (platforms.some(p => p?.status === "sem-campanhas")) return "sem-campanhas";
  
  return "nao-configurado";
}

// Busca dados da edge function e agrupa por cliente
async function fetchActiveCampaignHealth(): Promise<ClientHealthData[]> {
  console.log("🔍 Buscando dados de campanhas ativas...");
  
  try {
    const { data, error } = await supabase.functions.invoke('active-campaigns-health', {
      body: { timestamp: new Date().toISOString() }
    });

    if (error) {
      console.error("❌ Erro na edge function:", error);
      throw error;
    }

    if (!data?.success || !data?.data) {
      throw new Error("Resposta inválida da edge function");
    }

    // Agrupar dados por cliente
    const clientMap = new Map<string, ClientHealthData>();

    data.data.forEach((row: any) => {
      const clientId = row.clientId;
      
      if (!clientMap.has(clientId)) {
        clientMap.set(clientId, {
          clientId: row.clientId,
          clientName: row.clientName,
          overallStatus: "nao-configurado"
        });
      }

      const client = clientMap.get(clientId)!;
      
      const platformData: PlatformHealthData = {
        hasAccount: row.hasAccount,
        hasActiveCampaigns: row.hasActiveCampaigns,
        costToday: row.costToday,
        impressionsToday: row.impressionsToday,
        activeCampaignsCount: row.activeCampaignsCount,
        accountId: row.accountId,
        accountName: row.accountName,
        status: determineStatus(row)
      };

      if (row.platform === 'meta') {
        client.metaAds = platformData;
      } else if (row.platform === 'google') {
        client.googleAds = platformData;
      }
    });

    // Calcular status geral para cada cliente
    const processedData = Array.from(clientMap.values()).map(client => ({
      ...client,
      overallStatus: determineOverallStatus(client.metaAds, client.googleAds)
    }));

    console.log(`✅ Processados ${processedData.length} clientes agrupados`);
    return processedData;

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

  const queryClient = useQueryClient();
  const queryKey = ["active-campaign-health"];

  // Query para buscar dados com cache de 10 minutos
  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey,
    queryFn: fetchActiveCampaignHealth,
    staleTime: 10 * 60 * 1000, // 10 minutos
    refetchInterval: 10 * 60 * 1000, // Auto-refresh a cada 10 minutos
    refetchOnWindowFocus: false
  });

  // Filtrar dados
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
    
    return matchesName && matchesStatus && matchesPlatform;
  }) || [];

  // Função para atualizar dados (invalidar cache e buscar novos dados)
  const handleRefresh = async () => {
    console.log("🔄 Atualizando dados de campanhas...");
    await queryClient.invalidateQueries({ queryKey });
    await refetch();
    setLastRefresh(new Date());
    console.log("✅ Dados atualizados com sucesso");
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
  const stats: HealthStats = {
    totalClients: data?.length || 0,
    functioning: filteredData.filter(client => client.overallStatus === "funcionando").length,
    noSpend: filteredData.filter(client => client.overallStatus === "sem-veiculacao").length,
    noCampaigns: filteredData.filter(client => client.overallStatus === "sem-campanhas").length,
    notConfigured: filteredData.filter(client => client.overallStatus === "nao-configurado").length,
  };

  return {
    data: filteredData,
    isLoading,
    isFetching,
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
    stats
  };
}
