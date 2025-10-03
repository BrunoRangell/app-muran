/**
 * Web Worker para cálculos financeiros pesados
 * Fase 5: Performance Máxima - Lógica Completa de Cálculos Financeiros
 */

// Tipos para comunicação com o worker
export interface WorkerMessage {
  type: 'CALCULATE_METRICS' | 'CALCULATE_LTV';
  payload: any;
}

export interface WorkerResponse {
  type: 'METRICS_RESULT' | 'LTV_RESULT' | 'ERROR';
  payload: any;
}

// ============== FUNÇÕES AUXILIARES ==============

// Normalizar data
const normalizeDate = (date: Date): Date => {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
};

// Verificar se cliente é novo no mês
const isClientNewInMonth = (client: any, monthStart: Date, monthEnd: Date): boolean => {
  try {
    if (!client.first_payment_date) return false;
    const firstPayment = new Date(client.first_payment_date);
    firstPayment.setDate(firstPayment.getDate() + 1);
    return firstPayment >= monthStart && firstPayment <= monthEnd;
  } catch (error) {
    return false;
  }
};

// Diferença em meses
const differenceInMonths = (date1: Date, date2: Date): number => {
  return (date1.getFullYear() - date2.getFullYear()) * 12 + (date1.getMonth() - date2.getMonth());
};

// Calcular tendência
const calculateTrend = (current: number, previous: number, lowerIsBetter: boolean = false): { value: number; isPositive: boolean } => {
  if (previous === 0) {
    return { value: 0, isPositive: true };
  }
  const change = ((current - previous) / previous) * 100;
  const isPositive = lowerIsBetter ? change < 0 : change > 0;
  return { value: Math.abs(change), isPositive };
};

// ============== CÁLCULO DE LTV (12 MESES) ==============

const calculateLTV12Months = (clients: any[], payments: any[], targetMonth: Date): number => {
  const normalizedTargetMonth = normalizeDate(targetMonth);
  const endOfPeriod = new Date(normalizedTargetMonth.getFullYear(), normalizedTargetMonth.getMonth() + 1, 0);
  const startOfPeriod = new Date(normalizedTargetMonth.getFullYear(), normalizedTargetMonth.getMonth() - 11, 1);

  // Filtrar payments no período
  const paymentsInPeriod = payments.filter((p: any) => {
    const refDate = new Date(p.reference_month);
    return refDate >= startOfPeriod && refDate <= endOfPeriod;
  });

  // Agrupar por cliente
  const paymentsByClient: Record<string, number> = {};
  paymentsInPeriod.forEach((payment: any) => {
    const clientId = payment.client_id;
    if (clientId && Number(payment.amount) > 0) {
      paymentsByClient[clientId] = (paymentsByClient[clientId] || 0) + Number(payment.amount);
    }
  });

  // Filtrar clientes ativos no período
  const activeClientsInPeriod = clients.filter((client: any) => {
    const firstPayment = new Date(client.first_payment_date);
    const lastPayment = client.last_payment_date ? new Date(client.last_payment_date) : new Date();
    return firstPayment <= endOfPeriod && lastPayment >= startOfPeriod;
  });

  // Calcular LTV
  let totalPayments = 0;
  let clientsWithPositivePayments = 0;

  activeClientsInPeriod.forEach((client: any) => {
    const clientPayments = paymentsByClient[client.id] || 0;
    if (clientPayments > 0) {
      totalPayments += clientPayments;
      clientsWithPositivePayments++;
    }
  });

  return clientsWithPositivePayments > 0 ? totalPayments / clientsWithPositivePayments : 0;
};

// ============== CÁLCULO DE CAC (ÚLTIMOS 3 MESES) ==============

const calculateCAC = (clients: any[], costs: any[], currentDate: Date): number => {
  const threeMonthsStart = new Date(currentDate.getFullYear(), currentDate.getMonth() - 2, 1);
  const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

  // Filtrar custos de marketing e vendas dos últimos 3 meses
  // Como não temos costs_categories no worker, vamos usar todos os custos por enquanto
  // NOTA: Isso seria otimizado passando os custos já filtrados do hook
  const costsInPeriod = costs.filter((cost: any) => {
    const costDate = new Date(cost.date);
    return costDate >= threeMonthsStart && costDate <= monthEnd;
  });

  const totalMarketingCosts = costsInPeriod.reduce((sum: number, cost: any) => sum + Number(cost.amount), 0);

  // Contar novos clientes nos últimos 3 meses
  let newClientsCount = 0;
  for (let i = 0; i < 3; i++) {
    const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
    const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() - i + 1, 0);
    newClientsCount += clients.filter((client: any) => isClientNewInMonth(client, monthStart, monthEnd)).length;
  }

  return newClientsCount > 0 ? totalMarketingCosts / newClientsCount : 0;
};

// ============== CÁLCULO DE MÉTRICAS DO MÊS ANTERIOR ==============

