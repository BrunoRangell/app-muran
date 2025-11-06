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
}

export const useTrafficInsights = (params: TrafficInsightsParams) => {
  return useQuery({
    queryKey: ['traffic-insights', params],
    queryFn: async () => {
      console.log('🔍 [useTrafficInsights] Fetching data:', params);

      const { data, error } = await supabase.functions.invoke('traffic-insights', {
        body: params
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
    enabled: !!params.clientId && params.accountIds.length > 0 && !!params.platform,
    staleTime: 5 * 60 * 1000, // 5 minutos
    retry: 2
  });
};
