import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface CreateAudiencesPayload {
  accountId: string;
  pixelId?: string;
  siteEvents: string[];
  engagementTypes: string[];
  instagramAccountId?: string;
  facebookPageId?: string;
}

export const useCreateAudiences = () => {
  return useMutation({
    mutationFn: async (payload: CreateAudiencesPayload) => {
      const { data, error } = await supabase.functions.invoke('create-meta-audiences', {
        body: { 
          action: 'create_unified_audiences',
          ...payload
        }
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Erro ao criar públicos');

      return data;
    }
  });
};
