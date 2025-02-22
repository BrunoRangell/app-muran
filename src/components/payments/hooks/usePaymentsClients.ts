
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
      
      // Busca clientes
      const { data: clientsData, error: clientsError } = await supabase
        .from("clients")
        .select("*")
        .order("status", { ascending: false })
        .order("company_name");

      if (clientsError) {
        console.error("Erro ao buscar clientes:", clientsError);
        throw clientsError;
      }

      // Busca pagamentos
      const { data: paymentsData, error: paymentsError } = await supabase
        .from("payments")
        .select("*")
        .order('reference_month', { ascending: false });

      if (paymentsError) {
        console.error("Erro ao buscar pagamentos:", paymentsError);
        throw paymentsError;
      }

      const currentMonthStart = startOfMonth(new Date());
      const currentMonthEnd = endOfMonth(new Date());

      // Organiza pagamentos por cliente
      const paymentsByClient = paymentsData.reduce((acc: { [key: string]: any[] }, payment) => {
        if (!payment.client_id) return acc;
        
        if (!acc[payment.client_id]) {
          acc[payment.client_id] = [];
        }

        // Garante que o amount seja um número
        let amount = 0;
        if (typeof payment.amount === 'string') {
          amount = parseFloat(payment.amount.replace(/[^0-9.-]+/g, ''));
        } else if (typeof payment.amount === 'number') {
          amount = payment.amount;
        }

        // Verifica se é um número válido
        if (isNaN(amount)) {
          console.error('Valor inválido detectado:', payment);
          amount = 0;
        }

        acc[payment.client_id].push({
          id: payment.id,
          amount: amount,
          reference_month: payment.reference_month,
          notes: payment.notes
        });
        
        return acc;
      }, {});

      // Calcula totais por cliente
      const totalsByClient = Object.entries(paymentsByClient).reduce(
        (acc: { [key: string]: number }, [clientId, payments]) => {
          acc[clientId] = payments.reduce((total, payment) => {
            // Garante que estamos somando números
            const amount = typeof payment.amount === 'number' ? payment.amount : 0;
            return total + amount;
          }, 0);
          return acc;
        },
        {}
      );

      // Monta objeto final com os dados dos clientes
      const clientsWithTotals: ClientWithTotalPayments[] = clientsData.map(client => {
        const clientPayments = paymentsByClient[client.id] || [];
        const total = totalsByClient[client.id] || 0;

        // Log para debug
        console.log(`Cliente ${client.company_name}:`, {
          total,
          paymentCount: clientPayments.length,
          payments: clientPayments
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
  });

  const handlePaymentUpdated = () => {
    // Invalida o cache e força uma nova busca
    queryClient.invalidateQueries({ queryKey: ["payments-clients"] });
  };

  return { clients, isLoading, handlePaymentUpdated };
}