const calculatePreviousMonthMetrics = (clients: any[], payments: any[], costs: any[], previousDate: Date) => {
  const monthStart = new Date(previousDate.getFullYear(), previousDate.getMonth(), 1);
  const monthEnd = new Date(previousDate.getFullYear(), previousDate.getMonth() + 1, 0);

  // Clientes ativos no mês anterior
  const activeClientsPrevious = clients.filter((client: any) => {
    const firstPayment = new Date(client.first_payment_date);
    const lastPayment = client.last_payment_date ? new Date(client.last_payment_date) : null;
    return firstPayment <= monthEnd && (!lastPayment || lastPayment >= monthStart);
  });

  // MRR do mês anterior baseado em payments
  const previousMonthPayments = payments.filter((p: any) => {
    const refDate = new Date(p.reference_month);
    return refDate >= monthStart && refDate <= monthEnd;
  });
  const previousMrr = previousMonthPayments.reduce((sum: number, p: any) => sum + Number(p.amount), 0);

  // Ticket médio anterior
  const averageTicketPrevious = activeClientsPrevious.length > 0 ? previousMrr / activeClientsPrevious.length : 0;

  // Novos clientes do mês anterior
  const newClientsCountPrevious = clients.filter((client: any) => isClientNewInMonth(client, monthStart, monthEnd)).length;

  // Churn do mês anterior
  const churned = clients.filter((client: any) => {
    if (!client.last_payment_date || client.status !== "inactive") return false;
    const lastPayment = new Date(client.last_payment_date);
    return lastPayment >= monthStart && lastPayment <= monthEnd;
  });
  const churnRatePrevious = activeClientsPrevious.length > 0 ? (churned.length / activeClientsPrevious.length) * 100 : 0;

  // Custos do mês anterior
  const previousCosts = costs.filter((cost: any) => {
    const costDate = new Date(cost.date);
    return costDate >= monthStart && costDate <= monthEnd;
  });
  const totalCostsPrevious = previousCosts.reduce((sum: number, cost: any) => sum + Number(cost.amount), 0);

  // CAC do mês anterior
  const cacPrevious = calculateCAC(clients, costs, previousDate);

  // Retenção média simplificada
  const averageRetentionPrevious = activeClientsPrevious.length > 0 
    ? activeClientsPrevious.reduce((sum: number, client: any) => {
        const months = differenceInMonths(previousDate, new Date(client.first_payment_date));
        return sum + Math.max(months, 1);
      }, 0) / activeClientsPrevious.length
    : 1;

  const ltvPrevious = averageTicketPrevious * averageRetentionPrevious;
  const ltvCacRatioPrevious = cacPrevious > 0 ? ltvPrevious / cacPrevious : 0;

  return {
    mrr: previousMrr,
    averageTicket: averageTicketPrevious,
    newClientsCount: newClientsCountPrevious,
    churnRate: churnRatePrevious,
    totalCosts: totalCostsPrevious,
    cac: cacPrevious,
    ltv: ltvPrevious,
    ltvCacRatio: ltvCacRatioPrevious,
  };
};

// ============== FUNÇÃO PRINCIPAL DE CÁLCULO ==============

