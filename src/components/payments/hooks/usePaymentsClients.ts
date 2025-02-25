
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { startOfMonth, endOfMonth, isWithinInterval, parseISO } from "date-fns";
import { ClientWithTotalPayments } from "../types";

export function usePaymentsClients() {
  const queryClient = useQueryClient();

  const { data: clients, isLoading } = useQuery({
    queryKey: ["payments-clients"],
    queryFn: async () => {
      console.log("[usePaymentsClients] Iniciando busca...");

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
        console.error("[usePaymentsClients] Erro ao buscar clientes:", clientsError);
        throw clientsError;
      }

      // Busca todos os pagamentos separadamente
      const { data: allPayments, error: paymentsError } = await supabase
        .from("payments")
        .select("*")
        .order('reference_month', { ascending: false });

      if (paymentsError) {
        console.error("[usePaymentsClients] Erro ao buscar pagamentos:", paymentsError);
        throw paymentsError;
      }

      console.log("[usePaymentsClients] Pagamentos encontrados:", allPayments?.length || 0);

      // Mapeia os pagamentos por cliente_id para acesso mais rápido
      const paymentsMap = new Map();
      allPayments?.forEach(payment => {
        if (!paymentsMap.has(payment.client_id)) {
          paymentsMap.set(payment.client_id, []);
        }
        paymentsMap.get(payment.client_id).push({
          id: payment.id,
          amount: Number(payment.amount) || 0,
          reference_month: payment.reference_month,
          notes: payment.notes
        });
      });

      // Processa os clientes com seus pagamentos
      const processedClients: ClientWithTotalPayments[] = (clientsData || []).map(client => {
        const clientPayments = paymentsMap.get(client.id) || [];
        console.log(`[usePaymentsClients] Processando ${client.company_name}:`, {
          payments_found: clientPayments.length
        });

        const total_received = clientPayments.reduce((sum, payment) => 
          sum + (Number(payment.amount) || 0), 0);

        // Verifica pagamento do mês atual
        const currentMonthStart = startOfMonth(new Date());
        const currentMonthEnd = endOfMonth(new Date());
        const hasCurrentMonthPayment = clientPayments.some(payment => {
          if (!payment.reference_month) return false;
          const paymentDate = parseISO(payment.reference_month);
          return isWithinInterval(paymentDate, {
            start: currentMonthStart,
            end: currentMonthEnd
          });
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
          total_received,
          payments: clientPayments,
          hasCurrentMonthPayment
        };
      });

      console.log("[usePaymentsClients] Total de clientes processados:", 
        processedClients.length);

      return processedClients;
    },
    staleTime: 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
  });

  const handlePaymentUpdated = () => {
    console.log("[usePaymentsClients] Atualizando dados...");
    queryClient.invalidateQueries({ queryKey: ["payments-clients"] });
  };

  return { 
    clients, 
    isLoading, 
    handlePaymentUpdated 
  };
}
