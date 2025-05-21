
import { useState } from "react";
import axios from "axios";
import { supabase } from "@/lib/supabase";
import { useGoogleAdsAuth } from "./useGoogleAdsAuth";

export interface GoogleAdsClient {
  customerId: string;
  name: string;
}

export const useGoogleAdsClients = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clients, setClients] = useState<GoogleAdsClient[]>([]);
  const { getAuthHeaders } = useGoogleAdsAuth();

  const fetchCustomerIds = async (): Promise<GoogleAdsClient[]> => {
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
      
      const headers = await getAuthHeaders();
      
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
        console.error("Erro na API Google Ads:", apiError.response?.data || apiError.message);
        throw new Error(`Erro ao acessar API do Google Ads: ${apiError.message}`);
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

  return {
    fetchCustomerIds,
    clients,
    isLoading,
    error
  };
};