function calculateFinancialMetrics(clients: any[], payments: any[], costs: any[]) {
  const today = new Date();
  const activeClients = clients.filter((c: any) => c.status === 'active');
  
  // Total de clientes
  const totalClients = clients.length;
  const activeClientsCount = activeClients.length;

  // MRR baseado em contract_value dos clientes ativos
  const mrr = activeClients.reduce((sum: number, client: any) => sum + Number(client.contract_value || 0), 0);
  const arr = mrr * 12;

  // Novos clientes este mês
  const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const currentMonthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  const newClientsThisMonth = clients.filter((client: any) => 
    isClientNewInMonth(client, currentMonthStart, currentMonthEnd)
  ).length;

  // MRR Growth baseado em payments
  const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);

  const currentMonthPayments = payments.filter((p: any) => {
    const refDate = new Date(p.reference_month);
    return refDate >= currentMonthStart && refDate <= currentMonthEnd;
  });
  const lastMonthPayments = payments.filter((p: any) => {
    const refDate = new Date(p.reference_month);
    return refDate >= lastMonthStart && refDate <= lastMonthEnd;
  });

  const currentMonthRevenue = currentMonthPayments.reduce((sum: number, p: any) => sum + Number(p.amount), 0);
  const lastMonthRevenue = lastMonthPayments.reduce((sum: number, p: any) => sum + Number(p.amount), 0);
  const mrrGrowthRate = lastMonthRevenue > 0 ? ((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 : 0;

  // Ticket Médio
  const averageTicket = activeClientsCount > 0 ? mrr / activeClientsCount : 0;

  // Retenção Média (em meses)
  const retentionPeriods = clients.map((client: any) => {
    const startDate = new Date(client.first_payment_date);
    const endDate = client.status === "active" 
      ? today 
      : (client.last_payment_date ? new Date(client.last_payment_date) : today);
    return Math.max(differenceInMonths(endDate, startDate), 1);
  });
  const averageRetention = totalClients > 0 
    ? retentionPeriods.reduce((sum: number, months: number) => sum + months, 0) / totalClients 
    : 0;

  // Churn Rate (apenas mês atual)
  const churnedThisMonth = clients.filter((client: any) => {
    if (!client.last_payment_date || client.status !== "inactive") return false;
    const lastPayment = new Date(client.last_payment_date);
    return lastPayment >= currentMonthStart && lastPayment <= currentMonthEnd;
  }).length;

  const activeClientsThisMonth = clients.filter((client: any) => {
    const firstPayment = new Date(client.first_payment_date);
    const lastPayment = client.last_payment_date ? new Date(client.last_payment_date) : null;
    return firstPayment <= currentMonthEnd && (!lastPayment || lastPayment >= currentMonthStart);
  }).length;

  const churnRate = activeClientsThisMonth > 0 ? (churnedThisMonth / activeClientsThisMonth) * 100 : 0;

  // LTV baseado em payments dos últimos 12 meses
  const ltv = calculateLTV12Months(clients, payments, today);

  // CAC baseado em custos
  const cac = calculateCAC(clients, costs, today);

  // LTV:CAC Ratio
  const ltvCacRatio = cac > 0 ? ltv / cac : 0;

  // Health Score
  let healthScore = 50;
  if (ltvCacRatio >= 3) healthScore += 30;
  else if (ltvCacRatio >= 2) healthScore += 20;
  else if (ltvCacRatio >= 1) healthScore += 10;

  if (churnRate <= 5) healthScore += 25;
  else if (churnRate <= 10) healthScore += 15;
  else if (churnRate <= 15) healthScore += 5;
  else healthScore -= 10;

  if (mrrGrowthRate >= 15) healthScore += 20;
  else if (mrrGrowthRate >= 10) healthScore += 15;
  else if (mrrGrowthRate >= 5) healthScore += 10;
  else if (mrrGrowthRate >= 0) healthScore += 5;
  else healthScore -= 10;

  if (averageRetention >= 24) healthScore += 15;
  else if (averageRetention >= 12) healthScore += 10;
  else if (averageRetention >= 6) healthScore += 5;

  healthScore = Math.max(0, Math.min(100, healthScore));

  // Total de custos
  const totalCosts = costs.reduce((sum: number, cost: any) => sum + Number(cost.amount), 0);

  // Cálculo de trends
  const previousDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const previousMetrics = calculatePreviousMonthMetrics(clients, payments, costs, previousDate);

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
      churnRateTrend: calculateTrend(churnRate, previousMetrics.churnRate, true),
      totalCostsTrend: calculateTrend(totalCosts || 0, previousMetrics.totalCosts, true),
      cacTrend: calculateTrend(cac, previousMetrics.cac, true),
      ltvTrend: calculateTrend(ltv, previousMetrics.ltv),
      ltvCacRatioTrend: calculateTrend(ltvCacRatio, previousMetrics.ltvCacRatio),
    }
  };
}

// Função para calcular LTV
function calculateLTV(clients: any[], payments: any[], targetMonth: Date) {
  const endDate = new Date(targetMonth);
  const startDate = new Date(endDate);
  startDate.setMonth(startDate.getMonth() - 11);
  startDate.setDate(1);

  const activeClients = clients.filter(client => {
    const firstPayment = client.first_payment_date ? new Date(client.first_payment_date) : null;
    const lastPayment = client.last_payment_date ? new Date(client.last_payment_date) : null;

    if (!firstPayment) return false;
    if (firstPayment > endDate) return false;
    if (client.status === 'inactive' && lastPayment && lastPayment < startDate) return false;

    return true;
  });

  const relevantPayments = payments.filter(payment => {
    const refDate = new Date(payment.reference_month);
    return refDate >= startDate && refDate <= endDate;
  });

  const totalRevenue = relevantPayments
    .filter(p => Number(p.amount) > 0)
    .reduce((sum, p) => sum + Number(p.amount), 0);

  return activeClients.length > 0 ? totalRevenue / activeClients.length : 0;
}

// Event listener para mensagens
self.addEventListener('message', (event: MessageEvent<WorkerMessage>) => {
  const { type, payload } = event.data;

  try {
    let result;

    switch (type) {
      case 'CALCULATE_METRICS':
        result = calculateFinancialMetrics(
          payload.clients,
          payload.payments,
          payload.costs
        );
        self.postMessage({
          type: 'METRICS_RESULT',
          payload: result,
        } as WorkerResponse);
        break;

      case 'CALCULATE_LTV':
        result = calculateLTV(
          payload.clients,
          payload.payments,
          new Date(payload.targetMonth)
        );
        self.postMessage({
          type: 'LTV_RESULT',
          payload: result,
        } as WorkerResponse);
        break;

      default:
        throw new Error(`Unknown worker message type: ${type}`);
    }
  } catch (error) {
    self.postMessage({
      type: 'ERROR',
      payload: {
        message: error instanceof Error ? error.message : 'Unknown error',
      },
    } as WorkerResponse);
  }
});

export {};
