/**
 * FASE 4B: Query Client Unificado
 * Cache inteligente e configuração otimizada
 */

import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 10 * 60 * 1000, // 10 minutos padrão
      gcTime: 30 * 60 * 1000, // 30 minutos
      retry: 2,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      refetchOnMount: false, // Não refetch se dados ainda válidos
    },
  },
});
