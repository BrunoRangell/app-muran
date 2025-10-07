import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useCreateAudiences = () => {
  return useMutation({
    mutationFn: async (payload: any) => {
      const { data, error } = await supabase.functions.invoke('create-meta-audiences', {
        body: { action: 'create_audiences', ...payload }
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Erro ao criar públicos');

      return data;
    }
  });
};
