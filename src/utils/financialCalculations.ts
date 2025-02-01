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
    const endDate = client.status === "active" ? today : parseISO(client.first_payment_date);
    return Math.max(differenceInMonths(endDate, startDate), 1);
  });

  const averageRetention = retentionPeriods.reduce((sum, months) => sum + months, 0) / totalClients;

  // Churn Rate (mensal)
  const inactiveClientsLastMonth = clients.filter(
    client => client.status === "inactive"
  ).length;

  const churnRate = totalClients > 0 
    ? (inactiveClientsLastMonth / totalClients) * 100 
    : 0;

  // LTV (Lifetime Value) - usando margem bruta padrão de 70%
  const grossMargin = 0.7; // 70% de margem bruta
  const ltv = mrr * grossMargin * averageRetention;

  // Payback Time (em meses) - assumindo CAC médio de R$ 1000
  const averageCac = 1000; // Custo de aquisição médio
  const paybackTime = averageCac / (mrr * grossMargin / activeClientsCount);

  console.log("Financial metrics calculated:", {
    mrr,
    arr,
    averageRetention,
    churnRate,
    ltv,
    paybackTime,
    activeClientsCount,
    totalClients
  });

  return {
    mrr,
    arr,
    averageRetention,
    churnRate,
    ltv,
    paybackTime,
    activeClientsCount,
    totalClients
  };
};