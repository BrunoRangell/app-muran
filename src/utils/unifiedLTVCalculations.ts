import { parseISO } from "date-fns";
import { Client } from "@/components/clients/types";
import { supabase } from "@/integrations/supabase/client";

/**
 * Normaliza a data removendo horas/minutos/segundos para garantir consistência
 */
const normalizeDate = (date: Date): Date => {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
};

/**
 * Função unificada para calcular LTV de 12 meses
 * Usa o mesmo período e critérios para painel e gráfico de barras
 * 
 * @param clients - Array de clientes
 * @param targetMonth - Mês de referência (último mês do período de 12 meses)
 * @returns LTV calculado para o período
 */
export const calculateLTV12MonthsPeriod = async (clients: Client[], targetMonth: Date) => {
  // Normalizar a data de referência
  const normalizedTargetMonth = normalizeDate(targetMonth);
  
  // Calcular período EXATO de 12 meses: (M-11) até M
  const endOfPeriod = new Date(normalizedTargetMonth.getFullYear(), normalizedTargetMonth.getMonth() + 1, 0); // Último dia do mês
  const startOfPeriod = new Date(normalizedTargetMonth.getFullYear(), normalizedTargetMonth.getMonth() - 11, 1); // Primeiro dia 11 meses atrás (12 meses total)
  
  const startDateStr = startOfPeriod.toISOString().split('T')[0];
  const endDateStr = endOfPeriod.toISOString().split('T')[0];
  
  console.log(`[Unified LTV] === CÁLCULO LTV UNIFICADO ===`);
  console.log(`[Unified LTV] Target Month: ${normalizedTargetMonth.toISOString().split('T')[0]}`);
  console.log(`[Unified LTV] Period: ${startDateStr} to ${endDateStr}`);
  console.log(`[Unified LTV] Total clients input: ${clients.length}`);
  
  // Buscar payments no período de 12 meses
  const { data: paymentsData, error } = await supabase
    .from("payments")
    .select("client_id, amount, reference_month")
    .gte("reference_month", startDateStr)
    .lte("reference_month", endDateStr);

  if (error) {
    console.error("Erro ao buscar payments para LTV unificado:", error);
    return 0;
  }

  console.log(`[Unified LTV] Payments found: ${paymentsData?.length || 0}`);

  // Agrupar payments por cliente no período
  const paymentsByClient: Record<string, number> = {};
  (paymentsData || []).forEach(payment => {
    const clientId = payment.client_id;
    if (clientId && Number(payment.amount) > 0) {
      paymentsByClient[clientId] = (paymentsByClient[clientId] || 0) + Number(payment.amount);
    }
  });

  console.log(`[Unified LTV] Clients with payments > 0: ${Object.keys(paymentsByClient).length}`);

  // Filtrar clientes que estiveram ativos no período de 12 meses
  const activeClientsInPeriod = clients.filter(client => {
    const firstPayment = parseISO(client.first_payment_date);
    const lastPayment = client.last_payment_date ? parseISO(client.last_payment_date) : new Date();
    
    // Cliente esteve ativo se:
    // - Primeiro pagamento foi antes ou durante o período E
    // - Último pagamento foi dentro do período (ou ainda está ativo)
    return firstPayment <= endOfPeriod && lastPayment >= startOfPeriod;
  });

  console.log(`[Unified LTV] Active clients in period: ${activeClientsInPeriod.length}`);

  // Calcular soma total de payments e contar apenas clientes que fizeram pagamentos > 0 no período
  let totalPayments = 0;
  let clientsWithPositivePayments = 0;

  activeClientsInPeriod.forEach(client => {
    const clientPayments = paymentsByClient[client.id] || 0;
    if (clientPayments > 0) {
      totalPayments += clientPayments;
      clientsWithPositivePayments++;
    }
  });

  const ltv = clientsWithPositivePayments > 0 ? totalPayments / clientsWithPositivePayments : 0;

  console.log(`[Unified LTV] FINAL RESULTS:`, {
    period: `${startDateStr} to ${endDateStr}`,
    totalPayments: totalPayments.toFixed(2),
    clientsWithPositivePayments,
    activeClientsInPeriod: activeClientsInPeriod.length,
    ltv: ltv.toFixed(2)
  });
  console.log(`[Unified LTV] === FIM CÁLCULO ===`);

  // LTV = Soma dos pagamentos > 0 no período / Quantidade de clientes que pagaram > 0 no período
  return ltv;
};

/**
 * Função para o painel - usa o mês atual como referência
 */
export const calculateLTVForDashboard = async (clients: Client[]) => {
  const today = new Date();
  const ltv = await calculateLTV12MonthsPeriod(clients, today);
  
  console.log(`[Dashboard LTV] Current month LTV: ${ltv}`);
  
  return { averageLTV: ltv, individualLTVs: {} };
};

/**
 * Função para o gráfico de barras - usa o mês específico como referência
 */
export const calculateLTVForChart = async (clients: Client[], targetMonth: Date) => {
  const ltv = await calculateLTV12MonthsPeriod(clients, targetMonth);
  
  console.log(`[Chart LTV] Month ${targetMonth.toISOString()} LTV: ${ltv}`);
  
  return ltv;
};