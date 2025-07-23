
import { differenceInMonths, parseISO, subMonths } from "date-fns";
import { Client } from "@/components/clients/types";

export const calculateFinancialMetrics = (clients: Client[], costs: any[] = []) => {
  const today = new Date();
  const threeMonthsAgo = subMonths(today, 3);
  const activeClients = clients.filter(client => client.status === "active");
  
  // Total de clientes
  const totalClients = clients.length;
  const activeClientsCount = activeClients.length;

  // MRR e ARR
  const mrr = activeClients.reduce((sum, client) => sum + (client.contract_value || 0), 0);
  const arr = mrr * 12;

  // Ticket Médio
  const averageTicket = activeClientsCount > 0 ? mrr / activeClientsCount : 0;

  // Retenção Média (em meses)
  const retentionPeriods = clients.map(client => {
    if (!client.first_payment_date) return 1;
    const startDate = parseISO(client.first_payment_date);
    const endDate = client.status === "active" 
      ? today 
      : (client.last_payment_date ? parseISO(client.last_payment_date) : today);
    return Math.max(differenceInMonths(endDate, startDate), 1);
  });

  const averageRetention = retentionPeriods.reduce((sum, months) => sum + months, 0) / Math.max(totalClients, 1);

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

  // Total de custos (recebido como parâmetro)
  const totalCosts = costs.reduce((acc, cost) => acc + Number(cost.amount), 0);

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
