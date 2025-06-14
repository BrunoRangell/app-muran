
import { QueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "./queryUtils";

export class OptimizedCacheManager {
  private queryClient: QueryClient;
  private invalidationQueue: Set<string> = new Set();
  private isProcessing = false;

  constructor(queryClient: QueryClient) {
    this.queryClient = queryClient;
  }

  // Invalidação em batch para evitar múltiplas operações
  private async processBatchInvalidation() {
    if (this.isProcessing || this.invalidationQueue.size === 0) return;
    
    this.isProcessing = true;
    const queries = Array.from(this.invalidationQueue);
    this.invalidationQueue.clear();

    try {
      // Processar invalidações em paralelo
      await Promise.all(
        queries.map(queryPattern => 
          this.queryClient.invalidateQueries({ 
            predicate: (query) => 
              query.queryKey.some(key => 
                typeof key === 'string' && key.includes(queryPattern)
              )
          })
        )
      );
    } finally {
      this.isProcessing = false;
    }
  }

  // Invalidação otimizada com debounce
  private queueInvalidation(pattern: string) {
    this.invalidationQueue.add(pattern);
    
    // Debounce para evitar invalidações excessivas
    setTimeout(() => {
      this.processBatchInvalidation();
    }, 100);
  }

  // Métodos otimizados de invalidação
  invalidateClients() {
    this.queueInvalidation('clients');
  }

  invalidatePayments() {
    this.queueInvalidation('payments');
    this.queueInvalidation('recebimentos');
  }

  invalidateCosts() {
    this.queueInvalidation('costs');
  }

  invalidateFinancialData() {
    this.queueInvalidation('clients');
    this.queueInvalidation('payments');
    this.queueInvalidation('costs');
    this.queueInvalidation('metrics');
  }

  // Cache warming para dados críticos
  async warmupCache() {
    const criticalQueries = [
      QUERY_KEYS.clients.active,
      QUERY_KEYS.payments.recebimentos,
      QUERY_KEYS.metrics.allClients
    ];

    // Pre-fetch dados críticos em paralelo
    await Promise.allSettled(
      criticalQueries.map(queryKey => 
        this.queryClient.prefetchQuery({ queryKey })
      )
    );
  }

  // Limpeza inteligente de cache
  cleanupStaleData(maxAge = 30 * 60 * 1000) { // 30 minutos
    const now = Date.now();
    
    this.queryClient.getQueryCache().getAll().forEach(query => {
      const lastFetch = query.state.dataUpdatedAt;
      if (now - lastFetch > maxAge && !query.observers.length) {
        this.queryClient.removeQueries({ queryKey: query.queryKey });
      }
    });
  }
}

// Hook otimizado para usar o cache manager
export const useOptimizedCacheManager = (queryClient: QueryClient) => {
  return new OptimizedCacheManager(queryClient);
};
