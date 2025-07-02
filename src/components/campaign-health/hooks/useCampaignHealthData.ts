
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

// Estrutura reformulada para separar Meta e Google Ads
export type CampaignStatus = "ok" | "warning" | "error" | "nodata";

export interface PlatformData {
  costToday: number;
  impressionsToday?: number;
  errors: string[];
  status: CampaignStatus;
  accountId?: string;
  accountName?: string;
  hasAccount?: boolean;
  hasActiveCampaigns?: boolean;
}

export interface CampaignHealth {
  clientId: string;
  clientName: string;
  companyEmail?: string;
  metaAds?: PlatformData | PlatformData[]; // Pode ser uma ou múltiplas contas
  googleAds?: PlatformData | PlatformData[]; // Pode ser uma ou múltiplas contas
}

// Função auxiliar para determinar status baseado nos dados
function determineStatus(
  costToday: number, 
  hasAccount: boolean, 
  hasReviewData: boolean
): { status: CampaignStatus; errors: string[] } {
  if (!hasAccount) {
    return { status: "nodata", errors: ["Conta não configurada"] };
  }
  
  if (!hasReviewData) {
    return { status: "nodata", errors: ["Dados não disponíveis"] };
  }
  
  if (costToday > 0) {
    return { status: "ok", errors: [] };
  } else {
    return { status: "error", errors: ["Sem veiculação hoje"] };
  }
}

// Busca dados reais de saúde das campanhas usando a nova estrutura unificada
async function fetchCampaignHealthData(): Promise<CampaignHealth[]> {
  console.log("🔍 Buscando dados de saúde das campanhas da nova estrutura unificada...");
  
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // Buscar dados da estrutura unificada: client_accounts + campaign_health - REMOVIDO .order() problemático
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
          company_name,
          contact_name
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
    const clientsMap = new Map<string, CampaignHealth>();

    accountsData.forEach((account: any) => {
      const clientId = account.client_id;
      
      if (!clientsMap.has(clientId)) {
        clientsMap.set(clientId, {
          clientId,
          clientName: account.clients.company_name,
          companyEmail: account.clients.contact_name || undefined,
          metaAds: [],
          googleAds: []
        });
      }

      const client = clientsMap.get(clientId)!;
      const healthData = account.campaign_health[0]; // Sempre haverá um item devido ao inner join

      const accountData: PlatformData = {
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
        (client.metaAds as PlatformData[]).push(accountData);
      } else if (account.platform === 'google') {
        (client.googleAds as PlatformData[]).push(accountData);
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

  } catch (error) {
    console.error("❌ Erro ao processar dados de saúde:", error);
    throw error;
  }
}

const determineAccountStatus = (healthData: any): CampaignStatus => {
  if (!healthData.has_account) return "nodata";
  if (healthData.active_campaigns_count === 0) return "nodata";
  if (healthData.cost_today === 0) return "error";
  if (healthData.cost_today > 0 && healthData.impressions_today < 100) return "warning";
  return "ok";
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
}

// Hook para buscar dados com refresh em massa usando a nova estrutura
async function triggerMassReview() {
  console.log("🔄 Iniciando revisão em massa...");
  
  try {
    // Executar a edge function para atualizar dados
    const { data, error } = await supabase.functions.invoke('active-campaigns-health', {
      body: { 
        timestamp: new Date().toISOString(),
        action: 'generate_snapshots',
        force_today_only: true
      }
    });

    if (error) {
      console.error("❌ Erro na edge function:", error);
      throw error;
    }

    console.log("✅ Edge function executada com sucesso:", data);
    return { success: 1, failed: 0, total: 1 };

  } catch (error) {
    console.error("❌ Erro na revisão em massa:", error);
    throw error;
  }
}

export function useCampaignHealthData() {
  const [filterValue, setFilterValue] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Query para buscar dados com cache de 5 minutos
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["campaign-health-multiple-accounts"],
    queryFn: fetchCampaignHealthData,
    staleTime: 5 * 60 * 1000, // 5 minutos
    refetchInterval: 5 * 60 * 1000 // Auto-refresh a cada 5 minutos
  });

  // Função para ações dos botões
  function handleAction(action: "details" | "review" | "mass-review", clientId?: string, platform?: string) {
    if (action === "details" && clientId && platform) {
      const platformParam = encodeURIComponent(platform.toLowerCase().replace(' ', ''));
      window.open(`/clientes/${clientId}?platform=${platformParam}`, "_blank");
    }
    
    if (action === "review" && clientId && platform) {
      const platformParam = encodeURIComponent(platform.toLowerCase().replace(' ', ''));
      window.open(`/revisao-diaria-avancada?clienteId=${clientId}&platform=${platformParam}`, "_blank");
    }
    
    if (action === "mass-review") {
      handleMassReview();
    }
  }

  // Revisão em massa com feedback
  async function handleMassReview() {
    setIsRefreshing(true);
    try {
      const results = await triggerMassReview();
      
      // Refetch dos dados após a revisão
      await refetch();
      
      console.log(`🎉 Revisão concluída: ${results.success}/${results.total} contas processadas`);
      
    } catch (error) {
      console.error("❌ Erro na revisão em massa:", error);
    } finally {
      setIsRefreshing(false);
    }
  }

  return {
    data,
    isLoading,
    error: error ? "Erro ao carregar dados de saúde das campanhas." : null,
    filterValue,
    setFilterValue,
    handleAction,
    isRefreshing,
    refetch
  };
}
