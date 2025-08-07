
import { differenceInMonths, parseISO, subMonths } from "date-fns";
import { Client } from "@/components/clients/types";
import { supabase } from "@/integrations/supabase/client";
import { calculateCurrentMRR } from "./paymentCalculations";

export const calculateFinancialMetrics = async (clients: Client[]) => {
  const today = new Date();
  const threeMonthsAgo = subMonths(today, 3);
  const activeClients = clients.filter(client => client.status === "active");
  
  // Total de clientes
  const totalClients = clients.length;
  const activeClientsCount = activeClients.length;

  // MRR e ARR baseados em pagamentos reais
  const mrr = await calculateCurrentMRR();
  const arr = mrr * 12;

  // Ticket Médio
  const averageTicket = activeClientsCount > 0 ? mrr / activeClientsCount : 0;

  // Retenção Média (em meses)
  const retentionPeriods = clients.map(client => {
    const startDate = parseISO(client.first_payment_date);
    const endDate = client.status === "active" 
      ? today 
      : (client.last_payment_date ? parseISO(client.last_payment_date) : today);
    return Math.max(differenceInMonths(endDate, startDate), 1);
  });

  const averageRetention = retentionPeriods.reduce((sum, months) => sum + months, 0) / totalClients;

  // Churn Rate (últimos 3 meses)
  const churned = clients.filter(client => 
    client.status === "inactive" && 
    client.last_payment_date && 
    parseISO(client.last_payment_date) >= threeMonthsAgo
  ).length;

  const activeClientsThreeMonthsAgo = clients.filter(client => 
    client.first_payment_date && 
    parseISO(client.first_payment_date) <= threeMonthsAgo &&
    (!client.last_payment_date || parseISO(client.last_payment_date) > threeMonthsAgo)
  ).length;

  const churnRate = activeClientsThreeMonthsAgo > 0 
    ? (churned / activeClientsThreeMonthsAgo) * 100 
    : 0;

  // LTV (Lifetime Value) - usando valor do contrato * retenção média
  const ltv = mrr * averageRetention;

  // Buscar total de custos
  const { data: costs } = await supabase
    .from("costs")
    .select("amount");

  const totalCosts = (costs || []).reduce((acc, cost) => acc + Number(cost.amount), 0);

  console.log("Financial metrics calculated:", {
    mrr,
    arr,
    averageRetention,
    churnRate,
    ltv,
    activeClientsCount,
    totalClients,
    churned,
    activeClientsThreeMonthsAgo,
    averageTicket,
    totalCosts
  });

  return {
    mrr,
    arr,
    averageRetention,
    churnRate,
    ltv,
    activeClientsCount,
    totalClients,
    averageTicket,
    totalCosts
  };
};
