
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { startOfMonth, endOfMonth, isWithinInterval, parseISO } from "date-fns";
import { ClientWithTotalPayments, Payment } from "../types";

export function usePaymentsClients() {
  const queryClient = useQueryClient();

  const { data: clients, isLoading } = useQuery({
    queryKey: ["payments-clients"],
    queryFn: async () => {
      try {
        console.log("🔍 Iniciando busca de dados...");

        // Buscar pagamentos com join em clients para garantir integridade dos dados
        const { data: payments, error: paymentsError } = await supabase
          .from('payments')
          .select(`
            id,
            amount,
            reference_month,
            notes,
            client_id,
            clients (
              id,
              company_name
            )
          `);

        if (paymentsError) {
          console.error("❌ Erro ao buscar pagamentos:", paymentsError);
          throw paymentsError;
        }

        console.log("💰 Total de pagamentos encontrados:", payments?.length);

        // Mapear pagamentos por cliente
        const paymentsMap: Record<string, Payment[]> = {};
        payments?.forEach(payment => {
          if (!payment.client_id) return;
          
          if (!paymentsMap[payment.client_id]) {
            paymentsMap[payment.client_id] = [];
          }

          paymentsMap[payment.client_id].push({
            id: payment.id,
            amount: Number(payment.amount),
            reference_month: payment.reference_month,
            notes: payment.notes
          });
        });

        // Buscar clientes
        const { data: clientsData, error: clientsError } = await supabase
          .from("clients")
          .select('*')
          .order('status', { ascending: false })
          .order('company_name');

        if (clientsError) {
          console.error("❌ Erro ao buscar clientes:", clientsError);
          throw clientsError;
        }

        console.log("👥 Total de clientes encontrados:", clientsData?.length);

        // Processar clientes com seus pagamentos
        const processedClients = (clientsData || []).map(client => {
          const clientPayments = paymentsMap[client.id] || [];
          const total_received = clientPayments.reduce((sum, payment) => 
            sum + (Number(payment.amount) || 0), 0);

          console.log(`📊 Cliente ${client.company_name}:`, {
            total_received,
            num_payments: clientPayments.length
          });

          const currentMonthStart = startOfMonth(new Date());
          const currentMonthEnd = endOfMonth(new Date());
          
          const hasCurrentMonthPayment = clientPayments.some(payment => {
            try {
              const paymentDate = parseISO(payment.reference_month);
              return isWithinInterval(paymentDate, {
                start: currentMonthStart,
                end: currentMonthEnd
              });
            } catch {
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

        console.log("✅ Processamento finalizado:", {
          total_clients: processedClients.length,
          total_payments: payments?.length
        });

        return processedClients;
      } catch (error) {
        console.error("❌ Erro durante o processamento:", error);
        throw error;
      }
    },
    staleTime: 1000 * 60, // 1 minuto
    gcTime: 1000 * 60 * 5, // 5 minutos
    refetchOnWindowFocus: true
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
