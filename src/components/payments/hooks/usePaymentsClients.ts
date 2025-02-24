
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { startOfMonth, endOfMonth, isWithinInterval, parseISO } from "date-fns";
import { ClientWithTotalPayments } from "../types";

// Função auxiliar para calcular o total recebido
const calculateTotalReceived = (payments: any[]) => {
  return payments.reduce((sum, payment) => {
    const amount = Number(payment.amount);
    if (isNaN(amount)) {
      console.warn(`Valor inválido encontrado para o pagamento:`, payment);
      return sum;
    }
    return sum + amount;
  }, 0);
};

// Função auxiliar para verificar pagamento no mês atual
const hasPaymentInCurrentMonth = (payments: any[]) => {
  const currentMonthStart = startOfMonth(new Date());
  const currentMonthEnd = endOfMonth(new Date());

  return payments.some(payment => {
    const paymentDate = parseISO(payment.reference_month);
    return isWithinInterval(paymentDate, {
      start: currentMonthStart,
      end: currentMonthEnd
    });
  });
};

// Função auxiliar para processar os pagamentos
const processPayments = (payments: any[]) => {
  return payments.map(p => ({
    id: p.id,
    amount: Number(p.amount),
    reference_month: p.reference_month,
    notes: p.notes
  }));
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
        const total_received = calculateTotalReceived(payments);

        // Log para ajudar no debug
        console.log(`Cliente ${client.company_name}:`, {
          payments_total: payments.length,
          total_received,
          raw_payments: payments
        });

        return {
          id: client.id,
          company_name: client.company_name,
          contract_value: client.contract_value,
          status: client.status,
          first_payment_date: client.first_payment_date,
          payment_type: client.payment_type as "pre" | "post",
          acquisition_channel: client.acquisition_channel,
          company_birthday: client.company_birthday,
          contact_name: client.contact_name,
          contact_phone: client.contact_phone,
          last_payment_date: client.last_payment_date,
          total_received,
          payments: processPayments(payments),
          hasCurrentMonthPayment: hasPaymentInCurrentMonth(payments)
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
