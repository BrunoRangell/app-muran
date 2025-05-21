
import { useState } from "react";
import { useGoogleAdsClients } from "./google-ads/useGoogleAdsClients";
import { useGoogleAdsCampaigns } from "./google-ads/useGoogleAdsCampaigns";
import { useGoogleAdsSpend } from "./google-ads/useGoogleAdsSpend";
import { useGoogleAdsBudget } from "./google-ads/useGoogleAdsBudget";

export const useGoogleAdsService = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { 
    fetchCustomerIds, 
    clients,
    isLoading: isClientsLoading,
    error: clientsError
  } = useGoogleAdsClients();
  
  const {
    fetchCampaigns,
    campaigns,
    isLoading: isCampaignsLoading,
    error: campaignsError
  } = useGoogleAdsCampaigns();
  
  const {
    fetchMonthlySpend,
    spendInfo,
    isLoading: isSpendLoading,
    error: spendError
  } = useGoogleAdsSpend();
  
  const {
    calculateTotalBudget,
    isLoading: isBudgetLoading,
    error: budgetError
  } = useGoogleAdsBudget();
  
  // Função agregadora para buscar todos os dados do cliente
  const fetchClientData = async (customerId: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      await fetchCampaigns(customerId);
      await fetchMonthlySpend(customerId);
      const totalBudget = await calculateTotalBudget(customerId);
      
      return {
        campaigns,
        spendInfo,
        totalBudget
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(`Erro ao buscar dados do cliente: ${errorMessage}`);
      return null;
    } finally {
      setIsLoading(false);
    }
  };
  
  return {
    fetchCustomerIds,
    fetchCampaigns,
    fetchMonthlySpend,
    calculateTotalBudget,
    fetchClientData,
    clients,
    campaigns,
    spendInfo,
    isLoading: isLoading || isClientsLoading || isCampaignsLoading || isSpendLoading || isBudgetLoading,
    error: error || clientsError || campaignsError || spendError || budgetError
  };
};
