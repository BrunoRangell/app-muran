
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { ClientHealthData, CampaignStatus, PlatformHealthData, HealthStats } from "../types";

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

// Busca dados da tabela campaign_health_snapshots
async function fetchActiveCampaignHealth(): Promise<ClientHealthData[]> {
  console.log("🔍 Buscando dados de snapshots de saúde de campanhas...");
  
  try {
    // Buscar snapshots do dia atual
    const today = new Date().toISOString().split('T')[0];
    
    const { data: snapshots, error } = await supabase
      .from('campaign_health_snapshots')
      .select(`
        *,
        clients!inner(id, company_name)
      `)
      .eq('snapshot_date', today)
      .order('clients(company_name)');

    if (error) {
      console.error("❌ Erro ao buscar snapshots:", error);
      throw error;
    }

    if (!snapshots || snapshots.length === 0) {
      console.log("⚠️ Nenhum snapshot encontrado para hoje. Gerando dados...");
      
      // Se não há snapshots para hoje, chamar a edge function para gerar
      const { data: edgeData, error: edgeError } = await supabase.functions.invoke('active-campaigns-health', {
        body: { timestamp: new Date().toISOString() }
      });

      if (edgeError) {
        console.error("❌ Erro na edge function:", edgeError);
        // Em caso de erro, tentar buscar dados do último dia disponível
        const { data: lastSnapshots, error: lastError } = await supabase
          .from('campaign_health_snapshots')
          .select(`
            *,
            clients!inner(id, company_name)
          `)
          .order('snapshot_date', { ascending: false })
          .order('clients(company_name)')
          .limit(50);

        if (lastError || !lastSnapshots?.length) {
          console.log("⚠️ Nenhum dado histórico encontrado");
          return [];
        }

        console.log(`📅 Usando dados do último snapshot disponível`);
        return processSnapshots(lastSnapshots);
      }

      if (!edgeData?.success) {
        throw new Error("Erro ao gerar dados de saúde");
      }

      // Buscar novamente os snapshots após a geração
      const { data: newSnapshots, error: newError } = await supabase
        .from('campaign_health_snapshots')
        .select(`
          *,
          clients!inner(id, company_name)
        `)
        .eq('snapshot_date', today)
        .order('clients(company_name)');

      if (newError) {
        console.error("❌ Erro ao buscar novos snapshots:", newError);
        throw newError;
      }

      if (!newSnapshots || newSnapshots.length === 0) {
        console.log("⚠️ Ainda não há snapshots após gerar dados");
        return [];
      }

      return processSnapshots(newSnapshots);
    }

    return processSnapshots(snapshots);

  } catch (error) {
    console.error("❌ Erro ao buscar dados de saúde:", error);
    throw error;
  }
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

export function useActiveCampaignHealth() {
  const [filterValue, setFilterValue] = useState("");
  const [statusFilter, setStatusFilter] = useState<CampaignStatus | "all">("all");
  const [platformFilter, setPlatformFilter] = useState<'meta' | 'google' | 'all'>("all");
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const queryClient = useQueryClient();
  const queryKey = ["active-campaign-health"];

  // Query para buscar dados com cache de 5 minutos (mais rápido que antes)
  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey,
    queryFn: fetchActiveCampaignHealth,
    staleTime: 5 * 60 * 1000, // 5 minutos
    refetchInterval: 10 * 60 * 1000, // Auto-refresh a cada 10 minutos
    refetchOnWindowFocus: false,
    retry: 2,
    retryDelay: 3000
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

  // Função para atualizar dados (forçar regeneração de snapshots)
  const handleRefresh = async () => {
    console.log("🔄 Forçando atualização de dados...");
    
    try {
      // Invalidar cache local primeiro
      await queryClient.invalidateQueries({ queryKey });
      
      // Chamar edge function para gerar novos dados
      const { error: edgeError } = await supabase.functions.invoke('active-campaigns-health', {
        body: { 
          timestamp: new Date().toISOString(),
          forceRefresh: true 
        }
      });

      if (edgeError) {
        console.error("❌ Erro ao forçar atualização:", edgeError);
      }

      // Refetch dos dados
      await refetch();
      setLastRefresh(new Date());
      console.log("✅ Atualização forçada concluída");
    } catch (error) {
      console.error("❌ Erro durante refresh:", error);
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
