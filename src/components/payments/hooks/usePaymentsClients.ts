
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { startOfMonth, endOfMonth, isWithinInterval, parseISO } from "date-fns";
import { ClientWithTotalPayments, Payment } from "../types";

// Função auxiliar para processar pagamento individual
const processPayment = (payment: any): Payment => {
  const amount = typeof payment.amount === 'string' 
    ? Number(payment.amount.replace(',', '.'))
    : Number(payment.amount);

  console.log('Processando pagamento:', {
    id: payment.id,
    valor_original: payment.amount,
    valor_processado: amount
  });

  return {
    id: payment.id,
    amount: isNaN(amount) ? 0 : amount,
    reference_month: payment.reference_month,
    notes: payment.notes
  };
};

// Função auxiliar para calcular o total recebido
const calculateTotalReceived = (payments: Payment[]): number => {
  const total = payments.reduce((sum, payment) => sum + payment.amount, 0);
  
  console.log('Total calculado:', {
    numero_pagamentos: payments.length,
    pagamentos: payments,
    total: total
  });
  
  return total;
};

// Função auxiliar para verificar pagamento no mês atual
const hasPaymentInCurrentMonth = (payments: Payment[]): boolean => {
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
          payments!inner (
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

      if (!clientsData || !Array.isArray(clientsData)) {
        console.warn("Nenhum cliente encontrado ou formato inválido");
        return [];
      }

      const processedClients: ClientWithTotalPayments[] = clientsData.map(client => {
        // Garante que payments seja sempre um array
        const rawPayments = Array.isArray(client.payments) ? client.payments : [];
        
        // Processa cada pagamento individualmente
        const processedPayments = rawPayments.map(processPayment);
        
        // Calcula o total recebido
        const totalReceived = calculateTotalReceived(processedPayments);

        console.log(`Cliente ${client.company_name}:`, {
          pagamentos_processados: processedPayments,
          total_recebido: totalReceived
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
          total_received: totalReceived,
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
