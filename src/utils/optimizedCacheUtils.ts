
import { QueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "./queryUtils";
import { logger } from "./logger";

interface CacheInvalidationOptions {
  silent?: boolean;
  force?: boolean;
}

export class OptimizedCacheManager {
  private invalidationQueue = new Set<string>();
  private batchTimeout: NodeJS.Timeout | null = null;

  constructor(private queryClient: QueryClient) {}

  private processBatch() {
    if (this.invalidationQueue.size === 0) return;

    const keys = Array.from(this.invalidationQueue);
    this.invalidationQueue.clear();

    keys.forEach(key => {
      this.queryClient.invalidateQueries({ queryKey: [key] });
    });

    logger.info('CACHE', `Batch invalidated ${keys.length} query keys`);
  }

  private scheduleInvalidation(queryKey: string[]) {
    const key = queryKey.join('.');
    this.invalidationQueue.add(key);

    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
    }

    this.batchTimeout = setTimeout(() => {
      this.processBatch();
      this.batchTimeout = null;
    }, 100);
  }

  invalidateClients(options: CacheInvalidationOptions = {}) {
    if (options.force) {
      this.queryClient.invalidateQueries({ queryKey: QUERY_KEYS.clients.all });
      this.queryClient.invalidateQueries({ queryKey: QUERY_KEYS.clients.withPayments });
      this.queryClient.invalidateQueries({ queryKey: QUERY_KEYS.clients.unified });
      this.queryClient.invalidateQueries({ queryKey: QUERY_KEYS.clients.active });
    } else {
      this.scheduleInvalidation(QUERY_KEYS.clients.all);
      this.scheduleInvalidation(QUERY_KEYS.clients.withPayments);
      this.scheduleInvalidation(QUERY_KEYS.clients.unified);
      this.scheduleInvalidation(QUERY_KEYS.clients.active);
    }

    if (!options.silent) {
      logger.info('CACHE', 'Scheduled client cache invalidation');
    }
  }

  invalidatePayments(options: CacheInvalidationOptions = {}) {
    if (options.force) {
      this.queryClient.invalidateQueries({ queryKey: QUERY_KEYS.payments.all });
      this.queryClient.invalidateQueries({ queryKey: QUERY_KEYS.payments.recebimentos });
    } else {
      this.scheduleInvalidation(QUERY_KEYS.payments.all);
      this.scheduleInvalidation(QUERY_KEYS.payments.recebimentos);
    }

    if (!options.silent) {
      logger.info('CACHE', 'Scheduled payment cache invalidation');
    }
  }

  invalidateMetrics(options: CacheInvalidationOptions = {}) {
    if (options.force) {
      this.queryClient.invalidateQueries({ queryKey: QUERY_KEYS.metrics.allClients });
      this.queryClient.invalidateQueries({ queryKey: QUERY_KEYS.metrics.filtered });
    } else {
      this.scheduleInvalidation(QUERY_KEYS.metrics.allClients);
      this.scheduleInvalidation(QUERY_KEYS.metrics.filtered);
    }

    if (!options.silent) {
      logger.info('CACHE', 'Scheduled metrics cache invalidation');
    }
  }

  clearAll() {
    this.queryClient.clear();
    this.invalidationQueue.clear();
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
      this.batchTimeout = null;
    }
    logger.info('CACHE', 'Cleared all cache and invalidation queue');
  }
}

export const useOptimizedCacheManager = (queryClient: QueryClient) => {
  return new OptimizedCacheManager(queryClient);
};
