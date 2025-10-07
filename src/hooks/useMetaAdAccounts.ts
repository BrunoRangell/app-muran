import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useMetaAdAccounts = () => {
  return useQuery({
    queryKey: ['meta-ad-accounts'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('create-meta-audiences', {
        body: { action: 'fetch_accounts' }
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Erro ao buscar contas');

      return data.accounts;
    }
  });
};
