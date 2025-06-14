
import { useCallback, useMemo } from "react";
import { useOptimizedQuery } from "./useOptimizedQuery";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { QUERY_KEYS, createQueryKey } from "@/utils/queryUtils";
import { useCacheManager } from "@/utils/cacheUtils";
import { startOfMonth, endOfMonth, isWithinInterval, parseISO } from "date-fns";
import { useStableCallback } from "./useMemoizedCallback";
import { QUERY_STALE_TIME } from "@/constants";
import { logger } from "@/utils/logger";

export interface PaymentFilters {
  clientId?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
}

export const useOptimizedPaymentsData = (filters?: PaymentFilters) => {
  const queryClient = useQueryClient();
  const cacheManager = useCacheManager(queryClient);

  const memoizedFilters = useMemo(() => filters || {}, [JSON.stringify(filters)]);

  const paymentsQuery = useOptimizedQuery({
    queryKey: createQueryKey(QUERY_KEYS.payments.all, 'filters', memoizedFilters),
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
    staleTime: QUERY_STALE_TIME.MEDIUM,
    moduleName: 'PAYMENT'
  });

  const clientsWithPaymentsQuery = useOptimizedQuery({
    queryKey: createQueryKey(QUERY_KEYS.clients.withPayments),
    queryFn: async () => {
      const [clientsResult, paymentsResult] = await Promise.all([
        supabase.from("clients").select("*"),
        supabase.from("payments").select("*")
      ]);

      if (clientsResult.error) throw clientsResult.error;
      if (paymentsResult.error) throw paymentsResult.error;

      const clients = clientsResult.data || [];
      const payments = paymentsResult.data || [];

      const currentDate = new Date();
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);

      const paymentsByClient = payments.reduce((acc, payment) => {
        if (payment.client_id) {
          if (!acc[payment.client_id]) {
            acc[payment.client_id] = [];
          }
          acc[payment.client_id].push(payment);
        }
        return acc;
      }, {} as Record<string, any[]>);

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

      processedClients.sort((a, b) => {
        if (a.status !== b.status) {
          return a.status === 'active' ? -1 : 1;
        }
        return a.company_name.localeCompare(b.company_name);
      });

      return processedClients;
    },
    staleTime: QUERY_STALE_TIME.LONG,
    moduleName: 'CLIENT'
  });

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

  const refetchPayments = useStableCallback(() => paymentsQuery.refetch());
  const refetchClients = useStableCallback(() => clientsWithPaymentsQuery.refetch());

  return {
    payments: paymentsQuery.data || [],
    clientsWithPayments: clientsWithPaymentsQuery.data || [],
    
    isLoadingPayments: paymentsQuery.isLoading,
    isLoadingClients: clientsWithPaymentsQuery.isLoading,
    isLoading: paymentsQuery.isLoading || clientsWithPaymentsQuery.isLoading,
    
    paymentsError: paymentsQuery.error,
    clientsError: clientsWithPaymentsQuery.error,
    
    createPayment,
    updatePayment,
    deletePayment,
    
    refetchPayments,
    refetchClients,
  };
};
