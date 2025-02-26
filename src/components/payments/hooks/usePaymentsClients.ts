
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

      // Buscar todos os pagamentos primeiro
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('payments')
        .select('*');

      if (paymentsError) {
        console.error("Erro ao buscar pagamentos:", paymentsError);
        throw paymentsError;
      }

      // Criar um mapa de pagamentos por cliente_id
      const paymentsMap = new Map<string, Payment[]>();
      paymentsData?.forEach(payment => {
        if (!paymentsMap.has(payment.client_id)) {
          paymentsMap.set(payment.client_id, []);
        }
        paymentsMap.get(payment.client_id)?.push({
          id: payment.id,
          amount: Number(payment.amount),
          reference_month: payment.reference_month,
          notes: payment.notes
        });
      });

      console.log("Total de pagamentos encontrados:", paymentsData?.length);

      // Buscar os clientes
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
          last_payment_date
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

      // Processar os clientes com seus pagamentos
      const processedClients: ClientWithTotalPayments[] = clientsData.map(client => {
        const clientPayments = paymentsMap.get(client.id) || [];
        
        // Calcular o total recebido
        const total_received = clientPayments.reduce((sum, payment) => {
          return sum + (Number(payment.amount) || 0);
        }, 0);

        console.log(`Processando cliente ${client.company_name}:`, {
          payments_count: clientPayments.length,
          total_received: total_received
        });

        // Verificar se tem pagamento no mês atual
        const currentMonthStart = startOfMonth(new Date());
        const currentMonthEnd = endOfMonth(new Date());
        const hasCurrentMonthPayment = clientPayments.some(payment => {
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
          payments: clientPayments,
          hasCurrentMonthPayment
        };
      });

      return processedClients;
    },
    staleTime: 0, // Removido o staleTime para sempre buscar dados frescos
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
