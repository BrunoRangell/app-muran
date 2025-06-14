
import { useCallback, useMemo } from "react";
import { useOptimizedQuery } from "./useOptimizedQuery";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { QUERY_KEYS } from "@/utils/queryUtils";
import { useCacheManager } from "@/utils/cacheUtils";
import { startOfMonth, endOfMonth, isWithinInterval, parseISO } from "date-fns";
import { useStableCallback } from "./useMemoizedCallback";

interface PaymentFilters {
  clientId?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
}

export const useOptimizedPaymentsData = (filters?: PaymentFilters) => {
  const queryClient = useQueryClient();
  const cacheManager = useCacheManager(queryClient);

  // Memoizar filtros para evitar re-fetches desnecessários
  const memoizedFilters = useMemo(() => filters || {}, [JSON.stringify(filters)]);

  // Query otimizada para pagamentos
  const paymentsQuery = useOptimizedQuery({
    queryKey: QUERY_KEYS.payments.byFilters(memoizedFilters),
    queryFn: async () => {
      let query = supabase
        .from("payments")
        .select(`
          *,
          clients!inner (
            id,
            company_name,
            status,
            contract_value
          )
        `);

      if (memoizedFilters.clientId) {
        query = query.eq("client_id", memoizedFilters.clientId);
      }

      if (memoizedFilters.startDate) {
        query = query.gte("reference_month", memoizedFilters.startDate);
      }

      if (memoizedFilters.endDate) {
        query = query.lte("reference_month", memoizedFilters.endDate);
      }

      const { data, error } = await query.order("reference_month", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    staleTime: 2 * 60 * 1000, // 2 minutos para dados de pagamento
    enableBackgroundRefetch: true
  });

  // Query otimizada para clientes com pagamentos
  const clientsWithPaymentsQuery = useOptimizedQuery({
    queryKey: QUERY_KEYS.clients.withPayments,
    queryFn: async () => {
      // Buscar clientes e pagamentos em paralelo
      const [clientsResult, paymentsResult] = await Promise.all([
        supabase.from("clients").select("*"),
        supabase.from("payments").select("*")
      ]);

      if (clientsResult.error) throw clientsResult.error;
      if (paymentsResult.error) throw paymentsResult.error;

      const clients = clientsResult.data || [];
      const payments = paymentsResult.data || [];

      // Processar dados de forma otimizada
      const currentDate = new Date();
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);

      // Criar mapa de pagamentos por cliente (O(n) ao invés de O(n²))
      const paymentsByClient = payments.reduce((acc, payment) => {
        if (payment.client_id) {
          if (!acc[payment.client_id]) {
            acc[payment.client_id] = [];
          }
          acc[payment.client_id].push(payment);
        }
        return acc;
      }, {} as Record<string, any[]>);

      // Processar clientes
      const processedClients = clients.map(client => {
        const clientPayments = paymentsByClient[client.id] || [];
        
        const totalReceived = clientPayments.reduce((acc, payment) => {
          return acc + Number(payment.amount || 0);
        }, 0);
        
        const hasCurrentMonthPayment = clientPayments.some(payment => {
          if (!payment.reference_month) return false;
          
          try {
            const paymentDate = parseISO(payment.reference_month);
            return isWithinInterval(paymentDate, {
              start: monthStart,
              end: monthEnd
            });
          } catch {
            return false;
          }
        });
        
        return {
          ...client,
          payments: clientPayments,
          total_received: totalReceived,
          hasCurrentMonthPayment
        };
      });

      // Ordenar de forma otimizada
      processedClients.sort((a, b) => {
        if (a.status !== b.status) {
          return a.status === 'active' ? -1 : 1;
        }
        return a.company_name.localeCompare(b.company_name);
      });

      return processedClients;
    },
    staleTime: 5 * 60 * 1000, // 5 minutos para lista de clientes
    memoryOptimized: true
  });

  // Mutations otimizadas com callbacks estáveis
  const createPayment = useMutation({
    mutationFn: async (paymentData: any) => {
      const { data, error } = await supabase
        .from("payments")
        .insert(paymentData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: useStableCallback(() => {
      cacheManager.invalidatePayments();
    }),
  });

  const updatePayment = useMutation({
    mutationFn: async (paymentData: any) => {
      const { data, error } = await supabase
        .from("payments")
        .update(paymentData)
        .eq("id", paymentData.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: useStableCallback(() => {
      cacheManager.invalidatePayments();
    }),
  });

  const deletePayment = useMutation({
    mutationFn: async (paymentId: string) => {
      const { error } = await supabase
        .from("payments")
        .delete()
        .eq("id", paymentId);

      if (error) throw error;
    },
    onSuccess: useStableCallback(() => {
      cacheManager.invalidatePayments();
    }),
  });

  // Callbacks estáveis para refetch
  const refetchPayments = useStableCallback(() => paymentsQuery.refetch());
  const refetchClients = useStableCallback(() => clientsWithPaymentsQuery.refetch());

  return {
    // Dados
    payments: paymentsQuery.data || [],
    clientsWithPayments: clientsWithPaymentsQuery.data || [],
    
    // Estados de loading
    isLoadingPayments: paymentsQuery.isLoading,
    isLoadingClients: clientsWithPaymentsQuery.isLoading,
    isLoading: paymentsQuery.isLoading || clientsWithPaymentsQuery.isLoading,
    
    // Errors
    paymentsError: paymentsQuery.error,
    clientsError: clientsWithPaymentsQuery.error,
    
    // Mutations
    createPayment,
    updatePayment,
    deletePayment,
    
    // Refetch functions
    refetchPayments,
    refetchClients,
  };
};
