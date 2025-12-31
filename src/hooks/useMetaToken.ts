import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface MetaTokenStatus {
  status: 'active' | 'warning' | 'expired' | 'unknown';
  expiresAt: Date | null;
  lastRefreshed: Date | null;
  lastChecked: Date | null;
  daysRemaining: number | null;
  details: Record<string, unknown> | null;
}

export function useMetaToken() {
  const [tokenStatus, setTokenStatus] = useState<MetaTokenStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { toast } = useToast();

  const fetchTokenStatus = useCallback(async () => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('meta_token_metadata')
        .select('*')
        .eq('token_type', 'access_token')
        .single();

      if (error) {
        console.error('Erro ao buscar status do token Meta:', error);
        setTokenStatus({
          status: 'unknown',
          expiresAt: null,
          lastRefreshed: null,
          lastChecked: null,
          daysRemaining: null,
          details: null
        });
        return;
      }

      const expiresAt = data.expires_at ? new Date(data.expires_at) : null;
      const now = new Date();
      let daysRemaining: number | null = null;
      let status: 'active' | 'warning' | 'expired' | 'unknown' = 'unknown';

      if (expiresAt) {
        daysRemaining = Math.floor((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysRemaining < 0) {
          status = 'expired';
        } else if (daysRemaining <= 15) {
          status = 'warning';
        } else {
          status = 'active';
        }
      } else if (data.status === 'expired') {
        status = 'expired';
      }

      setTokenStatus({
        status,
        expiresAt,
        lastRefreshed: data.last_refreshed ? new Date(data.last_refreshed) : null,
        lastChecked: data.last_checked ? new Date(data.last_checked) : null,
        daysRemaining,
        details: data.details as Record<string, unknown> | null
      });
    } catch (error) {
      console.error('Erro ao buscar status do token Meta:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshToken = useCallback(async () => {
    try {
      setIsRefreshing(true);
      
      const { data, error } = await supabase.functions.invoke('refresh-meta-token', {
        body: { manual: true }
      });

      if (error) {
        throw new Error(error.message);
      }

      if (!data.success) {
        throw new Error(data.error || 'Erro desconhecido ao renovar token');
      }

      toast({
        title: 'Token renovado',
        description: `Token Meta renovado com sucesso. Expira em ${data.expires_in_days} dias.`
      });

      // Atualizar status
      await fetchTokenStatus();
      
      return { success: true };
    } catch (error) {
      console.error('Erro ao renovar token Meta:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      
      toast({
        title: 'Erro ao renovar token',
        description: errorMessage.includes('expired') 
          ? 'O token expirou. É necessário gerar um novo token manualmente.'
          : errorMessage,
        variant: 'destructive'
      });
      
      return { success: false, error: errorMessage };
    } finally {
      setIsRefreshing(false);
    }
  }, [toast, fetchTokenStatus]);

  const updateToken = useCallback(async (newToken: string) => {
    try {
      setIsRefreshing(true);

      // Atualizar token no banco
      const { error: tokenError } = await supabase
        .from('api_tokens')
        .update({ 
          value: newToken,
          updated_at: new Date().toISOString()
        })
        .eq('name', 'meta_access_token');

      if (tokenError) {
        throw new Error(`Erro ao atualizar token: ${tokenError.message}`);
      }

      // Calcular nova expiração (60 dias)
      const newExpiryDate = new Date(Date.now() + (60 * 24 * 60 * 60 * 1000));

      // Atualizar metadata
      await supabase
        .from('meta_token_metadata')
        .update({
          status: 'active',
          last_refreshed: new Date().toISOString(),
          last_checked: new Date().toISOString(),
          expires_at: newExpiryDate.toISOString(),
          updated_at: new Date().toISOString(),
          details: {
            last_manual_update: new Date().toISOString(),
            expires_in_days: 60
          }
        })
        .eq('token_type', 'access_token');

      toast({
        title: 'Token atualizado',
        description: 'O novo token foi salvo com sucesso. Válido por 60 dias.'
      });

      await fetchTokenStatus();
      
      return { success: true };
    } catch (error) {
      console.error('Erro ao atualizar token Meta:', error);
      
      toast({
        title: 'Erro ao atualizar token',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive'
      });
      
      return { success: false };
    } finally {
      setIsRefreshing(false);
    }
  }, [toast, fetchTokenStatus]);

  useEffect(() => {
    fetchTokenStatus();
  }, [fetchTokenStatus]);

  return {
    tokenStatus,
    isLoading,
    isRefreshing,
    refreshToken,
    updateToken,
    refetch: fetchTokenStatus
  };
}
