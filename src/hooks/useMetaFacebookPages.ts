import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useMetaFacebookPages = (accountId: string) => {
  return useQuery({
    queryKey: ['meta-facebook-pages', accountId],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('create-meta-audiences', {
        body: { action: 'fetch_facebook_pages', accountId }
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Erro ao buscar páginas Facebook');

      return data.pages;
    },
    enabled: !!accountId
  });
};
