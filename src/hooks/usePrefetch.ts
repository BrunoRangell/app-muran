/**
 * FASE 3: Prefetch Estratégico
 * Pré-carrega dados para navegação instantânea
 */

import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";

export const usePrefetch = () => {
  const queryClient = useQueryClient();

  const prefetchGoogleAdsData = async () => {
    logger.debug("🚀 [PREFETCH] Pre-loading Google Ads data...");
    
    await queryClient.prefetchQuery({
      queryKey: ['google-ads-clients-data'],
      queryFn: async () => {
        const { data } = await supabase
          .from('clients')
          .select('id, company_name')
          .eq('status', 'active');
        return data || [];
      },
      staleTime: 30 * 60 * 1000,
    });
  };

  const prefetchMetaAdsData = async () => {
    logger.debug("🚀 [PREFETCH] Pre-loading Meta Ads data...");
    
    await queryClient.prefetchQuery({
      queryKey: ['meta-ads-clients-data'],
      queryFn: async () => {
        const { data } = await supabase
          .from('clients')
          .select('id, company_name')
          .eq('status', 'active');
        return data || [];
      },
      staleTime: 30 * 60 * 1000,
    });
  };

  const prefetchFinancialData = async () => {
    logger.debug("🚀 [PREFETCH] Pre-loading financial data...");
    
    await queryClient.prefetchQuery({
      queryKey: ['unified-clients'],
      queryFn: async () => {
        const { data } = await supabase
          .from('clients')
          .select('*')
          .order('company_name');
        return data || [];
      },
      staleTime: 30 * 60 * 1000,
    });
  };

  return {
    prefetchGoogleAdsData,
    prefetchMetaAdsData,
    prefetchFinancialData,
  };
};
