
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { startOfMonth, endOfMonth, isWithinInterval, parseISO } from "date-fns";
import { ClientWithTotalPayments, Payment } from "../types";

export function usePaymentsClients() {
  const queryClient = useQueryClient();

  const { data: clients, isLoading } = useQuery({
    queryKey: ["payments-clients"],
    queryFn: async () => {
      console.log("Iniciando busca de clientes e pagamentos...");

      // Busca os clientes com seus pagamentos em uma única query
      const { data: clientsData, error: clientsError } = await supabase
        .from("clients")
        .select(`
          id,
          company_name,
          contract_value,
          status,
          first_payment_date,
          payment_type,
          acquisition_channel,
          company_birthday,
          contact_name,
          contact_phone,
          last_payment_date,
          payments (
            id,
            amount,
            reference_month,
            notes
          )
        `)
        .order('status', { ascending: false })
        .order('company_name');

      if (clientsError) {
        console.error("Erro ao buscar clientes:", clientsError);
        throw clientsError;
      }

      if (!clientsData) {
        console.warn("Nenhum cliente encontrado");
        return [];
      }

      console.log("Dados brutos recebidos do banco:", JSON.stringify(clientsData, null, 2));

      // Processa os clientes e seus pagamentos
      const processedClients: ClientWithTotalPayments[] = clientsData.map(client => {
        // Garante que payments seja sempre um array
        const payments = client.payments || [];
        
        // Processa os pagamentos e calcula o total
        const processedPayments = payments.map(payment => {
          // Garante que o amount seja um número
          const amount = typeof payment.amount === 'string' 
            ? parseFloat(payment.amount.replace(',', '.'))
            : Number(payment.amount);

          return {
            id: payment.id,
            amount: Number.isNaN(amount) ? 0 : amount,
            reference_month: payment.reference_month || '',
            notes: payment.notes || null
          };
        });

        // Calcula o total recebido
        const total_received = processedPayments.reduce((sum, payment) => {
          return sum + (Number.isNaN(payment.amount) ? 0 : payment.amount);
        }, 0);

        console.log(`Total calculado para ${client.company_name}:`, {
          payments_count: processedPayments.length,
          total_received: total_received
        });

        // Verifica se tem pagamento no mês atual
        const currentMonthStart = startOfMonth(new Date());
        const currentMonthEnd = endOfMonth(new Date());
        const hasCurrentMonthPayment = processedPayments.some(payment => {
          if (!payment.reference_month) return false;
          try {
            const paymentDate = parseISO(payment.reference_month);
            return isWithinInterval(paymentDate, {
              start: currentMonthStart,
              end: currentMonthEnd
            });
          } catch (error) {
            console.error('Erro ao verificar data do pagamento:', error);
            return false;
          }
        });

        return {
          id: client.id,
          company_name: client.company_name,
          contract_value: Number(client.contract_value) || 0,
          status: client.status,
          first_payment_date: client.first_payment_date,
          payment_type: client.payment_type as "pre" | "post",
          acquisition_channel: client.acquisition_channel,
          company_birthday: client.company_birthday,
          contact_name: client.contact_name,
          contact_phone: client.contact_phone,
          last_payment_date: client.last_payment_date,
          total_received: total_received,
          payments: processedPayments,
          hasCurrentMonthPayment
        };
      });

      return processedClients;
    },
    staleTime: 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
  });

  const handlePaymentUpdated = () => {
    queryClient.invalidateQueries({ queryKey: ["payments-clients"] });
  };

  return { 
    clients, 
    isLoading, 
    handlePaymentUpdated 
  };
}
