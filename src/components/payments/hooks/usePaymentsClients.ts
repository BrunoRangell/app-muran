
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { startOfMonth, endOfMonth, isWithinInterval, parseISO } from "date-fns";
import { ClientWithTotalPayments, Payment } from "../types";

// Interface para o objeto de pagamentos por cliente
interface PaymentsByClient {
  [key: string]: Payment[];
}

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

      console.log('Dados brutos de pagamentos:', paymentsData);

      const currentMonthStart = startOfMonth(new Date());
      const currentMonthEnd = endOfMonth(new Date());

      // Função auxiliar para converter valor para número
      const parseAmount = (value: any): number => {
        if (typeof value === 'number' && !isNaN(value)) {
          return value;
        }
        if (typeof value === 'string') {
          const cleanValue = value.replace(/[^0-9.-]+/g, '');
          const parsed = parseFloat(cleanValue);
          return isNaN(parsed) ? 0 : parsed;
        }
        return 0;
      };

      // Organiza pagamentos por cliente com validação de valores
      const paymentsByClient: PaymentsByClient = paymentsData.reduce((acc: PaymentsByClient, payment) => {
        if (!payment.client_id) return acc;
        
        if (!acc[payment.client_id]) {
          acc[payment.client_id] = [];
        }

        const amount = parseAmount(payment.amount);

        console.log('Processando pagamento:', {
          id: payment.id,
          originalAmount: payment.amount,
          parsedAmount: amount,
          type: typeof amount
        });

        acc[payment.client_id].push({
          id: payment.id,
          amount: amount,
          reference_month: payment.reference_month,
          notes: payment.notes
        });
        
        return acc;
      }, {});

      // Calcula totais por cliente
      const totalsByClient: { [key: string]: number } = {};

      for (const [clientId, payments] of Object.entries(paymentsByClient)) {
        let total = 0;
        
        for (const payment of payments) {
          const amount = parseAmount(payment.amount);
          total += amount;

          console.log('Somando pagamento:', {
            clientId,
            paymentId: payment.id,
            originalAmount: payment.amount,
            parsedAmount: amount,
            runningTotal: total
          });
        }

        totalsByClient[clientId] = total;
        
        console.log('Total calculado para cliente:', {
          clientId,
          total,
          paymentsCount: payments.length
        });
      }

      // Monta objeto final com os dados dos clientes
      const clientsWithTotals: ClientWithTotalPayments[] = clientsData.map(client => {
        const clientPayments = paymentsByClient[client.id] || [];
        const total = totalsByClient[client.id] || 0;

        console.log(`Processando cliente ${client.company_name}:`, {
          id: client.id,
          total,
          paymentCount: clientPayments.length,
          payments: clientPayments.map(p => ({ id: p.id, amount: p.amount }))
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
