
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { QUERY_KEYS } from "@/utils/queryUtils";
import { QUERY_STALE_TIME } from "@/constants";
import { logger } from "@/utils/logger";

interface UseUnifiedClientDataOptions {
  includeInactive?: boolean;
  includePayments?: boolean;
  filters?: any;
}

export const useUnifiedClientData = (options: UseUnifiedClientDataOptions = {}) => {
  const { includeInactive = false, includePayments = false, filters } = options;

  const clientsQuery = useQuery({
    queryKey: QUERY_KEYS.clients.unified,
    queryFn: async () => {
      try {
        let query = supabase.from("clients").select("*");
        
        if (!includeInactive) {
          query = query.eq("status", "active");
        }

        if (filters) {
          if (filters.search) {
            query = query.ilike("company_name", `%${filters.search}%`);
          }
          if (filters.status) {
            query = query.eq("status", filters.status);
          }
        }

        const { data: clients, error } = await query;
        if (error) throw error;

        let processedClients = clients || [];

        if (includePayments) {
          const { data: payments, error: paymentsError } = await supabase
            .from("payments")
            .select("*");

          if (paymentsError) throw paymentsError;

          const paymentsByClient = payments?.reduce((acc, payment) => {
            if (payment.client_id) {
              if (!acc[payment.client_id]) {
                acc[payment.client_id] = [];
              }
              acc[payment.client_id].push(payment);
            }
            return acc;
          }, {} as Record<string, any[]>) || {};

          processedClients = processedClients.map(client => ({
            ...client,
            payments: paymentsByClient[client.id] || []
          }));
        }

        return processedClients;
      } catch (error) {
        logger.error('CLIENT', 'Failed to fetch unified client data', error);
        throw error;
      }
    },
    staleTime: QUERY_STALE_TIME.MEDIUM,
  });

  return {
    clients: clientsQuery.data,
    isLoading: clientsQuery.isLoading,
    error: clientsQuery.error,
    refetch: clientsQuery.refetch,
  };
};
