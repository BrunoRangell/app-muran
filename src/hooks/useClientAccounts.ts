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

/**
 * Busca contas de um cliente.
 * - Modo interno (sem portalAccessToken): usa SELECT direto, protegido por RLS de team member.
 * - Modo portal (com portalAccessToken): usa RPC `get_portal_client_data`, que valida o token
 *   no servidor e libera as contas sem exigir login.
 */
export const useClientAccounts = (
  clientId: string,
  platform?: 'meta' | 'google',
  portalAccessToken?: string
) => {
  return useQuery({
    queryKey: ['client-accounts', clientId, platform, portalAccessToken ? 'portal' : 'internal'],
    queryFn: async () => {
      console.log('🔍 [useClientAccounts] Fetching accounts for client:', clientId, {
        portalMode: !!portalAccessToken,
      });

      // ===== Modo Portal: usa RPC pública validada por token =====
      if (portalAccessToken) {
        const { data, error } = await supabase.rpc('get_portal_client_data', {
          _token: portalAccessToken,
        });

        if (error) {
          console.error('❌ [useClientAccounts] Portal RPC error:', error);
          throw error;
        }

        const payload = data as { error?: string; accounts?: ClientAccount[] } | null;
        if (!payload || payload.error) {
          throw new Error(payload?.error || 'Portal não disponível');
        }

        let accounts = (payload.accounts || []) as ClientAccount[];
        if (platform) {
          accounts = accounts.filter(a => a.platform === platform);
        }

        console.log(`✅ [useClientAccounts] (portal) Found ${accounts.length} accounts`);
        return accounts;
      }

      // ===== Modo Interno: SELECT direto =====
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
