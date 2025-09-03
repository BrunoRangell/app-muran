import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface CampaignDetail {
  id: string;
  name: string;
  cost: number;
  impressions: number;
  status: string;
}

export interface CampaignVeiculationInfo {
  status: "all_running" | "partial_running" | "none_running" | "no_campaigns" | "no_data";
  activeCampaigns: number;
  campaignsWithoutDelivery: number;
  message: string;
  badgeColor: string;
  campaignsDetailed: CampaignDetail[];
}

export function useCampaignVeiculationStatus(clientId: string, accountId: string, platform: "meta" | "google") {
  return useQuery({
    queryKey: ["campaign-veiculation", clientId, accountId, platform],
    queryFn: async (): Promise<CampaignVeiculationInfo> => {
      const today = new Date().toISOString().split('T')[0];
      
      // Buscar dados de saúde das campanhas para hoje
      const { data: campaignHealth, error } = await supabase
        .from("campaign_health")
        .select("campaigns_detailed, active_campaigns_count, unserved_campaigns_count")
        .eq("client_id", clientId)
        .eq("account_id", accountId)
        .eq("platform", platform)
        .eq("snapshot_date", today)
        .single();

      if (error) {
        console.log(`ℹ️ Nenhum dado de campanhas encontrado para ${clientId} (${platform}):`, error.message);
        return {
          status: "no_data",
          activeCampaigns: 0,
          campaignsWithoutDelivery: 0,
          message: "Dados não disponíveis",
          badgeColor: "bg-gray-100 text-gray-600 border-gray-200",
          campaignsDetailed: []
        };
      }

      const campaignsDetailed: CampaignDetail[] = Array.isArray(campaignHealth?.campaigns_detailed) 
        ? (campaignHealth.campaigns_detailed as unknown as CampaignDetail[]) 
        : [];
      const activeCampaignsCount = campaignHealth?.active_campaigns_count || 0;
      const unservedCampaignsCount = campaignHealth?.unserved_campaigns_count || 0;

      // Se não há campanhas ativas
      if (activeCampaignsCount === 0) {
        return {
          status: "no_campaigns",
          activeCampaigns: 0,
          campaignsWithoutDelivery: 0,
          message: "Nenhuma campanha ativa",
          badgeColor: "bg-yellow-100 text-yellow-800 border-yellow-200",
          campaignsDetailed: []
        };
      }

      // Usar unserved_campaigns_count diretamente do banco
      const campaignsWithoutDelivery = unservedCampaignsCount;

      // Determinar status
      if (campaignsWithoutDelivery === 0) {
        // Todas as campanhas rodando
        return {
          status: "all_running",
          activeCampaigns: activeCampaignsCount,
          campaignsWithoutDelivery: 0,
          message: "Todas as campanhas rodando",
          badgeColor: "bg-green-100 text-green-800 border-green-200",
          campaignsDetailed: campaignsDetailed
        };
      } else if (campaignsWithoutDelivery === activeCampaignsCount) {
        // Todas as campanhas sem veiculação
        return {
          status: "none_running",
          activeCampaigns: activeCampaignsCount,
          campaignsWithoutDelivery: campaignsWithoutDelivery,
          message: "Todas as campanhas com erro",
          badgeColor: "bg-red-100 text-red-800 border-red-200",
          campaignsDetailed: campaignsDetailed
        };
      } else {
        // Algumas campanhas sem veiculação
        return {
          status: "partial_running",
          activeCampaigns: activeCampaignsCount,
          campaignsWithoutDelivery: campaignsWithoutDelivery,
          message: `${campaignsWithoutDelivery} campanha${campaignsWithoutDelivery > 1 ? 's' : ''} sem veiculação`,
          badgeColor: "bg-amber-100 text-amber-800 border-amber-200",
          campaignsDetailed: campaignsDetailed
        };
      }
    },
    enabled: !!clientId && !!accountId,
    staleTime: 5 * 60 * 1000, // Cache por 5 minutos
    retry: false
  });
}