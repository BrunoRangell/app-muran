import { subMonths, parseISO } from "date-fns";
import { Client } from "@/components/clients/types";
import { supabase } from "@/integrations/supabase/client";

// Função para calcular LTV móvel de 12 meses para gráfico de barras
export const calculateMovingLTV12Months = async (clients: Client[], targetMonth: Date) => {
  // Calcular período de 12 meses: (M-11) até M
  const endOfPeriod = new Date(targetMonth.getFullYear(), targetMonth.getMonth() + 1, 0); // Último dia do mês
  const startOfPeriod = new Date(targetMonth.getFullYear() - 1, targetMonth.getMonth(), 1); // Primeiro dia do mês 12 meses atrás
  
  console.log(`Calculating moving LTV for ${targetMonth.toISOString()}: ${startOfPeriod.toISOString()} to ${endOfPeriod.toISOString()}`);
  
  // Buscar payments no período de 12 meses
  const { data: paymentsData, error } = await supabase
    .from("payments")
    .select("client_id, amount")
    .gte("reference_month", startOfPeriod.toISOString().split('T')[0])
    .lte("reference_month", endOfPeriod.toISOString().split('T')[0]);

  if (error) {
    console.error("Erro ao buscar payments para LTV móvel:", error);
    return 0;
  }

  // Agrupar payments por cliente no período
  const paymentsByClient: Record<string, number> = {};
  (paymentsData || []).forEach(payment => {
    const clientId = payment.client_id;
    if (clientId) {
      paymentsByClient[clientId] = (paymentsByClient[clientId] || 0) + Number(payment.amount);
    }
  });

  // Filtrar clientes que estiveram ativos no período de 12 meses
  const activeClientsInPeriod = clients.filter(client => {
    const firstPayment = parseISO(client.first_payment_date);
    const lastPayment = client.last_payment_date ? parseISO(client.last_payment_date) : new Date();
    
    // Cliente esteve ativo se:
    // - Primeiro pagamento foi antes ou durante o período E
    // - Último pagamento foi dentro do período (ou ainda está ativo)
    return firstPayment <= endOfPeriod && lastPayment >= startOfPeriod;
  });

  // Calcular soma total de payments e contar apenas clientes que fizeram pagamentos no período
  let totalPayments = 0;
  let clientsWithPayments = 0;

  activeClientsInPeriod.forEach(client => {
    const clientPayments = paymentsByClient[client.id] || 0;
    if (clientPayments > 0) {
      totalPayments += clientPayments;
      clientsWithPayments++;
    }
  });

  console.log(`Moving LTV calculation:`, {
    period: `${startOfPeriod.toISOString().split('T')[0]} to ${endOfPeriod.toISOString().split('T')[0]}`,
    totalPayments,
    clientsWithPayments,
    ltv: clientsWithPayments > 0 ? totalPayments / clientsWithPayments : 0
  });

  // LTV = Soma dos pagamentos no período / Quantidade de clientes que pagaram no período
  return clientsWithPayments > 0 ? totalPayments / clientsWithPayments : 0;
};