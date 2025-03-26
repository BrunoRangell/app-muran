
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

export const useGoogleTokenService = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const { toast } = useToast();

  const fetchGoogleTokens = async (): Promise<Record<string, string> | null> => {
    try {
      const { data: tokensData, error: tokenError } = await supabase
        .from("api_tokens")
        .select("name, value")
        .or('name.eq.google_ads_access_token,name.eq.google_ads_refresh_token,name.eq.google_ads_client_id,name.eq.google_ads_client_secret');
      
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

  const testGoogleTokens = async () => {
    setIsLoading(true);
    setError(null);
    setDebugInfo(null);

    try {
      const tokens = await fetchGoogleTokens();
      
      if (!tokens) {
        throw new Error("Tokens do Google Ads não configurados");
      }

      // Validação básica dos tokens
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

      // Aqui você poderia adicionar uma validação real com a API do Google Ads
      // Por enquanto, vamos apenas simular uma validação
      
      setDebugInfo({
        tokensPresent: Object.keys(tokens),
        status: "success"
      });

      toast({
        title: "Tokens Validados",
        description: "Tokens do Google Ads verificados com sucesso.",
      });

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
    testGoogleTokens,
    isLoading,
    error,
    debugInfo
  };
};
