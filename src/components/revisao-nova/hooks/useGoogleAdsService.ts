import { useState } from "react";
import { useGoogleAdsTokenManager } from "./useGoogleAdsTokenManager";
import axios from "axios";
import { DateTime } from "luxon";
import { supabase } from "@/lib/supabase";

export interface GoogleAdsClient {
  customerId: string;
  name: string;
}

export interface GoogleAdsCampaign {
  campaignId: string;
  campaignName: string;
  status: string;
  budget?: number;
  spent?: number;
}

export interface GoogleAdsSpend {
  totalSpend: number;
  lastFiveDaysAvg: number;
}

export const useGoogleAdsService = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clients, setClients] = useState<GoogleAdsClient[]>([]);
  const [campaigns, setCampaigns] = useState<GoogleAdsCampaign[]>([]);
  const [spendInfo, setSpendInfo] = useState<GoogleAdsSpend | null>(null);
  const tokenManager = useGoogleAdsTokenManager();

  const handleApiError = async (error: any, endpoint: string, params?: any) => {
    console.error(`Erro na API Google Ads (${endpoint}):`, error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      await tokenManager.logTokenEvent({
        event: 'error',
        status: 'expired',
        message: `Token expirado ao acessar ${endpoint}`,
        details: {
          response: error.response?.data,
          params
        }
      });
      
      const newToken = await tokenManager.refreshAccessToken();
      
      if (newToken) {
        return true;
      }
    }
    
    await tokenManager.logTokenEvent({
      event: 'error',
      status: 'unknown',
      message: `Erro ao acessar ${endpoint}`,
      details: {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
        params
      }
    });
    
    return false;
  };

  const fetchCustomerIds = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data: tokensData, error: tokensError } = await supabase
        .from("api_tokens")
        .select("name, value")
        .or('name.eq.google_ads_developer_token,name.eq.google_ads_manager_id');
      
      if (tokensError) {
        throw new Error("Erro ao buscar tokens de desenvolvedor e ID da conta gerenciadora");
      }
      
      const tokens: Record<string, string> = {};
      tokensData?.forEach(token => {
        tokens[token.name] = token.value;
      });
      
      if (!tokens.google_ads_developer_token || !tokens.google_ads_manager_id) {
        throw new Error("Token de desenvolvedor ou ID da conta gerenciadora não configurados");
      }
      
      const managerCustomerId = tokens.google_ads_manager_id;
      const query = `
        SELECT
            customer_client.id,
            customer_client.level,
            customer_client.descriptive_name
        FROM
            customer_client
        WHERE
            customer_client.manager = FALSE
      `;
      
      const headers = await tokenManager.getAuthHeaders();
      
      if (!headers) {
        throw new Error("Não foi possível obter headers de autenticação válidos");
      }
      
      try {
        const response = await axios.post(
          `https://googleads.googleapis.com/v18/customers/${managerCustomerId}/googleAds:search`,
          { query },
          { headers }
        );
        
        if (response.data && response.data.results) {
          const clientsList = response.data.results.map((client: any) => ({
            customerId: client.customerClient?.id || 'Não disponível',
            name: client.customerClient?.descriptiveName || 'Nome não disponível'
          }));
          
          setClients(clientsList);
          return clientsList;
        } else {
          throw new Error("Resposta inválida da API Google Ads");
        }
      } catch (apiError: any) {
        const shouldRetry = await handleApiError(apiError, 'fetchCustomerIds', { managerCustomerId });
        
        if (shouldRetry) {
          const newHeaders = await tokenManager.getAuthHeaders();
          
          if (!newHeaders) {
            throw new Error("Não foi possível obter novos headers de autenticação válidos após renovação do token");
          }
          
          const response = await axios.post(
            `https://googleads.googleapis.com/v18/customers/${managerCustomerId}/googleAds:search`,
            { query },
            { headers: newHeaders }
          );
          
          const clientsList = response.data.results.map((client: any) => ({
            customerId: client.customerClient?.id || 'Não disponível',
            name: client.customerClient?.descriptiveName || 'Nome não disponível'
          }));
          
          setClients(clientsList);
          return clientsList;
        } else {
          throw apiError;
        }
      }
    } catch (err: any) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
      console.error("Erro ao buscar IDs de clientes:", errorMessage);
      return [];
    } finally {
      setIsLoading(false);
    }
    
    return [];
  };

  const fetchCampaigns = async (customerId: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data: tokensData, error: tokensError } = await supabase
        .from("api_tokens")
        .select("name, value")
        .or('name.eq.google_ads_developer_token,name.eq.google_ads_manager_id');
      
      if (tokensError) {
        throw new Error("Erro ao buscar tokens de desenvolvedor e ID da conta gerenciadora");
      }
      
      const tokens: Record<string, string> = {};
      tokensData?.forEach(token => {
        tokens[token.name] = token.value;
      });
      
      if (!tokens.google_ads_developer_token || !tokens.google_ads_manager_id) {
        throw new Error("Token de desenvolvedor ou ID da conta gerenciadora não configurados");
      }
      
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
      
      const headers = await tokenManager.getAuthHeaders(customerId);
      
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
        const shouldRetry = await handleApiError(apiError, 'fetchCampaigns', { customerId });
        
        if (shouldRetry) {
          const newHeaders = await tokenManager.getAuthHeaders(customerId);
          
          if (!newHeaders) {
            throw new Error("Não foi possível obter novos headers de autenticação válidos após renovação do token");
          }
          
          const response = await axios.post(
            `https://googleads.googleapis.com/v18/customers/${customerId}/googleAds:search`,
            { query },
            { headers: newHeaders }
          );
          
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
          throw apiError;
        }
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

  const fetchMonthlySpend = async (customerId: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data: tokensData, error: tokensError } = await supabase
        .from("api_tokens")
        .select("name, value")
        .or('name.eq.google_ads_developer_token,name.eq.google_ads_manager_id');
      
      if (tokensError) {
        throw new Error("Erro ao buscar tokens de desenvolvedor e ID da conta gerenciadora");
      }
      
      const tokens: Record<string, string> = {};
      tokensData?.forEach(token => {
        tokens[token.name] = token.value;
      });
      
      if (!tokens.google_ads_developer_token || !tokens.google_ads_manager_id) {
        throw new Error("Token de desenvolvedor ou ID da conta gerenciadora não configurados");
      }
      
      const today = DateTime.now().setZone('America/Sao_Paulo');
      const startDate = today.startOf('month').toISODate();
      const endDate = today.toISODate();
      const fiveDaysAgo = today.minus({ days: 5 }).toISODate();
      
      const query = `
        SELECT
            metrics.cost_micros,
            campaign.id,
            campaign.name,
            segments.date
        FROM
            campaign
        WHERE
            segments.date BETWEEN '${startDate}' AND '${endDate}'
      `;
      
      const headers = await tokenManager.getAuthHeaders(customerId);
      
      if (!headers) {
        throw new Error("Não foi possível obter headers de autenticação válidos");
      }
      
      try {
        const response = await axios.post(
          `https://googleads.googleapis.com/v18/customers/${customerId}/googleAds:search`,
          { query },
          { headers }
        );
        
        if (!response.data || !response.data.results) {
          setSpendInfo({ totalSpend: 0, lastFiveDaysAvg: 0 });
          return { totalSpend: 0, lastFiveDaysAvg: 0 };
        }
        
        const campaigns = response.data.results;
        
        let totalSpend = campaigns.reduce((acc: number, campaign: any) => {
          const cost = campaign.metrics?.costMicros ? campaign.metrics.costMicros / 1e6 : 0;
          return acc + cost;
        }, 0);
        
        let lastFiveDaysSpend = 0;
        let uniqueDates = new Set();
        
        campaigns.forEach((campaign: any) => {
          const date = campaign.segments?.date;
          if (date && DateTime.fromISO(date).setZone('America/Sao_Paulo') < today.startOf('day').setZone('America/Sao_Paulo') && 
            DateTime.fromISO(date).setZone('America/Sao_Paulo') >= DateTime.fromISO(fiveDaysAgo).setZone('America/Sao_Paulo')) {
            const cost = campaign.metrics?.costMicros ? campaign.metrics.costMicros / 1e6 : 0;
            lastFiveDaysSpend += cost;
            uniqueDates.add(date);
          }
        });
        
        const countLastFiveDays = uniqueDates.size;
        const lastFiveDaysAvg = countLastFiveDays > 0 ? lastFiveDaysSpend / countLastFiveDays : 0;
        
        const result = {
          totalSpend,
          lastFiveDaysAvg
        };
        
        setSpendInfo(result);
        return result;
      } catch (apiError: any) {
        const shouldRetry = await handleApiError(apiError, 'fetchMonthlySpend', { customerId });
        
        if (shouldRetry) {
          const newHeaders = await tokenManager.getAuthHeaders(customerId);
          
          if (!newHeaders) {
            throw new Error("Não foi possível obter novos headers de autenticação válidos após renovação do token");
          }
          
          const response = await axios.post(
            `https://googleads.googleapis.com/v18/customers/${customerId}/googleAds:search`,
            { query },
            { headers: newHeaders }
          );
          
          const campaigns = response.data.results || [];
          
          let totalSpend = campaigns.reduce((acc: number, campaign: any) => {
            const cost = campaign.metrics?.costMicros ? campaign.metrics.costMicros / 1e6 : 0;
            return acc + cost;
          }, 0);
          
          let lastFiveDaysSpend = 0;
          let uniqueDates = new Set();
          
          campaigns.forEach((campaign: any) => {
            const date = campaign.segments?.date;
            if (date && DateTime.fromISO(date).setZone('America/Sao_Paulo') < today.startOf('day').setZone('America/Sao_Paulo') && 
              DateTime.fromISO(date).setZone('America/Sao_Paulo') >= DateTime.fromISO(fiveDaysAgo).setZone('America/Sao_Paulo')) {
              const cost = campaign.metrics?.costMicros ? campaign.metrics.costMicros / 1e6 : 0;
              lastFiveDaysSpend += cost;
              uniqueDates.add(date);
            }
          });
          
          const countLastFiveDays = uniqueDates.size;
          const lastFiveDaysAvg = countLastFiveDays > 0 ? lastFiveDaysSpend / countLastFiveDays : 0;
          
          const result = {
            totalSpend,
            lastFiveDaysAvg
          };
          
          setSpendInfo(result);
          return result;
        } else {
          throw apiError;
        }
      }
    } catch (err: any) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
      console.error("Erro ao buscar gastos mensais:", errorMessage);
      return { totalSpend: 0, lastFiveDaysAvg: 0 };
    } finally {
      setIsLoading(false);
    }
    
    return { totalSpend: 0, lastFiveDaysAvg: 0 };
  };

  const calculateTotalBudget = async (customerId: string) => {
    try {
      const campaignsList = await fetchCampaigns(customerId);
      
      return campaignsList.reduce((acc, campaign) => {
        if (campaign.status === 'ENABLED' && campaign.budget) {
          return acc + campaign.budget;
        }
        return acc;
      }, 0);
    } catch (err) {
      console.error("Erro ao calcular orçamento total:", err);
      return 0;
    }
  };

  return {
    fetchCustomerIds,
    fetchCampaigns,
    fetchMonthlySpend,
    calculateTotalBudget,
    isLoading,
    error,
    clients,
    campaigns,
    spendInfo,
    tokenManager
  };
};
