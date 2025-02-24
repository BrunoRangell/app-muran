
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { startOfMonth, endOfMonth, isWithinInterval, parseISO } from "date-fns";
import { ClientWithTotalPayments, Payment } from "../types";

// Função auxiliar para calcular o total recebido
const calculateTotalReceived = (payments: any[]) => {
  if (!Array.isArray(payments)) {
    console.warn('Payments inválido:', payments);
    return 0;
  }

  const total = payments.reduce((sum, payment) => {
    // Garante que o valor seja um número válido
    let amount = 0;
    
    if (typeof payment.amount === 'string') {
      amount = parseFloat(payment.amount.replace(',', '.'));
    } else if (typeof payment.amount === 'number') {
      amount = payment.amount;
    }

    // Log detalhado do processamento do valor
    console.log('Processando valor:', {
      original: payment.amount,
      tipo: typeof payment.amount,
      convertido: amount,
      soma_atual: sum
    });

    if (isNaN(amount)) {
      console.warn('Valor inválido encontrado:', payment);
      return sum;
    }

    return sum + amount;
  }, 0);

  // Log do total calculado
  console.log('Total calculado:', total);
  return total;
};

// Função auxiliar para verificar pagamento no mês atual
const hasPaymentInCurrentMonth = (payments: any[]) => {
  if (!Array.isArray(payments)) return false;
  
  const currentMonthStart = startOfMonth(new Date());
  const currentMonthEnd = endOfMonth(new Date());

  return payments.some(payment => {
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
};

export function usePaymentsClients() {
  const queryClient = useQueryClient();

  const { data: clients, isLoading } = useQuery({
    queryKey: ["payments-clients"],
    queryFn: async () => {
      console.log('Iniciando busca de clientes...');
      
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

      // Log dos dados brutos recebidos
      console.log('Dados brutos recebidos:', clientsData);

      // Processa cada cliente
      const processedClients: ClientWithTotalPayments[] = clientsData.map(client => {
        // Garante que payments seja um array
        const payments = Array.isArray(client.payments) ? client.payments : [];
        
        // Log detalhado do cliente e seus pagamentos
        console.log(`Processando cliente ${client.company_name}:`, {
          id: client.id,
          payments_count: payments.length,
          raw_payments: payments
        });

        // Calcula o total recebido
        const total_received = calculateTotalReceived(payments);

        // Log do resultado do processamento
        console.log(`Resultado do processamento para ${client.company_name}:`, {
          total_received,
          payments_count: payments.length
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
          payments: payments.map(p => ({
            id: p.id,
            amount: Number(p.amount) || 0,
            reference_month: p.reference_month,
            notes: p.notes
          })),
          hasCurrentMonthPayment: hasPaymentInCurrentMonth(payments)
        };
      });

      // Log final dos clientes processados
      console.log('Clientes processados:', processedClients);

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
