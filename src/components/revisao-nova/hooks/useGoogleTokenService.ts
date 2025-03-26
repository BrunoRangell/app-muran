import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import axios from "axios";

export const useGoogleTokenService = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const { toast } = useToast();

  const fetchGoogleTokens = async () => {
    try {
      const { data: tokensData, error: tokenError } = await supabase
        .from("api_tokens")
        .select("name, value")
        .or('name.eq.google_ads_access_token,name.eq.google_ads_refresh_token,name.eq.google_ads_client_id,name.eq.google_ads_client_secret,name.eq.google_ads_developer_token,name.eq.google_ads_manager_id');
      
      if (tokenError) {
        console.error("Erro ao buscar tokens do Google Ads:", tokenError);
        throw tokenError;
      }
      
      const tokens: Record<string, string> = {};
      tokensData?.forEach(token => {
        tokens[token.name] = token.value;
      });
      
      return tokens;
    } catch (err) {
      console.error("Erro ao buscar tokens:", err);
      return null;
    }
  };

  const refreshGoogleAccessToken = async (refreshToken: string, clientId: string, clientSecret: string): Promise<string | null> => {
    try {
      setIsLoading(true);
      
      const response = await axios.post(
        'https://oauth2.googleapis.com/token',
        {
          client_id: clientId,
          client_secret: clientSecret,
          refresh_token: refreshToken,
          grant_type: 'refresh_token'
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      const newAccessToken = response.data.access_token;
      
      // Salvar o novo access token no Supabase
      const { error: updateError } = await supabase
        .from("api_tokens")
        .update({ value: newAccessToken })
        .eq("name", "google_ads_access_token");
        
      if (updateError) {
        console.error("Erro ao atualizar access token:", updateError);
        throw new Error("Falha ao salvar novo token de acesso");
      }
      
      toast({
        title: "Token atualizado",
        description: "Token de acesso do Google Ads renovado com sucesso.",
      });
      
      return newAccessToken;
    } catch (err) {
      console.error("Erro ao renovar token de acesso:", err);
      setError("Falha ao renovar token de acesso");
      toast({
        title: "Erro na renovação de token",
        description: "Não foi possível renovar o token de acesso do Google Ads.",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const testGoogleTokens = async () => {
    setIsLoading(true);
    setError(null);
    setDebugInfo(null);

    try {
      const tokens = await fetchGoogleTokens();
      
      if (!tokens) {
        throw new Error("Tokens do Google Ads não configurados");
      }

      // Validação específica do token de desenvolvedor
      if (!tokens['google_ads_developer_token']) {
        setDebugInfo({
          status: "warning",
          message: "Token de desenvolvedor não configurado, necessário para chamadas à API"
        });
        
        toast({
          title: "Token de Desenvolvedor Ausente",
          description: "Configure o token de desenvolvedor do Google Ads para usar a API.",
          variant: "destructive"
        });
        
        return false;
      }

      // Resto da lógica de validação...
      const requiredTokens = [
        'google_ads_access_token', 
        'google_ads_refresh_token', 
        'google_ads_client_id', 
        'google_ads_client_secret'
      ];

      const optionalTokens = [
        'google_ads_developer_token',
        'google_ads_manager_id'
      ];

      const missingTokens = requiredTokens.filter(token => !tokens[token]);
      
      if (missingTokens.length > 0) {
        throw new Error(`Tokens obrigatórios ausentes: ${missingTokens.join(', ')}`);
      }

      // Testar a validade do token de acesso tentando buscar uma lista de clientes
      try {
        // Verificar se temos um token de desenvolvedor e ID de gerenciador
        if (!tokens['google_ads_developer_token']) {
          setDebugInfo({
            tokensPresent: Object.keys(tokens),
            missingOptional: "google_ads_developer_token",
            status: "warning",
            message: "Token de desenvolvedor não configurado, necessário para chamadas à API"
          });
          
          toast({
            title: "Tokens Básicos Validados",
            description: "Tokens OAuth do Google Ads verificados. Configure o token de desenvolvedor para usar a API.",
          });
          
          return true;
        }
        
        if (!tokens['google_ads_manager_id']) {
          setDebugInfo({
            tokensPresent: Object.keys(tokens),
            missingOptional: "google_ads_manager_id",
            status: "warning",
            message: "ID de conta gerenciadora não configurado, necessário para chamadas à API"
          });
          
          toast({
            title: "Tokens Básicos Validados",
            description: "Tokens OAuth do Google Ads verificados. Configure o ID da conta gerenciadora para usar a API.",
          });
          
          return true;
        }
        
        // Tentar fazer uma chamada à API para testar os tokens
        const managerCustomerId = tokens['google_ads_manager_id'];
        const developerToken = tokens['google_ads_developer_token'];
        const accessToken = tokens['google_ads_access_token'];
        
        // Query para buscar clientes
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
        
        const apiResponse = await axios.post(
          `https://googleads.googleapis.com/v18/customers/${managerCustomerId}/googleAds:search`,
          { query },
          {
            headers: {
              'Content-Type': 'application/json',
              'developer-token': developerToken,
              'Authorization': `Bearer ${accessToken}`
            }
          }
        );
        
        setDebugInfo({
          tokensPresent: Object.keys(tokens),
          apiCallSuccess: true,
          clientsFound: apiResponse.data.results?.length || 0,
          status: "success"
        });
        
        toast({
          title: "Tokens Validados",
          description: `Conexão com o Google Ads estabelecida com sucesso. ${apiResponse.data.results?.length || 0} contas de cliente encontradas.`,
        });
        
      } catch (apiError: any) {
        // Verificar se o erro é de token expirado
        if (apiError?.response?.status === 401) {
          // Tentar renovar o token
          console.log("Token expirado, tentando renovar...");
          
          const newAccessToken = await refreshGoogleAccessToken(
            tokens['google_ads_refresh_token'],
            tokens['google_ads_client_id'],
            tokens['google_ads_client_secret']
          );
          
          if (newAccessToken) {
            setDebugInfo({
              tokensPresent: Object.keys(tokens),
              tokenRefreshed: true,
              status: "success",
              message: "Token de acesso renovado com sucesso"
            });
            
            toast({
              title: "Token Renovado",
              description: "Token de acesso do Google Ads renovado com sucesso.",
            });
            
            return true;
          } else {
            throw new Error("Falha ao renovar token de acesso");
          }
        } else {
          // Outros erros de API
          setDebugInfo({
            tokensPresent: Object.keys(tokens),
            apiCallError: apiError?.response?.data || apiError.message,
            status: "error"
          });
          
          throw new Error(`Erro ao testar API do Google Ads: ${apiError?.response?.data?.error?.message || apiError.message}`);
        }
      }

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
      
      toast({
        title: "Erro na Validação",
        description: errorMessage,
        variant: "destructive",
      });

      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    fetchGoogleTokens,
    refreshGoogleAccessToken,
    testGoogleTokens,
    isLoading,
    error,
    debugInfo
  };
};
