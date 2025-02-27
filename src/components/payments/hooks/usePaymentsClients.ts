
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

        // Buscar todos os clientes primeiro
        const { data: clientsData, error: clientsError } = await supabase
          .from("clients")
          .select('*')
          .order('status', { ascending: false })
          .order('company_name');

        if (clientsError) {
          console.error("❌ Erro ao buscar clientes:", clientsError);
          throw clientsError;
        }

        console.log("👥 Total de clientes encontrados:", clientsData?.length || 0);

        // Depois buscar todos os pagamentos
        const { data: paymentsData, error: paymentsError } = await supabase
          .from('payments')
          .select('*');

        if (paymentsError) {
          console.error("❌ Erro ao buscar pagamentos:", paymentsError);
          throw paymentsError;
        }

        console.log("💰 Total de pagamentos encontrados:", paymentsData?.length || 0);

        // Criar mapa de pagamentos por cliente
        const paymentsMap: Record<string, Payment[]> = {};
        
        if (paymentsData && paymentsData.length > 0) {
          paymentsData.forEach(payment => {
            if (!payment.client_id) return;
            
            const clientId = payment.client_id.toString();
            
            if (!paymentsMap[clientId]) {
              paymentsMap[clientId] = [];
            }
            
            paymentsMap[clientId].push({
              id: payment.id,
              amount: Number(payment.amount) || 0,
              reference_month: payment.reference_month || "",
              notes: payment.notes || null
            });
          });
        }

        // Processar clientes com seus pagamentos
        const currentMonthStart = startOfMonth(new Date());
        const currentMonthEnd = endOfMonth(new Date());
        
        const processedClients = (clientsData || []).map(client => {
          const clientId = client.id.toString();
          const clientPayments = paymentsMap[clientId] || [];
          
          // Calcular total recebido com validação para evitar NaN
          const total_received = clientPayments.reduce((sum, payment) => {
            const amount = Number(payment.amount) || 0;
            return sum + amount;
          }, 0);
          
          // Verificar pagamento do mês atual
          const hasCurrentMonthPayment = clientPayments.some(payment => {
            if (!payment.reference_month) return false;
            
            try {
              const paymentDate = parseISO(payment.reference_month);
              return isWithinInterval(paymentDate, {
                start: currentMonthStart,
                end: currentMonthEnd
              });
            } catch (error) {
              console.error("Erro ao processar data:", error);
              return false;
            }
          });

          return {
            id: client.id,
            company_name: client.company_name || "Cliente sem nome",
            contract_value: Number(client.contract_value) || 0,
            status: client.status || "inactive",
            first_payment_date: client.first_payment_date,
            payment_type: (client.payment_type || "pre") as "pre" | "post",
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
          clientes_example: processedClients.slice(0, 2)
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
    clients: clients || [], 
    isLoading, 
    handlePaymentUpdated 
  };
}
