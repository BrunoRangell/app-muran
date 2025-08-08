
import { differenceInMonths, parseISO, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { Client } from "@/components/clients/types";
import { supabase } from "@/integrations/supabase/client";
import { calculateCurrentMRR } from "./paymentCalculations";
import { isClientNewInMonth } from "@/components/clients/metrics/utils/dateFilters";

export const calculateFinancialMetrics = async (clients: Client[]) => {
  const today = new Date();
  const threeMonthsAgo = subMonths(today, 3);
  const activeClients = clients.filter(client => client.status === "active");
  
  // Total de clientes
  const totalClients = clients.length;
  const activeClientsCount = activeClients.length;

  // Receita Mensal Prevista baseada em contract_value dos clientes ativos
  const mrr = activeClients.reduce((sum, client) => sum + Number(client.contract_value), 0);
  const arr = mrr * 12;

  // Novos clientes este mês
  const currentMonthStart = startOfMonth(today);
  const currentMonthEnd = endOfMonth(today);
  const newClientsThisMonth = clients.filter(client => 
    isClientNewInMonth(client, currentMonthStart, currentMonthEnd)
  ).length;

  // Calcular MRR do mês anterior para crescimento
  const lastMonthStart = startOfMonth(subMonths(today, 1));
  const lastMonthEnd = endOfMonth(subMonths(today, 1));
  const lastMonthActiveClients = clients.filter(client => {
    const firstPayment = parseISO(client.first_payment_date);
    const lastPayment = client.last_payment_date ? parseISO(client.last_payment_date) : null;
    return firstPayment <= lastMonthEnd && (!lastPayment || lastPayment >= lastMonthStart);
  });
  const lastMonthMRR = lastMonthActiveClients.reduce((sum, client) => sum + Number(client.contract_value), 0);
  
  // Crescimento MRR
  const mrrGrowthRate = lastMonthMRR > 0 ? ((mrr - lastMonthMRR) / lastMonthMRR) * 100 : 0;

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

  // LTV (Lifetime Value) - usando ticket médio * retenção média
  const ltv = averageTicket * averageRetention;
  
  // CAC fixo por enquanto
  const cac = 1250;
  
  // LTV:CAC Ratio
  const ltvCacRatio = cac > 0 ? ltv / cac : 0;
  
  // Score de Saúde (0-100) baseado em múltiplos fatores
  let healthScore = 50; // Base
  
  // LTV:CAC ratio (peso: 30 pontos)
  if (ltvCacRatio >= 3) healthScore += 30;
  else if (ltvCacRatio >= 2) healthScore += 20;
  else if (ltvCacRatio >= 1) healthScore += 10;
  
  // Churn rate (peso: 25 pontos)
  if (churnRate <= 5) healthScore += 25;
  else if (churnRate <= 10) healthScore += 15;
  else if (churnRate <= 15) healthScore += 5;
  else healthScore -= 10;
  
  // Crescimento MRR (peso: 20 pontos)
  if (mrrGrowthRate >= 15) healthScore += 20;
  else if (mrrGrowthRate >= 10) healthScore += 15;
  else if (mrrGrowthRate >= 5) healthScore += 10;
  else if (mrrGrowthRate >= 0) healthScore += 5;
  else healthScore -= 10;
  
  // Retenção média (peso: 15 pontos)
  if (averageRetention >= 24) healthScore += 15;
  else if (averageRetention >= 12) healthScore += 10;
  else if (averageRetention >= 6) healthScore += 5;
  
  // Limitar entre 0 e 100
  healthScore = Math.max(0, Math.min(100, healthScore));

  // Buscar total de custos
  const { data: costs } = await supabase
    .from("costs")
    .select("amount");

  const totalCosts = (costs || []).reduce((acc, cost) => acc + Number(cost.amount), 0);

  console.log("Financial metrics calculated:", {
    mrr: `R$ ${mrr.toLocaleString('pt-BR')} (Receita Mensal Prevista)`,
    arr: `R$ ${arr.toLocaleString('pt-BR')}`,
    averageRetention,
    churnRate,
    ltv,
    activeClientsCount,
    totalClients,
    churned,
    activeClientsThreeMonthsAgo,
    averageTicket,
    totalCosts,
    newClientsThisMonth,
    mrrGrowthRate,
    ltvCacRatio,
    healthScore,
    cac
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
    totalCosts,
    newClientsThisMonth,
    mrrGrowthRate,
    ltvCacRatio,
    healthScore,
    cac
  };
};
