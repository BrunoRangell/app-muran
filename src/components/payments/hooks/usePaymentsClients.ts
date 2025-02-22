
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

      // Organiza pagamentos por cliente com validação de valores
      const paymentsByClient: PaymentsByClient = paymentsData.reduce((acc: PaymentsByClient, payment) => {
        if (!payment.client_id) return acc;
        
        if (!acc[payment.client_id]) {
          acc[payment.client_id] = [];
        }

        // Normaliza o valor do pagamento para número
        const rawAmount = payment.amount;
        let amount = 0;

        console.log('Processando valor do pagamento:', {
          id: payment.id,
          rawAmount,
          type: typeof rawAmount
        });

        if (typeof rawAmount === 'string') {
          // Remove qualquer caractere não numérico exceto ponto e hífen
          const cleanValue = rawAmount.replace(/[^0-9.-]+/g, '');
          amount = parseFloat(cleanValue);
        } else if (typeof rawAmount === 'number') {
          amount = rawAmount;
        }

        // Validação final do valor
        if (isNaN(amount)) {
          console.error('Valor inválido encontrado:', {
            payment,
            rawAmount,
            parsedAmount: amount
          });
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

      // Calcula totais por cliente com validação adicional
      const totalsByClient = Object.entries(paymentsByClient).reduce<{ [key: string]: number }>(
        (acc, [clientId, payments]) => {
          const total = payments.reduce((sum, payment) => {
            const paymentAmount = Number(payment.amount) || 0;
            console.log('Somando pagamento:', {
              clientId,
              paymentId: payment.id,
              amount: payment.amount,
              parsedAmount: paymentAmount,
              currentSum: sum
            });
            return sum + paymentAmount;
          }, 0);

          console.log('Total calculado para cliente:', {
            clientId,
            total,
            paymentsCount: payments.length
          });

          acc[clientId] = total;
          return acc;
        },
        {}
      );

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
