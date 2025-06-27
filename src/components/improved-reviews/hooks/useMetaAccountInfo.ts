
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

interface MetaAccountInfo {
  name: string;
  account_id: string;
  id: string;
}

export const useMetaAccountInfo = (accountId: string | null) => {
  return useQuery({
    queryKey: ["meta-account-info", accountId],
    queryFn: async (): Promise<MetaAccountInfo | null> => {
      if (!accountId) return null;
      
      console.log(`🔍 Buscando informações da conta Meta: ${accountId}`);
      
      try {
        const { data, error } = await supabase.functions.invoke("meta-account-info", {
          body: { accountId }
        });
        
        if (error) {
          console.error("Erro ao buscar informações da conta Meta:", error);
          throw error;
        }
        
        console.log(`✅ Informações da conta Meta obtidas:`, data);
        return data;
      } catch (error) {
        console.error("Erro na requisição para meta-account-info:", error);
        throw error;
      }
    },
    enabled: !!accountId,
    staleTime: 60 * 60 * 1000, // Cache por 1 hora
    retry: 2
  });
};
