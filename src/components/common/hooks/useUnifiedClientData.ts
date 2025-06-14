
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useMemo } from "react";

interface ClientMetrics {
  totalClients: number;
  clientsWithAdjustments: number;
  clientsWithoutAccount: number;
  averageSpend: number;
}

export const useUnifiedClientData = (platform: "meta" | "google") => {
  const { data: clients, isLoading, error, refetch } = useQuery({
    queryKey: [`${platform}-clients-unified`],
    queryFn: async () => {
      console.log(`[useUnifiedClientData] Buscando clientes ${platform}...`);
      
      let query = supabase
        .from('clients')
        .select(`
          *,
          ${platform}_ads_reviews:${platform === "meta" ? "meta_ads_reviews" : "google_ads_reviews"}(*)
        `)
        .eq('status', 'active');

      if (platform === "meta") {
        query = query.not('meta_account_id', 'is', null);
      } else {
        query = query.not('google_account_id', 'is', null);
      }

      const { data, error } = await query;
      
      if (error) {
        console.error(`[useUnifiedClientData] Erro ao buscar clientes ${platform}:`, error);
        throw error;
      }
      
      console.log(`[useUnifiedClientData] ${data?.length || 0} clientes ${platform} encontrados`);
      return data || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
  });

  const metrics = useMemo<ClientMetrics>(() => {
    if (!clients) return {
      totalClients: 0,
      clientsWithAdjustments: 0,
      clientsWithoutAccount: 0,
      averageSpend: 0
    };

    const accountField = platform === "meta" ? "meta_account_id" : "google_account_id";
    const reviewsField = platform === "meta" ? "meta_ads_reviews" : "google_ads_reviews";
    
    const clientsWithoutAccount = clients.filter(c => !c[accountField]).length;
    const clientsWithAdjustments = clients.filter(c => {
      const reviews = c[reviewsField] || [];
      return reviews.some((r: any) => r.needs_budget_adjustment);
    }).length;

    const totalSpend = clients.reduce((sum, client) => {
      const reviews = client[reviewsField] || [];
      const latestReview = reviews[0];
      return sum + (latestReview?.total_spent || 0);
    }, 0);

    return {
      totalClients: clients.length,
      clientsWithAdjustments,
      clientsWithoutAccount,
      averageSpend: clients.length > 0 ? totalSpend / clients.length : 0
    };
  }, [clients, platform]);

  return {
    data: clients,
    metrics,
    isLoading,
    error,
    refreshData: refetch
  };
};
