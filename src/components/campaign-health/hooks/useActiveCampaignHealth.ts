
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export type CampaignStatus = "funcionando" | "sem-veiculacao" | "sem-campanhas" | "nao-configurado";

export interface CampaignHealthRow {
  clientId: string;
  clientName: string;
  platform: 'meta' | 'google';
  hasAccount: boolean;
  hasActiveCampaigns: boolean;
  costToday: number;
  impressionsToday: number;
  activeCampaignsCount: number;
  accountId?: string;
  accountName?: string;
  status: CampaignStatus;
}

// Função para determinar o status baseado nos dados
function determineStatus(data: Omit<CampaignHealthRow, 'status'>): CampaignStatus {
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

// Busca dados da edge function
async function fetchActiveCampaignHealth(): Promise<CampaignHealthRow[]> {
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

    // Processar dados e adicionar status
    const processedData: CampaignHealthRow[] = data.data.map((row: any) => ({
      ...row,
      status: determineStatus(row)
    }));

    console.log(`✅ Processados ${processedData.length} registros de saúde`);
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

  // Query para buscar dados com cache de 10 minutos
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["active-campaign-health"],
    queryFn: fetchActiveCampaignHealth,
    staleTime: 10 * 60 * 1000, // 10 minutos
    refetchInterval: 10 * 60 * 1000 // Auto-refresh a cada 10 minutos
  });

  // Filtrar dados
  const filteredData = data?.filter(row => {
    const matchesName = filterValue === "" || 
      row.clientName.toLowerCase().includes(filterValue.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || row.status === statusFilter;
    
    const matchesPlatform = platformFilter === "all" || row.platform === platformFilter;
    
    return matchesName && matchesStatus && matchesPlatform;
  }) || [];

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
    totalClients: data ? new Set(data.map(row => row.clientId)).size : 0,
    functioning: filteredData.filter(row => row.status === "funcionando").length,
    noSpend: filteredData.filter(row => row.status === "sem-veiculacao").length,
    noCampaigns: filteredData.filter(row => row.status === "sem-campanhas").length,
    notConfigured: filteredData.filter(row => row.status === "nao-configurado").length,
  };

  return {
    data: filteredData,
    isLoading,
    error: error ? "Erro ao carregar dados de saúde das campanhas." : null,
    filterValue,
    setFilterValue,
    statusFilter,
    setStatusFilter,
    platformFilter,
    setPlatformFilter,
    handleAction,
    refetch,
    stats
  };
}
