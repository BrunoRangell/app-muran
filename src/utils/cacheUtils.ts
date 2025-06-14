
import { QueryClient } from "@tanstack/react-query";

export class CacheManager {
  private queryClient: QueryClient;

  constructor(queryClient: QueryClient) {
    this.queryClient = queryClient;
  }

  // Invalidação específica por entidade
  invalidateClients() {
    this.queryClient.invalidateQueries({ queryKey: ["unified-clients"] });
    this.queryClient.invalidateQueries({ queryKey: ["clients"] });
    this.queryClient.invalidateQueries({ queryKey: ["clients-active"] });
  }

  invalidatePayments() {
    this.queryClient.invalidateQueries({ queryKey: ["payments"] });
    this.queryClient.invalidateQueries({ queryKey: ["payments-clients"] });
    this.queryClient.invalidateQueries({ queryKey: ["recebimentos-nova"] });
  }

  invalidateCosts() {
    this.queryClient.invalidateQueries({ queryKey: ["costs"] });
  }

  invalidateFinancialData() {
    this.invalidateClients();
    this.invalidatePayments();
    this.invalidateCosts();
    this.queryClient.invalidateQueries({ queryKey: ["allClientsMetrics"] });
    this.queryClient.invalidateQueries({ queryKey: ["filteredClientsMetrics"] });
  }

  invalidateReviews() {
    this.queryClient.invalidateQueries({ queryKey: ["meta-clients-unified"] });
    this.queryClient.invalidateQueries({ queryKey: ["google-clients-unified"] });
  }

  // Invalidação geral por padrão
  invalidateByPattern(pattern: string) {
    this.queryClient.invalidateQueries({ 
      predicate: (query) => query.queryKey.some(key => 
        typeof key === 'string' && key.includes(pattern)
      )
    });
  }
}

// Hook para usar o cache manager
export const useCacheManager = (queryClient: QueryClient) => {
  return new CacheManager(queryClient);
};
