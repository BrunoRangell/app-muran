
import { useState } from "react";
import { useGoogleAdsCampaigns } from "./useGoogleAdsCampaigns";

export const useGoogleAdsBudget = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { fetchCampaigns } = useGoogleAdsCampaigns();

  const calculateTotalBudget = async (customerId: string): Promise<number> => {
    try {
      setIsLoading(true);
      const campaignsList = await fetchCampaigns(customerId);
      
      return campaignsList.reduce((acc, campaign) => {
        if (campaign.status === 'ENABLED' && campaign.budget) {
          return acc + campaign.budget;
        }
        return acc;
      }, 0);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(`Erro ao calcular orçamento total: ${errorMessage}`);
      console.error("Erro ao calcular orçamento total:", err);
      return 0;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    calculateTotalBudget,
    isLoading,
    error
  };
};
