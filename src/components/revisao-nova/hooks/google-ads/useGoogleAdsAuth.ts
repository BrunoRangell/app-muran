
import { useState } from "react";
import { supabase } from "@/lib/supabase";

// Modificar a interface para incluir um índice de assinatura para string
export interface GoogleAdsAuthHeaders {
  Authorization: string;
  'developer-token': string;
  'Content-Type': string;
  'login-customer-id'?: string;
  [key: string]: string | undefined; // Adicionar índice de assinatura para string
}

export const useGoogleAdsAuth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Função para obter os headers de autenticação
  const getAuthHeaders = async (customerId?: string): Promise<GoogleAdsAuthHeaders | null> => {
    try {
      setIsLoading(true);
      
      const { data: tokensData, error: tokensError } = await supabase
        .from("api_tokens")
        .select("name, value")
        .or('name.eq.google_ads_access_token,name.eq.google_ads_developer_token');
      
      if (tokensError) {
        console.error("Erro ao buscar tokens:", tokensError);
        setError("Erro ao buscar tokens de autenticação");
        return null;
      }
      
      const tokens: Record<string, string> = {};
      tokensData?.forEach(token => {
        tokens[token.name] = token.value;
      });
      
      if (!tokens.google_ads_access_token || !tokens.google_ads_developer_token) {
        console.error("Tokens do Google Ads não configurados corretamente");
        setError("Tokens do Google Ads não configurados corretamente");
        return null;
      }
      
      const headers: GoogleAdsAuthHeaders = {
        'Authorization': `Bearer ${tokens.google_ads_access_token}`,
        'developer-token': tokens.google_ads_developer_token,
        'Content-Type': 'application/json'
      };
      
      if (customerId) {
        headers['login-customer-id'] = customerId;
      }
      
      return headers;
    } catch (err) {
      console.error("Erro ao preparar headers:", err);
      setError(`Erro ao preparar headers de autenticação: ${err instanceof Error ? err.message : String(err)}`);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    getAuthHeaders,
    isLoading,
    error,
    setError
  };
};
