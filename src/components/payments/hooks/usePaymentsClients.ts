
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { startOfMonth, endOfMonth, isWithinInterval, parseISO } from "date-fns";
import { ClientWithTotalPayments, Payment } from "../types";

export function usePaymentsClients() {
  const queryClient = useQueryClient();

  const { data: clients, isLoading } = useQuery({
    queryKey: ["payments-clients"],
    queryFn: async () => {
      // Primeiro, buscamos os clientes com seus pagamentos
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

      console.log("Dados brutos dos clientes:", clientsData);

      if (!clientsData) {
        console.warn("Nenhum cliente encontrado");
        return [];
      }

      // Processa os clientes e seus pagamentos
      const processedClients: ClientWithTotalPayments[] = clientsData.map(client => {
        // Garante que payments seja sempre um array
        const payments = Array.isArray(client.payments) ? client.payments : [];

        // Processa os pagamentos e calcula o total
        const processedPayments = payments.map(payment => ({
          id: payment.id,
          amount: typeof payment.amount === 'string' ? 
            parseFloat(payment.amount.replace(',', '.')) : 
            Number(payment.amount) || 0,
          reference_month: payment.reference_month,
          notes: payment.notes
        }));

        // Calcula o total recebido
        const total_received = processedPayments.reduce((sum, payment) => {
          const amount = Number(payment.amount) || 0;
          console.log(`Processando pagamento para ${client.company_name}:`, {
            payment_id: payment.id,
            amount: amount,
            sum_atual: sum,
            novo_total: sum + amount
          });
          return sum + amount;
        }, 0);

        // Verifica se tem pagamento no mês atual
        const currentMonthStart = startOfMonth(new Date());
        const currentMonthEnd = endOfMonth(new Date());
        const hasCurrentMonthPayment = processedPayments.some(payment => {
          try {
            const paymentDate = parseISO(payment.reference_month);
            return isWithinInterval(paymentDate, {
              start: currentMonthStart,
              end: currentMonthEnd
            });
          } catch (error) {
            console.error('Erro ao verificar pagamento do mês:', error);
            return false;
          }
        });

        console.log(`Processamento do cliente ${client.company_name} concluído:`, {
          total_pagamentos: processedPayments.length,
          valor_total: total_received,
          tem_pagamento_mes_atual: hasCurrentMonthPayment
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
          payments: processedPayments,
          hasCurrentMonthPayment
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
