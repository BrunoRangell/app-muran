
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import axios from "axios";
import { DateTime } from "luxon";

// Definição do status do token
export type TokenStatus = 'valid' | 'expired' | 'unknown' | 'refreshing';

// Interface para registro de log
interface TokenLogEntry {
  event: 'check' | 'refresh' | 'error' | 'use';
  status: TokenStatus;
  message?: string;
  details?: any;
}

export const useGoogleAdsTokenManager = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [tokenStatus, setTokenStatus] = useState<TokenStatus>('unknown');
  const [lastCheck, setLastCheck] = useState<Date | null>(null);
  const { toast } = useToast();

  // Registrar log na consola e opcionalmente no banco de dados
  const logTokenEvent = async (entry: TokenLogEntry) => {
    const timestamp = new Date();
    
    // Log no console
    console.log(`[GoogleAdsToken][${entry.event.toUpperCase()}][${timestamp.toISOString()}] ${entry.status}: ${entry.message}`, entry.details || '');
    
    try {
      // Registrar log no banco de dados
      await supabase.from('google_ads_token_logs').insert({
        event_type: entry.event,
        token_status: entry.status,
        message: entry.message,
        details: entry.details ? JSON.stringify(entry.details) : null,
        created_at: timestamp.toISOString()
      });
    } catch (error) {
      // Se falhar o log no banco, pelo menos temos o log no console
      console.error("[GoogleAdsToken] Erro ao salvar log:", error);
    }
  };

  // Buscar tokens do Google Ads
  const fetchTokens = async () => {
    try {
      const { data: tokensData, error } = await supabase
        .from("api_tokens")
        .select("name, value")
        .or('name.eq.google_ads_access_token,name.eq.google_ads_refresh_token,name.eq.google_ads_client_id,name.eq.google_ads_client_secret');
      
      if (error) {
        await logTokenEvent({
          event: 'error',
          status: 'unknown',
          message: 'Erro ao buscar tokens',
          details: error
        });
        throw error;
      }
      
      const tokens: Record<string, string> = {};
      tokensData?.forEach(token => {
        tokens[token.name] = token.value;
      });
      
      // Atualizar status do último acesso
      setLastCheck(new Date());
      
      return tokens;
    } catch (err) {
      await logTokenEvent({
        event: 'error',
        status: 'unknown',
        message: 'Exceção ao buscar tokens',
        details: err
      });
      return null;
    }
  };

  // Verificar se o token de acesso está válido
  const checkAccessToken = async (accessToken: string): Promise<boolean> => {
    // O Google não oferece um endpoint específico para verificação de token
    // Podemos fazer uma chamada simples à API para testar
    try {
      await logTokenEvent({
        event: 'check',
        status: 'unknown',
        message: 'Verificando validade do token de acesso'
      });
      
      // Tentar fazer uma chamada simples à API do Google
      await axios.get('https://www.googleapis.com/oauth2/v1/tokeninfo', {
        params: { access_token: accessToken }
      });
      
      // Se não lançou erro, o token é válido
      await logTokenEvent({
        event: 'check',
        status: 'valid',
        message: 'Token de acesso válido'
      });
      
      setTokenStatus('valid');
      return true;
    } catch (error: any) {
      const isExpired = error?.response?.status === 400;
      
      await logTokenEvent({
        event: 'check',
        status: isExpired ? 'expired' : 'unknown',
        message: isExpired ? 'Token de acesso expirado' : 'Erro ao verificar token',
        details: error?.response?.data || error.message
      });
      
      if (isExpired) {
        setTokenStatus('expired');
      }
      
      return false;
    }
  };

  // Renovar token de acesso com retry automático
  const refreshAccessToken = async (retries = 3): Promise<string | null> => {
    setIsLoading(true);
    setTokenStatus('refreshing');
    
    try {
      await logTokenEvent({
        event: 'refresh',
        status: 'refreshing',
        message: 'Iniciando renovação do token de acesso'
      });
      
      const tokens = await fetchTokens();
      
      if (!tokens || !tokens.google_ads_refresh_token || !tokens.google_ads_client_id || !tokens.google_ads_client_secret) {
        throw new Error("Tokens necessários para renovação não disponíveis");
      }
      
      const { google_ads_refresh_token, google_ads_client_id, google_ads_client_secret } = tokens;
      
      const response = await axios.post(
        'https://oauth2.googleapis.com/token',
        {
          client_id: google_ads_client_id,
          client_secret: google_ads_client_secret,
          refresh_token: google_ads_refresh_token,
          grant_type: 'refresh_token'
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      const newAccessToken = response.data.access_token;
      const expiresIn = response.data.expires_in; // Normalmente 3600 segundos (1 hora)
      
      // Calcular timestamp de expiração
      const expiresAt = DateTime.local().plus({ seconds: expiresIn }).toJSDate();
      
      // Salvar o novo access token e metadados no Supabase
      const { error: updateTokenError } = await supabase
        .from("api_tokens")
        .update({ value: newAccessToken })
        .eq("name", "google_ads_access_token");
        
      if (updateTokenError) {
        throw new Error("Falha ao salvar novo token de acesso");
      }
      
      // Atualizar ou criar metadados do token
      const { error: metadataError } = await supabase
        .from("google_ads_token_metadata")
        .upsert({
          token_type: "access_token",
          last_refreshed: new Date().toISOString(),
          expires_at: expiresAt.toISOString(),
          status: "valid"
        });
      
      if (metadataError) {
        console.warn("Falha ao atualizar metadados do token:", metadataError);
      }
      
      await logTokenEvent({
        event: 'refresh',
        status: 'valid',
        message: 'Token de acesso renovado com sucesso',
        details: { expires_at: expiresAt.toISOString() }
      });
      
      setTokenStatus('valid');
      
      toast({
        title: "Token renovado",
        description: `Token de acesso do Google Ads renovado com sucesso. Expira em ${Math.floor(expiresIn / 60)} minutos.`,
      });
      
      return newAccessToken;
    } catch (err: any) {
      await logTokenEvent({
        event: 'error',
        status: 'expired',
        message: 'Falha na renovação do token de acesso',
        details: err?.response?.data || err.message
      });
      
      // Tentar renovar novamente se ainda houver tentativas restantes
      if (retries > 0) {
        console.log(`Tentativa de renovação falhou. Tentando novamente em 5 segundos. ${retries} tentativas restantes.`);
        // Esperar 5 segundos antes de tentar novamente
        await new Promise(resolve => setTimeout(resolve, 5000));
        return refreshAccessToken(retries - 1);
      }
      
      toast({
        title: "Erro na renovação de token",
        description: "Não foi possível renovar o token de acesso do Google Ads após várias tentativas.",
        variant: "destructive",
      });
      
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Obter token de acesso válido
  const getValidAccessToken = async (): Promise<string | null> => {
    const tokens = await fetchTokens();
    
    if (!tokens) {
      return null;
    }
    
    // Se não existe token, nem tenta verificar
    if (!tokens.google_ads_access_token) {
      return null;
    }
    
    // Verificar metadata para saber se o token já está expirado
    const { data: metadata } = await supabase
      .from("google_ads_token_metadata")
      .select("expires_at, status")
      .eq("token_type", "access_token")
      .maybeSingle();
    
    // Se temos metadados e o token não expirou, podemos usá-lo
    if (metadata?.expires_at) {
      const expiresAt = DateTime.fromISO(metadata.expires_at);
      const now = DateTime.local();
      
      // Se o token expira em mais de 5 minutos, é considerado válido
      if (expiresAt > now.plus({ minutes: 5 })) {
        await logTokenEvent({
          event: 'check',
          status: 'valid',
          message: 'Token válido pelos metadados',
          details: { expires_at: metadata.expires_at }
        });
        return tokens.google_ads_access_token;
      }
    }
    
    // Verificar se o token atual é válido
    const isValid = await checkAccessToken(tokens.google_ads_access_token);
    
    if (isValid) {
      return tokens.google_ads_access_token;
    }
    
    // Se o token está inválido, tenta renovar
    return refreshAccessToken();
  };

  // Obter headers de autenticação com token válido
  const getAuthHeaders = async (customerId?: string): Promise<Record<string, string> | null> => {
    try {
      // Buscar tokens do Supabase
      const tokens = await fetchTokens();
      
      if (!tokens) {
        throw new Error("Tokens do Google Ads não configurados");
      }
      
      // Verificar developer token
      if (!tokens.google_ads_developer_token) {
        throw new Error("Token de desenvolvedor do Google Ads não configurado");
      }
      
      // Obter token de acesso válido
      const accessToken = await getValidAccessToken();
      
      if (!accessToken) {
        throw new Error("Não foi possível obter um token de acesso válido");
      }
      
      // Montar headers
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'developer-token': tokens.google_ads_developer_token,
        'Authorization': `Bearer ${accessToken}`
      };
      
      // Adicionar customer_id manager se necessário
      if (customerId && tokens.google_ads_manager_id) {
        headers['login-customer-id'] = tokens.google_ads_manager_id;
      }
      
      await logTokenEvent({
        event: 'use',
        status: 'valid',
        message: 'Headers de autenticação gerados com sucesso'
      });
      
      return headers;
    } catch (error: any) {
      await logTokenEvent({
        event: 'error',
        status: 'unknown',
        message: 'Erro ao gerar headers de autenticação',
        details: error?.message
      });
      
      return null;
    }
  };

  // Verificar a saúde do serviço de tokens
  const checkTokenHealth = async () => {
    setIsLoading(true);
    
    try {
      const tokens = await fetchTokens();
      
      if (!tokens) {
        return {
          status: "error",
          message: "Não foi possível recuperar os tokens"
        };
      }
      
      // Verificar tokens obrigatórios
      const requiredTokens = [
        'google_ads_access_token', 
        'google_ads_refresh_token', 
        'google_ads_client_id', 
        'google_ads_client_secret'
      ];
      
      const missingTokens = requiredTokens.filter(token => !tokens[token]);
      
      if (missingTokens.length > 0) {
        return {
          status: "error",
          message: `Tokens obrigatórios ausentes: ${missingTokens.join(', ')}`,
          missingTokens
        };
      }
      
      // Verificar validade do access token
      const isAccessTokenValid = await checkAccessToken(tokens.google_ads_access_token);
      
      // Obter metadados do token
      const { data: metadata } = await supabase
        .from("google_ads_token_metadata")
        .select("*")
        .eq("token_type", "access_token")
        .maybeSingle();
      
      return {
        status: isAccessTokenValid ? "valid" : "expired",
        accessTokenValid: isAccessTokenValid,
        lastRefreshed: metadata?.last_refreshed || null,
        expiresAt: metadata?.expires_at || null
      };
    } catch (error) {
      return {
        status: "error",
        message: `Erro ao verificar saúde dos tokens: ${error instanceof Error ? error.message : String(error)}`
      };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    tokenStatus,
    lastCheck,
    fetchTokens,
    refreshAccessToken,
    getValidAccessToken,
    getAuthHeaders,
    checkTokenHealth,
    logTokenEvent
  };
};
