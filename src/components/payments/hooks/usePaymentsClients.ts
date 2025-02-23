
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { startOfMonth, endOfMonth, isWithinInterval, parseISO } from "date-fns";
import { ClientWithTotalPayments, Payment } from "../types";

export function usePaymentsClients() {
  const queryClient = useQueryClient();

  const { data: clients, isLoading } = useQuery({
    queryKey: ["payments-clients"],
    queryFn: async () => {
      // Primeiro, buscamos os clientes
      const { data: clientsData, error: clientsError } = await supabase
        .from("clients")
        .select(`
          *,
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

      console.log("Dados brutos dos clientes:", clientsData);

      const currentMonthStart = startOfMonth(new Date());
      const currentMonthEnd = endOfMonth(new Date());

      // Processamos os dados de cada cliente
      const processedClients: ClientWithTotalPayments[] = clientsData.map(client => {
        // Garantimos que payments é um array
        const payments = Array.isArray(client.payments) ? client.payments : [];
        
        // Calculamos o total recebido somando todos os pagamentos
        const total_received = payments.reduce((sum, payment) => {
          // Garantimos que amount é um número
          const amount = typeof payment.amount === 'string' 
            ? parseFloat(payment.amount) 
            : payment.amount;

          // Só somamos se for um número válido
          return !isNaN(amount) ? sum + amount : sum;
        }, 0);

        console.log(`Processando cliente ${client.company_name}:`, {
          total_payments: payments.length,
          total_received: total_received
        });

        // Verificamos se há pagamento no mês atual
        const hasCurrentMonthPayment = payments.some(payment => {
          try {
            const paymentDate = parseISO(payment.reference_month);
            return isWithinInterval(paymentDate, {
              start: currentMonthStart,
              end: currentMonthEnd
            });
          } catch (error) {
            console.error('Erro ao processar data do pagamento:', error);
            return false;
          }
        });

        // Retornamos o cliente processado
        return {
          ...client,
          total_received: total_received,
          payments: payments.map(p => ({
            id: p.id,
            amount: typeof p.amount === 'string' ? parseFloat(p.amount) : p.amount,
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

  return { 
    clients, 
    isLoading, 
    handlePaymentUpdated 
  };
}
