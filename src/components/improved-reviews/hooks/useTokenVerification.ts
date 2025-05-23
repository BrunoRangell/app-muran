
import { useState } from "react";
import { supabase } from "@/lib/supabase";

export const useTokenVerification = () => {
  const [isVerifying, setIsVerifying] = useState(false);
  const [tokenStatus, setTokenStatus] = useState<{
    isValid: boolean | null;
    error?: string;
    details?: any;
  }>({ isValid: null });

  const verifyGoogleAdsToken = async (): Promise<boolean> => {
    try {
      setIsVerifying(true);
      setTokenStatus({ isValid: null });
      
      // Chamar a função Edge para verificar o token
      const { data, error } = await supabase.functions.invoke('google-ads-token-check');
      
      if (error) {
        console.error("Erro ao verificar token do Google Ads:", error);
        setTokenStatus({
          isValid: false,
          error: `Erro ao chamar a função de verificação: ${error.message}`
        });
        return false;
      }
      
      if (!data.success) {
        console.error("Token do Google Ads inválido:", data.error, data.details);
        setTokenStatus({
          isValid: false, 
          error: data.error,
          details: data.details
        });
        return false;
      }
      
      // Token válido
      console.log("Token do Google Ads verificado com sucesso:", data);
      setTokenStatus({
        isValid: true
      });
      return true;
    } catch (err) {
      console.error("Erro inesperado ao verificar token:", err);
      setTokenStatus({
        isValid: false,
        error: err instanceof Error ? err.message : String(err)
      });
      return false;
    } finally {
      setIsVerifying(false);
    }
  };

  return {
    verifyGoogleAdsToken,
    isVerifying,
    tokenStatus
  };
};
