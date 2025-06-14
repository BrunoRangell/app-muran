
import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import { logger } from "@/utils/logger";
import { QUERY_STALE_TIME } from "@/constants";

interface OptimizedQueryOptions<T> extends Omit<UseQueryOptions<T>, 'queryKey' | 'queryFn'> {
  queryKey: string[];
  queryFn: () => Promise<T>;
  moduleName?: string;
}

export function useOptimizedQuery<T>({
  queryKey,
  queryFn,
  moduleName = 'QUERY',
  staleTime = QUERY_STALE_TIME.MEDIUM,
  retry = 3,
  retryDelay = 1000,
  ...options
}: OptimizedQueryOptions<T>) {
  
  const optimizedQueryFn = async (): Promise<T> => {
    try {
      const result = await queryFn();
      return result;
    } catch (error) {
      logger.error(moduleName as any, `Query failed: ${queryKey.join('.')}`, error);
      throw error;
    }
  };

  return useQuery({
    queryKey,
    queryFn: optimizedQueryFn,
    staleTime,
    retry,
    retryDelay,
    ...options
  });
}
