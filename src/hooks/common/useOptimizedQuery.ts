
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
    const startTime = performance.now();
    
    try {
      logger.info(moduleName, `Iniciando query: ${queryKey.join('.')}`);
      
      const result = await queryFn();
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      logger.info(moduleName, `Query concluída em ${duration.toFixed(2)}ms`);
      
      return result;
      
    } catch (error) {
      logger.error(moduleName, `Erro na query: ${queryKey.join('.')}`, error);
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
