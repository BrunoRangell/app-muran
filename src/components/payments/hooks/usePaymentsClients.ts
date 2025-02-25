
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { startOfMonth, endOfMonth, isWithinInterval, parseISO } from "date-fns";
import { ClientWithTotalPayments, Payment } from "../types";

export function usePaymentsClients() {
  const queryClient = useQueryClient();

  const { data: clients, isLoading } = useQuery({
    queryKey: ["payments-clients"],
    queryFn: async () => {
      console.log("Iniciando busca de clientes e pagamentos...");

      // Primeiro, vamos fazer uma query separada para ver os pagamentos brutos
      const { data: rawPayments, error: paymentsError } = await supabase
        .from("payments")
        .select("*");

      console.log("Pagamentos brutos do banco:", rawPayments);

      // Agora buscamos os clientes com seus pagamentos
      const { data: clientsData, error: clientsError } = await supabase
        .from("clients")
        .select(`
          *,
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

      console.log("Dados brutos dos clientes:", JSON.stringify(clientsData, null, 2));

      if (!clientsData) {
        console.warn("Nenhum cliente encontrado");
        return [];
      }

      // Processa os clientes e seus pagamentos
      const processedClients: ClientWithTotalPayments[] = clientsData.map(client => {
        // Debug do cliente atual
        console.log(`\n==== Processando cliente: ${client.company_name} ====`);
        console.log("Dados brutos do cliente:", client);

        // Garante que payments seja sempre um array
        const payments = Array.isArray(client.payments) ? client.payments : [];
        console.log(`Pagamentos encontrados: ${payments.length}`);

        // Processa os pagamentos e calcula o total
        const processedPayments = payments.map(payment => {
          console.log("\nProcessando pagamento:", payment);
          
          let amount: number;
          if (typeof payment.amount === 'string') {
            amount = parseFloat(payment.amount.replace(',', '.'));
          } else {
            amount = Number(payment.amount);
          }

          console.log("Valor processado:", {
            original: payment.amount,
            processado: amount,
            tipo_original: typeof payment.amount
          });

          return {
            id: payment.id,
            amount: amount || 0,
            reference_month: payment.reference_month,
            notes: payment.notes
          };
        });

        // Calcula o total recebido
        const total_received = processedPayments.reduce((sum, payment) => {
          const currentSum = sum + (payment.amount || 0);
          console.log(`Somando pagamento:`, {
            pagamento_atual: payment.amount,
            soma_anterior: sum,
            nova_soma: currentSum
          });
          return currentSum;
        }, 0);

        console.log(`\nResumo do cliente ${client.company_name}:`, {
          total_pagamentos: processedPayments.length,
          valor_total_calculado: total_received,
          pagamentos_processados: processedPayments.map(p => p.amount)
        });

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

      console.log("\n==== Resumo final do processamento ====");
      console.log("Total de clientes processados:", processedClients.length);
      console.log("Clientes e seus totais:", processedClients.map(c => ({
        cliente: c.company_name,
        total: c.total_received,
        num_pagamentos: c.payments.length
      })));

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
