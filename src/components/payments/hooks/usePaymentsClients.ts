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

      // Busca todos os clientes
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

      // Busca todos os pagamentos
      const { data: allPayments, error: paymentsError } = await supabase
        .from("payments")
        .select("*")
        .order('reference_month', { ascending: false });

      if (paymentsError) {
        console.error("[usePaymentsClients] Erro ao buscar pagamentos:", paymentsError);
        throw paymentsError;
      }

      console.log("[usePaymentsClients] Pagamentos encontrados:", allPayments?.length || 0);

      // Mapeia os pagamentos por client_id para acesso rápido
      const paymentsMap = new Map<string, any[]>();
      allPayments?.forEach(payment => {
        const clientId = String(payment.client_id); // Garante que o ID seja uma string
        if (!paymentsMap.has(clientId)) {
          paymentsMap.set(clientId, []);
        }
        paymentsMap.get(clientId)?.push({
          id: payment.id,
          amount: Number(payment.amount) || 0,
          reference_month: payment.reference_month,
          notes: payment.notes
        });
      });

      // Processa os clientes com seus pagamentos
      const processedClients: ClientWithTotalPayments[] = (clientsData || []).map(client => {
        const clientId = String(client.id); // Garante que o ID seja uma string
        const clientPayments = (paymentsMap.get(clientId) || []).filter(p => p); // Filtra valores inválidos

        console.log(`[usePaymentsClients] Pagamentos do cliente ${client.company_name}:`, clientPayments);

        // Calcula o total recebido
        const total_received = clientPayments.reduce(
          (sum, payment) => sum + (Number(payment.amount) || 0),
          0
        );

        console.log(`[usePaymentsClients] Total de ${client.company_name}: ${total_received}`);

        // Verifica se há pagamento no mês atual
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

      console.log("[usePaymentsClients] Total de clientes processados:", processedClients.length);

      return processedClients;
    },
    staleTime: 4 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
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
