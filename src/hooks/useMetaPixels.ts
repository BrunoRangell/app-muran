import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useMetaPixels = (accountId: string) => {
  // Normalizar accountId removendo "act_" se presente
  const normalizedAccountId = accountId.startsWith('act_') 
    ? accountId 
    : accountId ? `act_${accountId}` : '';

  return useQuery({
    queryKey: ['meta-pixels', normalizedAccountId],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('create-meta-audiences', {
        body: { action: 'fetch_pixels', accountId: normalizedAccountId }
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Erro ao buscar pixels');

      return data.pixels;
    },
    enabled: !!accountId && accountId.length >= 10
  });
};
