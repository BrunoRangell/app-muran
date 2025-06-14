
import { QueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "./queryUtils";

export class CacheManager {
  private queryClient: QueryClient;

  constructor(queryClient: QueryClient) {
    this.queryClient = queryClient;
  }

  // Invalidação específica por entidade usando query keys padronizados
  invalidateClients() {
    this.queryClient.invalidateQueries({ queryKey: QUERY_KEYS.clients.all });
    this.queryClient.invalidateQueries({ queryKey: QUERY_KEYS.clients.unified });
    this.queryClient.invalidateQueries({ queryKey: QUERY_KEYS.clients.active });
  }

  invalidatePayments() {
    this.queryClient.invalidateQueries({ queryKey: QUERY_KEYS.payments.all });
    this.queryClient.invalidateQueries({ queryKey: QUERY_KEYS.payments.recebimentos });
  }

  invalidateCosts() {
    this.queryClient.invalidateQueries({ queryKey: QUERY_KEYS.costs.all });
  }

  invalidateFinancialData() {
    this.invalidateClients();
    this.invalidatePayments();
    this.invalidateCosts();
    this.queryClient.invalidateQueries({ queryKey: QUERY_KEYS.metrics.allClients });
    this.queryClient.invalidateQueries({ queryKey: QUERY_KEYS.metrics.filtered });
  }

  invalidateReviews() {
    this.queryClient.invalidateQueries({ queryKey: QUERY_KEYS.reviews.meta });
    this.queryClient.invalidateQueries({ queryKey: QUERY_KEYS.reviews.google });
  }

  // Invalidação geral por padrão
  invalidateByPattern(pattern: string) {
    this.queryClient.invalidateQueries({ 
      predicate: (query) => query.queryKey.some(key => 
        typeof key === 'string' && key.includes(pattern)
      )
    });
  }

  // Método para limpeza completa do cache
  clearAll() {
    this.queryClient.clear();
  }

  // Método para remover queries específicas
  removeQueries(queryKey: readonly unknown[]) {
    this.queryClient.removeQueries({ queryKey });
  }
}

// Hook para usar o cache manager
export const useCacheManager = (queryClient: QueryClient) => {
  return new CacheManager(queryClient);
};
