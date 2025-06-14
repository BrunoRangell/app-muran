
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { QUERY_KEYS } from "@/utils/queryUtils";
import { QUERY_STALE_TIME } from "@/constants";
import { logger } from "@/utils/logger";

export interface PaymentFilters {
  search?: string;
  clientId?: string;
  dateRange?: {
    start: string;
    end: string;
  };
  status?: string;
}

interface UseOptimizedPaymentsDataOptions {
  filters?: PaymentFilters;
  includeClients?: boolean;
}

export const useOptimizedPaymentsData = (options: UseOptimizedPaymentsDataOptions = {}) => {
  const { filters, includeClients = true } = options;

  return useQuery({
    queryKey: QUERY_KEYS.payments.byFilters(filters || {}),
    queryFn: async () => {
      try {
        let query = supabase.from("payments").select(
          includeClients 
            ? "*, clients(id, company_name, status)" 
            : "*"
        );

        // Aplicar filtros
        if (filters?.clientId) {
          query = query.eq("client_id", filters.clientId);
        }

        if (filters?.search && includeClients) {
          query = query.ilike("clients.company_name", `%${filters.search}%`);
        }

        if (filters?.dateRange) {
          query = query
            .gte("reference_month", filters.dateRange.start)
            .lte("reference_month", filters.dateRange.end);
        }

        const { data, error } = await query.order("created_at", { ascending: false });
        
        if (error) throw error;
        return data || [];
      } catch (error) {
        logger.error('PAYMENT', 'Failed to fetch optimized payments data', error);
        throw error;
      }
    },
    staleTime: QUERY_STALE_TIME.MEDIUM,
  });
};
