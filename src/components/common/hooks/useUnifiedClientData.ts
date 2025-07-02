
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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
      console.log(`[useUnifiedClientData] Buscando clientes ${platform} da estrutura unificada...`);
      
      const today = new Date().toISOString().split('T')[0];
      
      // Buscar usando a estrutura unificada
      const { data, error } = await supabase
        .from('clients')
        .select(`
          *,
          client_accounts!inner(
            id,
            account_id,
            account_name,
            platform,
            budget_reviews(
              total_spent,
              daily_budget_current,
              review_date,
              using_custom_budget,
              custom_budget_amount
            )
          )
        `)
        .eq('status', 'active')
        .eq('client_accounts.platform', platform)
        .eq('client_accounts.status', 'active');

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

    let totalSpend = 0;
    let clientsWithAdjustments = 0;

    clients.forEach(client => {
      const accounts = (client as any).client_accounts || [];
      
      accounts.forEach((account: any) => {
        const reviews = account.budget_reviews || [];
        const latestReview = reviews[0];
        
        if (latestReview) {
          totalSpend += latestReview.total_spent || 0;
          
          // Calcular se precisa de ajuste (exemplo: se gastou muito pouco ou muito em relação ao orçamento)
          if (latestReview.daily_budget_current && latestReview.total_spent) {
            const spentPercentage = (latestReview.total_spent / latestReview.daily_budget_current) * 100;
            if (spentPercentage > 80 || spentPercentage < 20) {
              clientsWithAdjustments++;
            }
          }
        }
      });
    });

    return {
      totalClients: clients.length,
      clientsWithAdjustments,
      clientsWithoutAccount: 0, // Todos têm conta pois filtramos na query
      averageSpend: clients.length > 0 ? totalSpend / clients.length : 0
    };
  }, [clients]);

  return {
    data: clients,
    metrics,
    isLoading,
    error,
    refreshData: refetch
  };
};
