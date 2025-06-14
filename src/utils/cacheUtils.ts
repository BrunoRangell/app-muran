
import { QueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "./queryUtils";
import { logger } from "./logger";

export class CacheManager {
  constructor(private queryClient: QueryClient) {}

  invalidateClients() {
    this.queryClient.invalidateQueries({ queryKey: QUERY_KEYS.clients.all });
    this.queryClient.invalidateQueries({ queryKey: QUERY_KEYS.clients.withPayments });
    this.queryClient.invalidateQueries({ queryKey: QUERY_KEYS.clients.unified });
    this.queryClient.invalidateQueries({ queryKey: QUERY_KEYS.clients.active });
    logger.info('CACHE', 'Invalidated client queries');
  }

  invalidatePayments() {
    this.queryClient.invalidateQueries({ queryKey: QUERY_KEYS.payments.all });
    this.queryClient.invalidateQueries({ queryKey: QUERY_KEYS.payments.recebimentos });
    logger.info('CACHE', 'Invalidated payment queries');
  }

  invalidateCosts() {
    this.queryClient.invalidateQueries({ queryKey: QUERY_KEYS.costs.all });
    logger.info('CACHE', 'Invalidated cost queries');
  }

  invalidateReviews() {
    this.queryClient.invalidateQueries({ queryKey: QUERY_KEYS.reviews.meta });
    this.queryClient.invalidateQueries({ queryKey: QUERY_KEYS.reviews.google });
    logger.info('CACHE', 'Invalidated review queries');
  }

  invalidateMetrics() {
    this.queryClient.invalidateQueries({ queryKey: QUERY_KEYS.metrics.allClients });
    this.queryClient.invalidateQueries({ queryKey: QUERY_KEYS.metrics.filtered });
    logger.info('CACHE', 'Invalidated metrics queries');
  }

  invalidateAll() {
    this.queryClient.clear();
    logger.info('CACHE', 'Cleared all cache');
  }
}

export const useCacheManager = (queryClient: QueryClient) => {
  return new CacheManager(queryClient);
};
