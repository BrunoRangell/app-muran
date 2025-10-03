/**
 * Web Worker para cálculos financeiros pesados
 * Fase 3C: Otimização de Performance com Web Workers
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

// Função para calcular métricas financeiras
function calculateFinancialMetrics(clients: any[], payments: any[], costs: any[]) {
  // Cálculos pesados aqui
  const activeClients = clients.filter(c => c.status === 'active');
  const mrr = payments
    .filter(p => {
      const refDate = new Date(p.reference_month);
      const now = new Date();
      return refDate.getMonth() === now.getMonth() && 
             refDate.getFullYear() === now.getFullYear();
    })
    .reduce((sum, p) => sum + Number(p.amount), 0);

  const totalCosts = costs
    .filter(c => {
      const costDate = new Date(c.date);
      const now = new Date();
      return costDate.getMonth() === now.getMonth() && 
             costDate.getFullYear() === now.getFullYear();
    })
    .reduce((sum, c) => sum + Number(c.amount), 0);

  return {
    mrr,
    totalCosts,
    profit: mrr - totalCosts,
    activeClients: activeClients.length,
    avgTicket: activeClients.length > 0 ? mrr / activeClients.length : 0,
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
