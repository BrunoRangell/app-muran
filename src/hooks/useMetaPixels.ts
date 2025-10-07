import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useMetaPixels = (accountId: string) => {
  return useQuery({
    queryKey: ['meta-pixels', accountId],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('create-meta-audiences', {
        body: { action: 'fetch_pixels', accountId }
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Erro ao buscar pixels');

      return data.pixels;
    },
    enabled: !!accountId
  });
};
