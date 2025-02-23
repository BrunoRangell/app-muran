
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { startOfMonth, endOfMonth, isWithinInterval, parseISO } from "date-fns";
import { ClientWithTotalPayments, Payment } from "../types";

interface PaymentsByClient {
  [key: string]: Payment[];
}

export function usePaymentsClients() {
  const queryClient = useQueryClient();

  const { data: clients, isLoading } = useQuery({
    queryKey: ["payments-clients"],
    queryFn: async () => {
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

      if (!clientsData) {
        console.error("Nenhum cliente encontrado");
        return [];
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

      if (!paymentsData || !Array.isArray(paymentsData)) {
        console.error("Dados de pagamentos inválidos ou vazios");
        return clientsData.map(client => ({
          ...client,
          total_received: 0,
          payments: [],
          hasCurrentMonthPayment: false
        }));
      }

      const currentMonthStart = startOfMonth(new Date());
      const currentMonthEnd = endOfMonth(new Date());

      // Organiza pagamentos por cliente
      const paymentsByClient: PaymentsByClient = {};
      const totalsByClient: { [key: string]: number } = {};

      // Inicializa arrays vazios para cada cliente
      clientsData.forEach(client => {
        paymentsByClient[client.id] = [];
        totalsByClient[client.id] = 0;
      });

      // Processa os pagamentos
      paymentsData.forEach(payment => {
        if (!payment?.client_id || !payment?.amount) return;

        const amount = Number(payment.amount);
        
        if (isNaN(amount)) {
          console.error('Valor inválido detectado:', payment);
          return;
        }

        // Adiciona o pagamento ao array do cliente
        paymentsByClient[payment.client_id].push({
          id: payment.id,
          amount: amount,
          reference_month: payment.reference_month,
          notes: payment.notes
        });

        // Atualiza o total do cliente
        totalsByClient[payment.client_id] = 
          (totalsByClient[payment.client_id] || 0) + amount;
      });

      // Monta o objeto final com os dados dos clientes
      const clientsWithTotals: ClientWithTotalPayments[] = clientsData.map(client => {
        const clientPayments = paymentsByClient[client.id] || [];
        const total = totalsByClient[client.id] || 0;

        const hasCurrentMonthPayment = clientPayments.some(payment => {
          try {
            const paymentDate = parseISO(payment.reference_month);
            return isWithinInterval(paymentDate, { 
              start: currentMonthStart, 
              end: currentMonthEnd 
            });
          } catch (error) {
            console.error('Erro ao processar data:', error);
            return false;
          }
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
    staleTime: 1000, // Dados considerados frescos por 1 segundo
    gcTime: 5 * 60 * 1000, // Cache mantido por 5 minutos (anteriormente cacheTime)
    refetchOnWindowFocus: true, // Recarrega ao focar a janela
  });

  const handlePaymentUpdated = () => {
    queryClient.invalidateQueries({ queryKey: ["payments-clients"] });
  };

  return { clients, isLoading, handlePaymentUpdated };
}
