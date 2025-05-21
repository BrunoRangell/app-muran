
import { useState } from "react";
import axios from "axios";
import { useGoogleAdsAuth } from "./useGoogleAdsAuth";

export interface GoogleAdsCampaign {
  campaignId: string;
  campaignName: string;
  status: string;
  budget?: number;
  spent?: number;
}

export const useGoogleAdsCampaigns = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [campaigns, setCampaigns] = useState<GoogleAdsCampaign[]>([]);
  const { getAuthHeaders } = useGoogleAdsAuth();

  const fetchCampaigns = async (customerId: string): Promise<GoogleAdsCampaign[]> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const query = `
        SELECT
            metrics.cost_micros,
            campaign.id,
            campaign.name,
            campaign.status,
            campaign_budget.amount_micros
        FROM
            campaign
      `;
      
      const headers = await getAuthHeaders(customerId);
      
      if (!headers) {
        throw new Error("Não foi possível obter headers de autenticação válidos");
      }
      
      try {
        const response = await axios.post(
          `https://googleads.googleapis.com/v18/customers/${customerId}/googleAds:search`,
          { query },
          { headers }
        );
        
        if (response.data && response.data.results) {
          const campaignsList = response.data.results.map((campaign: any) => ({
            campaignId: campaign.campaign?.id || 'Não disponível',
            campaignName: campaign.campaign?.name || 'Nome não disponível',
            status: campaign.campaign?.status || 'UNKNOWN',
            budget: campaign.campaignBudget?.amountMicros 
              ? campaign.campaignBudget.amountMicros / 1e6 
              : undefined,
            spent: campaign.metrics?.costMicros 
              ? campaign.metrics.costMicros / 1e6 
              : undefined
          }));
          
          setCampaigns(campaignsList);
          return campaignsList;
        } else {
          throw new Error("Resposta inválida da API Google Ads");
        }
      } catch (apiError: any) {
        console.error("Erro na API Google Ads:", apiError.response?.data || apiError.message);
        throw new Error(`Erro ao acessar API do Google Ads: ${apiError.message}`);
      }
    } catch (err: any) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
      console.error("Erro ao buscar campanhas:", errorMessage);
      return [];
    } finally {
      setIsLoading(false);
    }
    
    return [];
  };

  return {
    fetchCampaigns,
    campaigns,
    isLoading,
    error
  };
};
