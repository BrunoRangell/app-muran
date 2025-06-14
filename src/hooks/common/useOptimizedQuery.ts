
import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import { useMemo } from "react";
import { handleError } from "@/utils/errorUtils";

interface OptimizedQueryOptions<T> extends Omit<UseQueryOptions<T>, 'queryKey' | 'queryFn'> {
  queryKey: readonly unknown[];
  queryFn: () => Promise<T>;
  enableBackgroundRefetch?: boolean;
  memoryOptimized?: boolean;
}

export function useOptimizedQuery<T>({
  queryKey,
  queryFn,
  enableBackgroundRefetch = false,
  memoryOptimized = true,
  staleTime = 5 * 60 * 1000, // 5 minutos padrão
  gcTime = 10 * 60 * 1000, // 10 minutos padrão
  refetchOnWindowFocus = false,
  retry = 2,
  ...options
}: OptimizedQueryOptions<T>) {
  
  // Memoizar queryKey para evitar re-renders desnecessários
  const memoizedQueryKey = useMemo(() => queryKey, [JSON.stringify(queryKey)]);
  
  // Configurações otimizadas baseadas no tipo de query
  const optimizedOptions = useMemo(() => ({
    staleTime,
    gcTime: memoryOptimized ? gcTime : 30 * 60 * 1000, // Mais tempo se não for memory optimized
    refetchOnWindowFocus: enableBackgroundRefetch ? refetchOnWindowFocus : false,
    refetchOnMount: enableBackgroundRefetch ? 'always' as const : false,
    retry,
    retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
    ...options
  }), [staleTime, gcTime, memoryOptimized, enableBackgroundRefetch, refetchOnWindowFocus, retry, options]);

  return useQuery({
    queryKey: memoizedQueryKey,
    queryFn,
    ...optimizedOptions,
    meta: {
      ...optimizedOptions.meta,
      onError: (error: Error) => {
        handleError(error, `Query ${queryKey[0]}`);
        if (optimizedOptions.meta && 'onError' in optimizedOptions.meta && typeof optimizedOptions.meta.onError === 'function') {
          optimizedOptions.meta.onError(error);
        }
      }
    }
  });
}
