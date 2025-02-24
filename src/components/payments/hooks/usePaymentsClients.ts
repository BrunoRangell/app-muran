
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { startOfMonth, endOfMonth, isWithinInterval, parseISO } from "date-fns";
import { ClientWithTotalPayments } from "../types";

export function usePaymentsClients() {
  const queryClient = useQueryClient();

  const { data: clients, isLoading } = useQuery({
    queryKey: ["payments-clients"],
    queryFn: async () => {
      // Buscamos os clientes com seus pagamentos usando join
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
        .order("status", { ascending: false })
        .order("company_name");

      if (clientsError) {
        console.error("Erro ao buscar clientes:", clientsError);
        throw clientsError;
      }

      if (!clientsData) {
        console.warn("Nenhum cliente encontrado");
        return [];
      }

      const currentMonthStart = startOfMonth(new Date());
      const currentMonthEnd = endOfMonth(new Date());

      // Processa cada cliente
      const processedClients: ClientWithTotalPayments[] = clientsData.map(client => {
        const payments = client.payments || [];
        
        // Log para debug dos pagamentos do cliente
        console.log(`Pagamentos do cliente ${client.company_name}:`, payments);

        // Calcula o total recebido
        const total_received = payments.reduce((sum, payment) => {
          const amount = Number(payment.amount);
          if (isNaN(amount)) {
            console.warn(`Valor inválido encontrado para o pagamento:`, payment);
            return sum;
          }
          return sum + amount;
        }, 0);

        // Log do total calculado
        console.log(`Total calculado para ${client.company_name}:`, {
          payments_count: payments.length,
          total: total_received
        });

        // Verifica pagamentos do mês atual
        const hasCurrentMonthPayment = payments.some(payment => {
          const paymentDate = parseISO(payment.reference_month);
          return isWithinInterval(paymentDate, {
            start: currentMonthStart,
            end: currentMonthEnd
          });
        });

        // Retornamos o cliente processado com todas as propriedades necessárias
        return {
          id: client.id,
          company_name: client.company_name,
          contract_value: client.contract_value,
          status: client.status,
          first_payment_date: client.first_payment_date,
          payment_type: client.payment_type as "pre" | "post",
          acquisition_channel: client.acquisition_channel,
          company_birthday: client.company_birthday,
          contact_name: client.contact_name,
          contact_phone: client.contact_phone,
          last_payment_date: client.last_payment_date,
          total_received,
          payments: payments.map(p => ({
            id: p.id,
            amount: Number(p.amount),
            reference_month: p.reference_month,
            notes: p.notes
          })),
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

  return { clients, isLoading, handlePaymentUpdated };
}
