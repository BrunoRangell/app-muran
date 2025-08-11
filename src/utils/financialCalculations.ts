import { differenceInMonths, parseISO, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { Client } from "@/components/clients/types";
import { supabase } from "@/integrations/supabase/client";
import { isClientNewInMonth } from "@/components/clients/metrics/utils/dateFilters";
import { calculateCAC, calculatePreviousMonthMetrics, calculateTrend } from './trendsCalculations';
import { calculateLTVForDashboard } from './unifiedLTVCalculations';

// Função atualizada para usar o cálculo unificado de LTV
export const calculateLTV12Months = async (clients: Client[]) => {
  return await calculateLTVForDashboard(clients);
};

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

  // Calcular crescimento da receita baseado em payments
  const lastMonthStart = startOfMonth(subMonths(today, 1));
  const lastMonthEnd = endOfMonth(subMonths(today, 1));
  
  // Buscar payments do mês atual
  const { data: currentMonthPayments } = await supabase
    .from("payments")
    .select("amount")
    .gte("reference_month", currentMonthStart.toISOString().split('T')[0])
    .lte("reference_month", currentMonthEnd.toISOString().split('T')[0]);
  
  // Buscar payments do mês anterior
  const { data: lastMonthPayments } = await supabase
    .from("payments")
    .select("amount")
    .gte("reference_month", lastMonthStart.toISOString().split('T')[0])
    .lte("reference_month", lastMonthEnd.toISOString().split('T')[0]);
  
  const currentMonthRevenue = (currentMonthPayments || []).reduce((sum, payment) => sum + Number(payment.amount), 0);
  const lastMonthRevenue = (lastMonthPayments || []).reduce((sum, payment) => sum + Number(payment.amount), 0);
  
  // Crescimento da receita
  const mrrGrowthRate = lastMonthRevenue > 0 ? ((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 : 0;

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

  // Churn Rate (apenas mês atual)
  const churnedThisMonth = clients.filter(client => 
    client.status === "inactive" && 
    client.last_payment_date && 
    parseISO(client.last_payment_date) >= currentMonthStart &&
    parseISO(client.last_payment_date) <= currentMonthEnd
  ).length;

  const activeClientsThisMonth = clients.filter(client => {
    const firstPayment = parseISO(client.first_payment_date);
    const lastPayment = client.last_payment_date ? parseISO(client.last_payment_date) : null;
    return firstPayment <= currentMonthEnd && (!lastPayment || lastPayment >= currentMonthStart);
  }).length;

  const churnRate = activeClientsThisMonth > 0 
    ? (churnedThisMonth / activeClientsThisMonth) * 100 
    : 0;

  // LTV baseado em payments dos últimos 12 meses
  const { averageLTV: ltv } = await calculateLTV12Months(clients);
  
  // CAC baseado em custos de marketing e vendas
  const cac = await calculateCAC(clients, today);
  
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

  // Calculate month-over-month trends
  const previousDate = subMonths(today, 1);
  const previousMetrics = await calculatePreviousMonthMetrics(clients, previousDate);

  console.log("Financial metrics calculated:", {
    mrr: `R$ ${mrr.toLocaleString('pt-BR')} (Receita Mensal Prevista)`,
    arr: `R$ ${arr.toLocaleString('pt-BR')}`,
    averageRetention,
    churnRate,
    ltv,
    activeClientsCount,
    totalClients,
    churnedThisMonth,
    activeClientsThisMonth,
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
    newClientsCount: newClientsThisMonth,
    mrrGrowthRate,
    ltvCacRatio,
    healthScore,
    cac,
    trends: {
      mrrTrend: calculateTrend(mrr, previousMetrics.mrr),
      averageTicketTrend: calculateTrend(averageTicket, previousMetrics.averageTicket),
      newClientsTrend: calculateTrend(newClientsThisMonth, previousMetrics.newClientsCount),
      churnRateTrend: calculateTrend(churnRate, previousMetrics.churnRate, true), // true = lower is better
      totalCostsTrend: calculateTrend(totalCosts || 0, previousMetrics.totalCosts, true),
      cacTrend: calculateTrend(cac, previousMetrics.cac, true),
      ltvTrend: calculateTrend(ltv, previousMetrics.ltv),
      ltvCacRatioTrend: calculateTrend(ltvCacRatio, previousMetrics.ltvCacRatio),
    }
  };
};