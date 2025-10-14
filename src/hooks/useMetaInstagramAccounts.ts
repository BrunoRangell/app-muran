import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useMetaInstagramAccounts = (accountId: string) => {
  // Normalizar accountId removendo "act_" se presente (edge function adiciona)
  const normalizedAccountId = accountId.startsWith('act_') 
    ? accountId.substring(4)
    : accountId;

  return useQuery({
    queryKey: ['meta-instagram-accounts', normalizedAccountId],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('create-meta-audiences', {
        body: { action: 'fetch_instagram_accounts', accountId: normalizedAccountId }
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Erro ao buscar perfis Instagram');

      return data.accounts;
    },
    enabled: !!accountId && accountId.length >= 10
  });
};
