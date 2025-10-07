import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useMetaInstagramAccounts = (accountId: string) => {
  return useQuery({
    queryKey: ['meta-instagram-accounts', accountId],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('create-meta-audiences', {
        body: { action: 'fetch_instagram_accounts', accountId }
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Erro ao buscar perfis Instagram');

      return data.accounts;
    },
    enabled: !!accountId
  });
};
