import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useMetaInstagramAccounts = (accountId: string) => {
  console.log('[useMetaInstagramAccounts] 📥 accountId recebido:', accountId);
  console.log('[useMetaInstagramAccounts] ⚡ enabled?', !!accountId && accountId.length >= 10);

  return useQuery({
    queryKey: ['meta-instagram-accounts', accountId],
    queryFn: async () => {
      console.log('[useMetaInstagramAccounts] 🚀 Chamando edge function com accountId:', accountId);
      
      const { data, error } = await supabase.functions.invoke('create-meta-audiences', {
        body: { action: 'fetch_instagram_accounts', accountId }
      });

      console.log('[useMetaInstagramAccounts] 📦 Resposta raw:', { data, error });

      if (error) {
        console.error('[useMetaInstagramAccounts] ❌ Erro na chamada:', error);
        throw error;
      }
      if (!data?.success) {
        console.error('[useMetaInstagramAccounts] ❌ Erro da API:', data?.error);
        throw new Error(data?.error || 'Erro ao buscar perfis Instagram');
      }

      console.log('[useMetaInstagramAccounts] ✅ Contas encontradas:', data.accounts);
      return data.accounts;
    },
    enabled: !!accountId && accountId.length >= 10
  });
};
