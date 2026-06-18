import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface TrafficInsightsParams {
  clientId: string;
  accountIds: string[];
  platform: 'meta' | 'google' | 'both';
  dateRange: {
    start: string;
    end: string;
  };
  compareWithPrevious?: boolean;
  /** Quando presente, autoriza chamadas públicas via portal do cliente */
  portalAccessToken?: string;
  /** Permite desabilitar a query externamente (default: true) */
  enabled?: boolean;
}

export const useTrafficInsights = (params: TrafficInsightsParams) => {
  const { enabled = true, ...rest } = params;
  return useQuery({
    queryKey: ['traffic-insights', rest],
    queryFn: async () => {
      console.log('🔍 [useTrafficInsights] Fetching data:', {
        ...rest,
        portalAccessToken: rest.portalAccessToken ? '[present]' : undefined,
      });

      const { data, error } = await supabase.functions.invoke('traffic-insights', {
        body: rest
      });

      if (error) {
        console.error('❌ [useTrafficInsights] Error:', error);
        throw error;
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Erro ao buscar insights de tráfego');
      }

      console.log('✅ [useTrafficInsights] Data received');
      return data;
    },
    enabled: enabled && !!rest.clientId && rest.accountIds.length > 0 && !!rest.platform,
    staleTime: 5 * 60 * 1000, // 5 minutos
    retry: 2
  });
};
