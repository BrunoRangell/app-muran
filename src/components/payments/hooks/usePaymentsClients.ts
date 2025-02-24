
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { startOfMonth, endOfMonth, isWithinInterval, parseISO } from "date-fns";
import { ClientWithTotalPayments, Payment } from "../types";

// Função auxiliar para calcular o total recebido com validação rigorosa
const calculateTotalReceived = (payments: Payment[]) => {
  if (!Array.isArray(payments)) {
    console.warn('Payments não é um array:', payments);
    return 0;
  }

  const total = payments.reduce((sum, payment) => {
    // Garantimos que amount seja sempre um número
    const amount = typeof payment.amount === 'string' 
      ? parseFloat(payment.amount) 
      : Number(payment.amount);

    if (isNaN(amount)) {
      console.warn('Valor inválido encontrado:', {
        payment,
        amount: payment.amount,
        parsed: amount
      });
      return sum;
    }

    console.log('Somando pagamento:', {
      original: payment.amount,
      parsed: amount,
      running_total: sum + amount
    });

    return sum + amount;
  }, 0);

  console.log('Total calculado:', total);
  return total;
};

// Função auxiliar para verificar pagamento no mês atual
const hasPaymentInCurrentMonth = (payments: Payment[]) => {
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

// Função auxiliar para processar os pagamentos com validação rigorosa
const processPayments = (payments: any[]): Payment[] => {
  if (!Array.isArray(payments)) {
    console.warn('Payments não é um array:', payments);
    return [];
  }

  return payments.map(p => {
    const amount = typeof p.amount === 'string' 
      ? parseFloat(p.amount) 
      : Number(p.amount);

    if (isNaN(amount)) {
      console.warn('Valor inválido encontrado ao processar pagamento:', p);
    }

    return {
      id: p.id,
      amount: amount,
      reference_month: p.reference_month,
      notes: p.notes
    };
  });
};

export function usePaymentsClients() {
  const queryClient = useQueryClient();

  const { data: clients, isLoading } = useQuery({
    queryKey: ["payments-clients"],
    queryFn: async () => {
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
          last_payment_date,
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

      // Processa cada cliente
      const processedClients: ClientWithTotalPayments[] = clientsData.map(client => {
        const payments = client.payments || [];

        // Log detalhado dos dados brutos
        console.log(`Processando cliente ${client.company_name}:`, {
          raw_payments: payments,
          payment_count: payments.length
        });

        // Processa os pagamentos com validação
        const processedPayments = processPayments(payments);
        const total_received = calculateTotalReceived(processedPayments);

        // Log do resultado do processamento
        console.log(`Resultado do processamento para ${client.company_name}:`, {
          processed_payments: processedPayments,
          total_received
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
          payments: processedPayments,
          hasCurrentMonthPayment: hasPaymentInCurrentMonth(processedPayments)
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
