import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ClientAccount {
  id: string;
  account_id: string;
  account_name: string;
  platform: 'meta' | 'google';
  status: string;
  is_primary: boolean;
  created_at: string;
}

export const useClientAccounts = (clientId: string, platform?: 'meta' | 'google') => {
  return useQuery({
    queryKey: ['client-accounts', clientId, platform],
    queryFn: async () => {
      console.log('🔍 [useClientAccounts] Fetching accounts for client:', clientId);

      let query = supabase
        .from('client_accounts')
        .select('*')
        .eq('client_id', clientId)
        .eq('status', 'active')
        .order('is_primary', { ascending: false })
        .order('created_at', { ascending: true });

      if (platform) {
        query = query.eq('platform', platform);
      }

      const { data, error } = await query;

      if (error) {
        console.error('❌ [useClientAccounts] Error:', error);
        throw error;
      }

      console.log(`✅ [useClientAccounts] Found ${data?.length || 0} accounts`);
      return data as ClientAccount[];
    },
    enabled: !!clientId,
    staleTime: 10 * 60 * 1000 // 10 minutos
  });
};
