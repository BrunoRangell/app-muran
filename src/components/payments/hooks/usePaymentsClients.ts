
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
        console.log("=== Iniciando busca de pagamentos e clientes ===");

        // Busca mais detalhada dos pagamentos incluindo informações do cliente
        const { data: paymentsData, error: paymentsError } = await supabase
          .from('payments')
          .select(`
            *,
            clients (
              id,
              company_name
            )
          `);

        if (paymentsError) {
          console.error("❌ Erro ao buscar pagamentos:", paymentsError);
          throw paymentsError;
        }

        console.log("✅ Pagamentos encontrados:", paymentsData?.length || 0);
        console.log("📊 Amostra dos primeiros 3 pagamentos:", paymentsData?.slice(0, 3));

        // Criar mapa de pagamentos por client_id de forma mais robusta
        const paymentsMap = new Map<string, Payment[]>();
        paymentsData?.forEach(payment => {
          const clientId = payment.client_id;
          if (!clientId) {
            console.warn("⚠️ Pagamento sem client_id:", payment);
            return;
          }

          if (!paymentsMap.has(clientId)) {
            paymentsMap.set(clientId, []);
          }

          paymentsMap.get(clientId)?.push({
            id: payment.id,
            amount: Number(payment.amount),
            reference_month: payment.reference_month,
            notes: payment.notes
          });
        });

        // Buscar clientes com informações completas
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
          console.error("❌ Erro ao buscar clientes:", clientsError);
          throw clientsError;
        }

        console.log("✅ Clientes encontrados:", clientsData?.length || 0);
        console.log("📊 Amostra dos primeiros 3 clientes:", clientsData?.slice(0, 3));

        if (!clientsData || clientsData.length === 0) {
          console.warn("⚠️ Nenhum cliente encontrado");
          return [];
        }

        // Processar os clientes com seus pagamentos
        const processedClients: ClientWithTotalPayments[] = clientsData.map(client => {
          const clientPayments = paymentsMap.get(client.id) || [];
          
          // Calcular o total recebido
          const total_received = clientPayments.reduce((sum, payment) => {
            return sum + (Number(payment.amount) || 0);
          }, 0);

          // Debug para cada cliente processado
          console.log(`📝 Cliente ${client.company_name}:`, {
            id: client.id,
            pagamentos: clientPayments.length,
            total: total_received
          });

          // Verificar pagamento do mês atual
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
              console.error('❌ Erro ao verificar data do pagamento:', error);
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

        console.log("=== Finalizado processamento ===");
        console.log("📊 Total de clientes processados:", processedClients.length);

        return processedClients;
      } catch (error) {
        console.error("❌ Erro durante o processamento:", error);
        throw error;
      }
    },
    staleTime: 30000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
    placeholderData: (previousData) => previousData,
    meta: {
      errorMessage: "Erro ao carregar os dados dos clientes"
    }
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
