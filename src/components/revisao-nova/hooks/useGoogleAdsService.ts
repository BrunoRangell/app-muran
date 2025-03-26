
import { useState } from "react";
import { useGoogleTokenService } from "./useGoogleTokenService";
import axios from "axios";
import { DateTime } from "luxon";

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
  const { fetchGoogleTokens, refreshGoogleAccessToken } = useGoogleTokenService();

  const getAuthHeaders = async (tokens: Record<string, string>, customerId?: string) => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'developer-token': tokens.google_ads_developer_token,
      'Authorization': `Bearer ${tokens.google_ads_access_token}`
    };
    
    if (customerId && tokens.google_ads_manager_id) {
      headers['login-customer-id'] = tokens.google_ads_manager_id;
    }
    
    return headers;
  };

  const handleApiError = async (error: any, tokens: Record<string, string>) => {
    console.error("Erro na API Google Ads:", error.response?.data || error.message);
    
    // Verificar se o erro é de token expirado (401)
    if (error.response?.status === 401) {
      try {
        // Tentar renovar o token
        const newToken = await refreshGoogleAccessToken(
          tokens.google_ads_refresh_token,
          tokens.google_ads_client_id,
          tokens.google_ads_client_secret
        );
        
        if (newToken) {
          // Atualizar o token na lista
          tokens.google_ads_access_token = newToken;
          return tokens;
        }
      } catch (refreshError) {
        console.error("Erro ao renovar token:", refreshError);
        throw new Error("Falha ao renovar token de acesso");
      }
    }
    
    // Para outros erros, propagamos a mensagem original
    throw new Error(error.response?.data?.error?.message || error.message);
  };

  const fetchCustomerIds = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const tokens = await fetchGoogleTokens();
      
      if (!tokens) {
        throw new Error("Tokens do Google Ads não configurados");
      }
      
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
      
      const headers = await getAuthHeaders(tokens);
      
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
        // Tentar renovar o token se necessário
        const updatedTokens = await handleApiError(apiError, tokens);
        
        if (updatedTokens) {
          // Tentar novamente com o token atualizado
          const newHeaders = await getAuthHeaders(updatedTokens);
          
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
      const tokens = await fetchGoogleTokens();
      
      if (!tokens) {
        throw new Error("Tokens do Google Ads não configurados");
      }
      
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
      
      const headers = await getAuthHeaders(tokens, customerId);
      
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
        // Tentar renovar o token se necessário
        const updatedTokens = await handleApiError(apiError, tokens);
        
        if (updatedTokens) {
          // Tentar novamente com o token atualizado
          const newHeaders = await getAuthHeaders(updatedTokens, customerId);
          
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
      const tokens = await fetchGoogleTokens();
      
      if (!tokens) {
        throw new Error("Tokens do Google Ads não configurados");
      }
      
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
      
      const headers = await getAuthHeaders(tokens, customerId);
      
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
        
        // Cálculo do total gasto no mês
        let totalSpend = campaigns.reduce((acc: number, campaign: any) => {
          const cost = campaign.metrics?.costMicros ? campaign.metrics.costMicros / 1e6 : 0;
          return acc + cost;
        }, 0);
        
        // Cálculo da média dos últimos 5 dias, excluindo hoje
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
        // Tentar renovar o token se necessário
        const updatedTokens = await handleApiError(apiError, tokens);
        
        if (updatedTokens) {
          // Tentar novamente com o token atualizado
          const newHeaders = await getAuthHeaders(updatedTokens, customerId);
          
          const response = await axios.post(
            `https://googleads.googleapis.com/v18/customers/${customerId}/googleAds:search`,
            { query },
            { headers: newHeaders }
          );
          
          // Repetir a lógica de processamento com a nova resposta
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
    spendInfo
  };
};
