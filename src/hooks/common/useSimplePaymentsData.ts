
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { QUERY_KEYS } from "@/utils/queryUtils";
import { QUERY_STALE_TIME } from "@/constants";
import { logger } from "@/utils/logger";
import { startOfMonth, endOfMonth, isWithinInterval, parseISO } from "date-fns";

export const useSimplePaymentsData = () => {
  const clientsWithPaymentsQuery = useQuery({
    queryKey: QUERY_KEYS.clients.withPayments,
    queryFn: async () => {
      try {
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
      } catch (error) {
        logger.error('PAYMENT', 'Failed to fetch clients with payments', error);
        throw error;
      }
    },
    staleTime: QUERY_STALE_TIME.LONG,
  });

  return {
    clientsWithPayments: clientsWithPaymentsQuery.data || [],
    isLoadingClients: clientsWithPaymentsQuery.isLoading,
    error: clientsWithPaymentsQuery.error,
    refetchClients: clientsWithPaymentsQuery.refetch,
  };
};
