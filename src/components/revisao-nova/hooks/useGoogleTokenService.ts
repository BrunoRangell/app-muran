
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

  const refreshGoogleAccessToken = async (refreshToken?: string, clientId?: string, clientSecret?: string): Promise<string | null> => {
    try {
      setIsLoading(true);
      
      // Se os parâmetros não foram fornecidos, buscamos do banco
      let tokens = {
        refresh_token: refreshToken,
        client_id: clientId,
        client_secret: clientSecret
      };
      
      if (!refreshToken || !clientId || !clientSecret) {
        const tokenData = await fetchGoogleTokens();
        
        if (!tokenData) {
          throw new Error("Não foi possível obter tokens para renovação");
        }
        
        tokens = {
          refresh_token: tokenData.google_ads_refresh_token,
          client_id: tokenData.google_ads_client_id,
          client_secret: tokenData.google_ads_client_secret
        };
      }
      
      if (!tokens.refresh_token || !tokens.client_id || !tokens.client_secret) {
        throw new Error("Tokens obrigatórios para renovação estão faltando");
      }
      
      console.log("Iniciando renovação de token com refresh_token");
      
      const response = await axios.post(
        'https://oauth2.googleapis.com/token',
        {
          client_id: tokens.client_id,
          client_secret: tokens.client_secret,
          refresh_token: tokens.refresh_token,
          grant_type: 'refresh_token'
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      console.log("Resposta da API Google:", response.status);
      
      if (response.status !== 200 || !response.data?.access_token) {
        throw new Error("API Google não retornou um novo access_token válido");
      }

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
      
      // Atualizar também os metadados
      const expiresIn = response.data.expires_in || 3600;
      const expiresAt = new Date();
      expiresAt.setSeconds(expiresAt.getSeconds() + expiresIn);
      
      await supabase
        .from("google_ads_token_metadata")
        .upsert({
          token_type: "access_token",
          status: "valid",
          last_refreshed: new Date().toISOString(),
          expires_at: expiresAt.toISOString(),
          last_checked: new Date().toISOString(),
          details: JSON.stringify(response.data)
        });
      
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
      if (!tokens['google_ads_developer_token'] || tokens['google_ads_developer_token'] === 'SEU_TOKEN_AQUI') {
        setDebugInfo({
          status: "warning",
          message: "Token de desenvolvedor não configurado ou com valor padrão, necessário para chamadas à API"
        });
        
        toast({
          title: "Token de Desenvolvedor Inválido",
          description: "Configure um token de desenvolvedor válido do Google Ads para usar a API.",
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

      // Usar a edge function para testar os tokens ao invés de fazer a chamada direta
      try {
        console.log("Testando tokens via edge function...");
        const response = await supabase.functions.invoke('google-ads-token-check');
        
        if (response.error) {
          console.error("Erro na edge function:", response.error);
          throw new Error(`Erro na edge function: ${response.error.message}`);
        }
        
        const result = response.data;
        console.log("Resultado da edge function:", result);
        
        if (result.refreshed) {
          setDebugInfo({
            tokenRefreshed: true,
            tokenInfo: result,
            status: "success",
            message: `Token renovado automaticamente. Válido por ${Math.floor((result.expires_in || 3600) / 60)} minutos.`
          });
          
          toast({
            title: "Token Renovado",
            description: `Token renovado automaticamente. Válido por ${Math.floor((result.expires_in || 3600) / 60)} minutos.`,
          });
          
          // Recarregar tokens após renovação
          const updatedTokens = await fetchGoogleTokens();
          
          return true;
        } else if (result.success) {
          setDebugInfo({
            tokenStatus: "valid",
            tokenInfo: result,
            status: "success",
            message: "Tokens validados com sucesso pela edge function"
          });
          
          toast({
            title: "Tokens Validados",
            description: "Tokens do Google Ads validados com sucesso pela edge function.",
          });
          
          return true;
        } else {
          throw new Error(result.message || "Erro desconhecido na verificação de tokens");
        }
      } catch (edgeFunctionError: any) {
        // Erro ao chamar a edge function, tentamos o método direto
        console.error("Erro ao usar edge function, tentando método direto:", edgeFunctionError);

        // Verificar diretamente o token de acesso
        const tokenInfoResponse = await axios.get(
          `https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${tokens.google_ads_access_token}`
        );
        
        if (tokenInfoResponse.status === 200) {
          const tokenInfo = tokenInfoResponse.data;
          
          setDebugInfo({
            tokenInfo,
            status: "success",
            verificationMethod: "direct",
            message: `Token válido por ${Math.floor(tokenInfo.expires_in / 60)} minutos`
          });
          
          toast({
            title: "Token Válido",
            description: `Token de acesso do Google Ads está válido por ${Math.floor(tokenInfo.expires_in / 60)} minutos.`,
          });
          
          return true;
        } else {
          // Se o token está inválido, tenta renovar
          console.log("Token inválido, tentando renovar...");
          const newToken = await refreshGoogleAccessToken();
          
          if (newToken) {
            setDebugInfo({
              tokenRefreshed: true,
              status: "success",
              verificationMethod: "direct refresh",
              message: "Token renovado com sucesso"
            });
            
            return true;
          } else {
            throw new Error("Falha ao renovar token inválido");
          }
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
      setDebugInfo({
        status: "error",
        message: errorMessage
      });
      
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

  const checkTokenViaEdgeFunction = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log("Verificando tokens via edge function...");
      const response = await supabase.functions.invoke('google-ads-token-check');
      
      if (response.error) {
        throw new Error(`Erro na edge function: ${response.error.message}`);
      }
      
      const result = response.data;
      console.log("Resultado da verificação de tokens:", result);
      
      setDebugInfo(result);
      
      if (result.success) {
        toast({
          title: result.refreshed ? "Token Renovado" : "Token Válido",
          description: result.message,
        });
        return true;
      } else {
        toast({
          title: "Problema com Token",
          description: result.message,
          variant: "destructive",
        });
        return false;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
      
      toast({
        title: "Erro na Verificação",
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
    checkTokenViaEdgeFunction,
    isLoading,
    error,
    debugInfo
  };
};
