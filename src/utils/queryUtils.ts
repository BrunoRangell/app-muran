
import { useQueryClient } from "@tanstack/react-query";

// Padrões de queries para facilitar invalidação
export const QUERY_KEYS = {
  clients: {
    all: ["clients"] as const,
    unified: ["unified-clients"] as const,
    active: ["clients-active"] as const,
    byId: (id: string) => ["clients", id] as const,
  },
  payments: {
    all: ["payments"] as const,
    byClient: (clientId: string) => ["payments", "client", clientId] as const,
    recebimentos: ["recebimentos-nova"] as const,
  },
  costs: {
    all: ["costs"] as const,
    byFilters: (filters: Record<string, any>) => ["costs", filters] as const,
  },
  metrics: {
    allClients: ["allClientsMetrics"] as const,
    filtered: ["filteredClientsMetrics"] as const,
  },
  reviews: {
    meta: ["meta-clients-unified"] as const,
    google: ["google-clients-unified"] as const,
  }
} as const;

// Hook unificado para invalidação de queries
export const useQueryInvalidation = () => {
  const queryClient = useQueryClient();

  return {
    invalidateClients: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.clients.all });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.clients.unified });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.clients.active });
    },
    
    invalidatePayments: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.payments.all });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.payments.recebimentos });
    },
    
    invalidateCosts: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.costs.all });
    },
    
    invalidateFinancialData: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.clients.all });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.payments.all });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.costs.all });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.metrics.allClients });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.metrics.filtered });
    },
    
    invalidateReviews: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.reviews.meta });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.reviews.google });
    },
    
    invalidateAll: () => {
      queryClient.invalidateQueries();
    }
  };
};
