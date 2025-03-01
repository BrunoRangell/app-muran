
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

/**
 * Hook para gerenciar e testar tokens do Meta Ads
 */
export const useMetaTokenService = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const { toast } = useToast();

  /**
   * Busca o token do Meta Ads no Supabase
   */
  const fetchMetaToken = async (): Promise<string | null> => {
    try {
      const { data: tokenData, error: tokenError } = await supabase
        .from("api_tokens")
        .select("value")
        .eq("name", "meta_access_token")
        .single();
      
      if (tokenError) {
        console.error("[useMetaTokenService] Erro ao buscar token do Meta Ads:", tokenError);
        throw new Error(`Erro ao buscar token do Meta Ads: ${tokenError.message}`);
      }
      
      if (!tokenData?.value) {
        console.error("[useMetaTokenService] Token Meta Ads não encontrado");
        throw new Error("Token do Meta Ads não configurado");
      }
      
      console.log("[useMetaTokenService] Token Meta Ads encontrado");
      return tokenData.value;
    } catch (err) {
      console.error("[useMetaTokenService] Erro ao buscar token:", err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
      return null;
    }
  };

  /**
   * Testa a validade do token do Meta Ads
   */
  const testMetaToken = async () => {
    setIsLoading(true);
    setError(null);
    setDebugInfo(null);

    try {
      // Buscar token
      const token = await fetchMetaToken();
      
      if (!token) {
        throw new Error("Token do Meta Ads não configurado ou erro ao buscar");
      }

      // Teste básico de validação do token
      const testUrl = `https://graph.facebook.com/v20.0/me?access_token=${token}&fields=id,name`;
      
      const response = await fetch(testUrl);
      const result = await response.json();
      
      setDebugInfo({
        tokenTest: {
          url: testUrl.replace(token, "***TOKEN***"),
          status: response.status,
          statusText: response.statusText,
          result
        }
      });
      
      if (result.error) {
        throw new Error(`Erro no teste do token: ${result.error.message || JSON.stringify(result.error)}`);
      }
      
      toast({
        title: "Token válido",
        description: `Token do Meta Ads válido. Usuário: ${result.name || result.id}`,
      });
      
      return true;
    } catch (err) {
      console.error("[testMetaToken] Erro ao testar token:", err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      
      setError("Erro ao testar token: " + errorMessage);
      
      toast({
        title: "Erro no token",
        description: errorMessage,
        variant: "destructive",
      });
      
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    fetchMetaToken,
    testMetaToken,
    isLoading,
    error,
    debugInfo
  };
};
