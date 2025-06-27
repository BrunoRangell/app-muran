
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

interface GoogleAccountInfo {
  id: string;
  descriptiveName: string;
}

export const useGoogleAccountInfo = (accountId: string | null) => {
  return useQuery({
    queryKey: ["google-account-info", accountId],
    queryFn: async (): Promise<GoogleAccountInfo | null> => {
      if (!accountId) return null;
      
      console.log(`🔍 Buscando informações da conta Google: ${accountId}`);
      
      try {
        const { data, error } = await supabase.functions.invoke("google-account-info", {
          body: { accountId }
        });
        
        if (error) {
          console.error("Erro ao buscar informações da conta Google:", error);
          throw error;
        }
        
        console.log(`✅ Informações da conta Google obtidas:`, data);
        return data;
      } catch (error) {
        console.error("Erro na requisição para google-account-info:", error);
        throw error;
      }
    },
    enabled: !!accountId,
    staleTime: 60 * 60 * 1000, // Cache por 1 hora
    retry: 2
  });
};
