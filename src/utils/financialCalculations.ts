import { differenceInMonths, parseISO } from "date-fns";
import { Client } from "@/components/clients/types";

export const calculateFinancialMetrics = (clients: Client[]) => {
  const today = new Date();
  const activeClients = clients.filter(client => client.status === "active");
  
  // Total de clientes
  const totalClients = clients.length;
  const activeClientsCount = activeClients.length;

  // MRR e ARR
  const mrr = activeClients.reduce((sum, client) => sum + (client.contract_value || 0), 0);
  const arr = mrr * 12;

  // Retenção Média (em meses)
  const retentionPeriods = clients.map(client => {
    const startDate = parseISO(client.first_payment_date);
    const endDate = client.status === "active" 
      ? today 
      : (client.last_payment_date ? parseISO(client.last_payment_date) : today);
    return Math.max(differenceInMonths(endDate, startDate), 1);
  });

  const averageRetention = retentionPeriods.reduce((sum, months) => sum + months, 0) / totalClients;

  // Churn Rate (mensal)
  const churned = clients.filter(client => 
    client.status === "inactive" && 
    client.last_payment_date && 
    differenceInMonths(today, parseISO(client.last_payment_date)) <= 1
  ).length;

  const churnRate = totalClients > 0 
    ? (churned / totalClients) * 100 
    : 0;

  // LTV (Lifetime Value) - usando valor do contrato * retenção média
  const ltv = mrr * averageRetention;

  console.log("Financial metrics calculated:", {
    mrr,
    arr,
    averageRetention,
    churnRate,
    ltv,
    activeClientsCount,
    totalClients
  });

  return {
    mrr,
    arr,
    averageRetention,
    churnRate,
    ltv,
    activeClientsCount,
    totalClients
  };
};