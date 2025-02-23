
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
      console.log("Iniciando busca de clientes e pagamentos");
      
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

      console.log("Clientes encontrados:", clientsData.length);

      // Busca pagamentos
      const { data: paymentsData, error: paymentsError } = await supabase
        .from("payments")
        .select("*")
        .order('reference_month', { ascending: false });

      if (paymentsError) {
        console.error("Erro ao buscar pagamentos:", paymentsError);
        throw paymentsError;
      }

      console.log("Pagamentos encontrados:", paymentsData?.length || 0);

      // Se não houver pagamentos, retorna clientes com totais zerados
      if (!paymentsData || !Array.isArray(paymentsData)) {
        return clientsData.map(client => ({
          ...client,
          total_received: 0,
          payments: [],
          hasCurrentMonthPayment: false
        }));
      }

      const currentMonthStart = startOfMonth(new Date());
      const currentMonthEnd = endOfMonth(new Date());

      // Inicializa os maps para armazenar pagamentos e totais
      const paymentsByClient: PaymentsByClient = {};
      const totalsByClient: { [key: string]: number } = {};

      // Inicializa arrays e totais para cada cliente
      clientsData.forEach(client => {
        paymentsByClient[client.id] = [];
        totalsByClient[client.id] = 0;
      });

      // Processa cada pagamento
      paymentsData.forEach(payment => {
        // Verifica se o pagamento tem cliente_id e amount válidos
        if (!payment?.client_id || payment?.amount == null) {
          console.warn('Pagamento inválido encontrado:', payment);
          return;
        }

        // Converte o valor para número e valida
        const amount = Number(payment.amount);
        if (isNaN(amount)) {
          console.error('Valor de pagamento inválido:', payment);
          return;
        }

        // Adiciona o pagamento ao array do cliente
        if (paymentsByClient[payment.client_id]) {
          paymentsByClient[payment.client_id].push({
            id: payment.id,
            amount: amount,
            reference_month: payment.reference_month,
            notes: payment.notes
          });

          // Atualiza o total do cliente
          totalsByClient[payment.client_id] = 
            (totalsByClient[payment.client_id] || 0) + amount;
        }
      });

      // Monta o objeto final com os dados dos clientes
      const clientsWithTotals: ClientWithTotalPayments[] = clientsData.map(client => {
        const clientPayments = paymentsByClient[client.id] || [];
        const total = totalsByClient[client.id] || 0;

        // Verifica se há pagamento no mês atual
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

      console.log("Processamento finalizado. Exemplo do primeiro cliente:", 
        clientsWithTotals[0] ? {
          id: clientsWithTotals[0].id,
          company_name: clientsWithTotals[0].company_name,
          total_received: clientsWithTotals[0].total_received,
          payments_count: clientsWithTotals[0].payments.length
        } : "Nenhum cliente encontrado"
      );

      return clientsWithTotals;
    },
    staleTime: 1000, // Dados considerados frescos por 1 segundo
    gcTime: 5 * 60 * 1000, // Cache mantido por 5 minutos
    refetchOnWindowFocus: true, // Recarrega ao focar a janela
  });

  const handlePaymentUpdated = () => {
    queryClient.invalidateQueries({ queryKey: ["payments-clients"] });
  };

  return { clients, isLoading, handlePaymentUpdated };
}
