import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useMetaFacebookPages = (accountId: string) => {
  console.log('[useMetaFacebookPages] 📥 accountId recebido:', accountId);
  console.log('[useMetaFacebookPages] ⚡ enabled?', !!accountId && accountId.length >= 10);

  return useQuery({
    queryKey: ['meta-facebook-pages', accountId],
    queryFn: async () => {
      console.log('[useMetaFacebookPages] 🚀 Chamando edge function com accountId:', accountId);
      
      const { data, error } = await supabase.functions.invoke('create-meta-audiences', {
        body: { action: 'fetch_facebook_pages', accountId }
      });

      console.log('[useMetaFacebookPages] 📦 Resposta raw:', { data, error });

      if (error) {
        console.error('[useMetaFacebookPages] ❌ Erro na chamada:', error);
        throw error;
      }
      if (!data?.success) {
        console.error('[useMetaFacebookPages] ❌ Erro da API:', data?.error);
        throw new Error(data?.error || 'Erro ao buscar páginas Facebook');
      }

      console.log('[useMetaFacebookPages] ✅ Páginas encontradas:', data.pages);
      return data.pages;
    },
    enabled: !!accountId && accountId.length >= 10
  });
};
