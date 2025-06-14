
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { QUERY_KEYS } from "@/utils/queryUtils";
import { showDataOperationToast } from "@/utils/toastUtils";
import { useCacheManager } from "@/utils/cacheUtils";
import { handleError } from "@/utils/errorUtils";
import { startOfMonth, endOfMonth, isWithinInterval, parseISO } from "date-fns";

interface PaymentFilters {
  clientId?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
}

export const useUnifiedPaymentsData = (filters?: PaymentFilters) => {
  const queryClient = useQueryClient();
  const cacheManager = useCacheManager(queryClient);

  // Query para buscar pagamentos
  const paymentsQuery = useQuery({
    queryKey: QUERY_KEYS.payments.byFilters(filters || {}),
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

      if (filters?.clientId) {
        query = query.eq("client_id", filters.clientId);
      }

      if (filters?.startDate) {
        query = query.gte("reference_month", filters.startDate);
      }

      if (filters?.endDate) {
        query = query.lte("reference_month", filters.endDate);
      }

      const { data, error } = await query.order("reference_month", { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  // Query para buscar clientes com informações de pagamento
  const clientsWithPaymentsQuery = useQuery({
    queryKey: QUERY_KEYS.clients.withPayments,
    queryFn: async () => {
      // Buscar clientes
      const { data: clients, error: clientsError } = await supabase
        .from("clients")
        .select("*");

      if (clientsError) throw clientsError;

      // Buscar pagamentos
      const { data: payments, error: paymentsError } = await supabase
        .from("payments")
        .select("*");

      if (paymentsError) throw paymentsError;

      // Processar dados
      const currentDate = new Date();
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);

      // Agrupar pagamentos por cliente
      const paymentsByClient: Record<string, any[]> = {};
      payments?.forEach(payment => {
        if (payment.client_id) {
          if (!paymentsByClient[payment.client_id]) {
            paymentsByClient[payment.client_id] = [];
          }
          paymentsByClient[payment.client_id].push(payment);
        }
      });

      // Processar clientes com informações de pagamento
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
          } catch (error) {
            console.error("Erro ao verificar data:", error);
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

      // Ordenar por status (ativos primeiro) e depois por nome
      processedClients.sort((a, b) => {
        if (a.status !== b.status) {
          return a.status === 'active' ? -1 : 1;
        }
        return a.company_name.localeCompare(b.company_name);
      });

      return processedClients;
    }
  });

  // Mutation para criar pagamento
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
    onSuccess: () => {
      cacheManager.invalidatePayments();
      showDataOperationToast('payments', 'created');
    },
    onError: (error) => {
      handleError(error, "criar pagamento");
      showDataOperationToast('payments', 'createError');
    },
  });

  // Mutation para atualizar pagamento
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
    onSuccess: () => {
      cacheManager.invalidatePayments();
      showDataOperationToast('payments', 'updated');
    },
    onError: (error) => {
      handleError(error, "atualizar pagamento");
      showDataOperationToast('payments', 'updateError');
    },
  });

  // Mutation para excluir pagamento
  const deletePayment = useMutation({
    mutationFn: async (paymentId: string) => {
      const { error } = await supabase
        .from("payments")
        .delete()
        .eq("id", paymentId);

      if (error) throw error;
    },
    onSuccess: () => {
      cacheManager.invalidatePayments();
      showDataOperationToast('payments', 'deleted');
    },
    onError: (error) => {
      handleError(error, "excluir pagamento");
      showDataOperationToast('payments', 'deleteError');
    },
  });

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
    refetchPayments: paymentsQuery.refetch,
    refetchClients: clientsWithPaymentsQuery.refetch,
  };
};
