
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { startOfMonth, endOfMonth, isWithinInterval, parseISO } from "date-fns";
import { ClientWithTotalPayments } from "../types";

export function usePaymentsClients() {
  const queryClient = useQueryClient();

  const { data: clients, isLoading } = useQuery({
    queryKey: ["payments-clients"],
    queryFn: async () => {
      console.log("Buscando lista de clientes para recebimentos...");
      
      const { data: clientsData, error: clientsError } = await supabase
        .from("clients")
        .select("*")
        .order("status", { ascending: false })
        .order("company_name");

      if (clientsError) {
        console.error("Erro ao buscar clientes:", clientsError);
        throw clientsError;
      }

      const currentMonthStart = startOfMonth(new Date());
      const currentMonthEnd = endOfMonth(new Date());

      const { data: paymentsData, error: paymentsError } = await supabase
        .from("payments")
        .select("*")
        .order('reference_month', { ascending: false });

      if (paymentsError) {
        console.error("Erro ao buscar pagamentos:", paymentsError);
        throw paymentsError;
      }

      // Garante que os valores sejam sempre numéricos
      const paymentsByClient = paymentsData.reduce((acc: { [key: string]: any[] }, payment) => {
        if (payment.client_id) {
          if (!acc[payment.client_id]) {
            acc[payment.client_id] = [];
          }
          const amount = typeof payment.amount === 'string' 
            ? parseFloat(payment.amount) 
            : Number(payment.amount);

          acc[payment.client_id].push({
            id: payment.id,
            amount: amount || 0,
            reference_month: payment.reference_month,
            notes: payment.notes
          });
        }
        return acc;
      }, {});

      // Calcula os totais garantindo valores numéricos
      const totalsByClient = paymentsData.reduce((acc: { [key: string]: number }, payment) => {
        if (payment.client_id) {
          const amount = typeof payment.amount === 'string' 
            ? parseFloat(payment.amount) 
            : Number(payment.amount);
            
          acc[payment.client_id] = (acc[payment.client_id] || 0) + (amount || 0);
        }
        return acc;
      }, {});

      const clientsWithTotals: ClientWithTotalPayments[] = clientsData.map(client => {
        const clientPayments = paymentsByClient[client.id] || [];
        const total = totalsByClient[client.id] || 0;

        console.log(`Cliente ${client.company_name}:`, {
          total: total,
          paymentCount: clientPayments.length
        });

        const hasCurrentMonthPayment = clientPayments.some(payment => {
          const paymentDate = parseISO(payment.reference_month);
          return isWithinInterval(paymentDate, { start: currentMonthStart, end: currentMonthEnd });
        });

        return {
          ...client,
          total_received: total,
          payments: clientPayments,
          hasCurrentMonthPayment
        };
      });

      return clientsWithTotals;
    },
    staleTime: 0, // Força revalidação imediata
    cacheTime: 0  // Desabilita cache para garantir dados frescos
  });

  const handlePaymentUpdated = () => {
    queryClient.invalidateQueries({ queryKey: ["payments-clients"] });
  };

  return { clients, isLoading, handlePaymentUpdated };
}
