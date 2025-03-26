
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

/**
 * Hook para gerenciar e testar tokens do Google Ads
 */
export const useGoogleTokenService = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const { toast } = useToast();

  /**
   * Busca os tokens do Google Ads no Supabase
   */
  const fetchGoogleTokens = async (): Promise<Record<string, string> | null> => {
    try {
      const { data: tokensData, error: tokenError } = await supabase
        .from("api_tokens")
        .select("name, value")
        .or('name.eq.google_ads_access_token,name.eq.google_ads_refresh_token,name.eq.google_ads_client_id,name.eq.google_ads_client_secret');
      
      if (tokenError) {
        console.error("[useGoogleTokenService] Erro ao buscar tokens do Google Ads:", tokenError);
        throw new Error(`Erro ao buscar tokens do Google Ads: ${tokenError.message}`);
      }
      
      if (!tokensData || tokensData.length === 0) {
        console.error("[useGoogleTokenService] Tokens Google Ads não encontrados");
        throw new Error("Tokens do Google Ads não configurados");
      }
      
      // Converter array de tokens para objeto
      const tokens: Record<string, string> = {};
      tokensData.forEach(token => {
        tokens[token.name] = token.value;
      });
      
      const requiredTokens = [
        'google_ads_access_token',
        'google_ads_refresh_token',
        'google_ads_client_id',
        'google_ads_client_secret'
      ];
      
      const missingTokens = requiredTokens.filter(token => !tokens[token]);
      
      if (missingTokens.length > 0) {
        throw new Error(`Tokens ausentes: ${missingTokens.join(', ')}`);
      }
      
      console.log("[useGoogleTokenService] Tokens Google Ads encontrados");
      return tokens;
    } catch (err) {
      console.error("[useGoogleTokenService] Erro ao buscar tokens:", err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
      return null;
    }
  };

  /**
   * Testa a validade dos tokens do Google Ads
   */
  const testGoogleTokens = async () => {
    setIsLoading(true);
    setError(null);
    setDebugInfo(null);

    try {
      // Buscar tokens
      const tokens = await fetchGoogleTokens();
      
      if (!tokens) {
        throw new Error("Tokens do Google Ads não configurados ou erro ao buscar");
      }

      // Aqui você faria uma requisição de teste para a API do Google Ads
      // Por enquanto, vamos apenas simular que a validação foi bem-sucedida
      
      setDebugInfo({
        tokenTest: {
          status: "success",
          message: "Tokens do Google Ads validados com sucesso (simulado)",
          tokensPresent: Object.keys(tokens)
        }
      });
      
      toast({
        title: "Tokens válidos",
        description: "Tokens do Google Ads validados com sucesso (simulação).",
      });
      
      return true;
    } catch (err) {
      console.error("[testGoogleTokens] Erro ao testar tokens:", err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      
      setError("Erro ao testar tokens: " + errorMessage);
      
      toast({
        title: "Erro nos tokens",
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
    testGoogleTokens,
    isLoading,
    error,
    debugInfo
  };
};
