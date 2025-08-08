import { differenceInMonths, startOfMonth, endOfMonth, subMonths, parseISO } from 'date-fns';
import { Client } from '@/components/clients/types';
import { supabase } from '@/integrations/supabase/client';
import { calculatePaymentBasedMRR } from './paymentCalculations';
import { isClientNewInMonth } from '@/components/clients/metrics/utils/dateFilters';

interface PreviousMetrics {
  mrr: number;
  averageTicket: number;
  newClientsCount: number;
  churnRate: number;
  totalCosts: number;
  cac: number;
  ltv: number;
  ltvCacRatio: number;
}

// Calculate CAC based on marketing and sales costs
export const calculateCAC = async (clients: Client[], currentDate: Date): Promise<number> => {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);

  try {
    // Get marketing and sales costs for current month
    const { data: costsData, error: costsError } = await supabase
      .from('costs')
      .select(`
        amount,
        costs_categories!inner(category_id)
      `)
      .gte('date', monthStart.toISOString().split('T')[0])
      .lte('date', monthEnd.toISOString().split('T')[0]);

    if (costsError) throw costsError;

    // Filter marketing and sales costs
    const marketingAndSalesCosts = costsData?.filter(cost => 
      cost.costs_categories.some((cat: any) => 
        cat.category_id === 'marketing' || cat.category_id === 'vendas'
      )
    ) || [];

    const totalMarketingCosts = marketingAndSalesCosts.reduce((sum, cost) => sum + Number(cost.amount), 0);

    // Get new clients for current month
    const newClientsCount = clients.filter(client => isClientNewInMonth(client, monthStart, monthEnd)).length;

    // Calculate CAC
    return newClientsCount > 0 ? totalMarketingCosts / newClientsCount : 0;
  } catch (error) {
    console.error('Error calculating CAC:', error);
    return 0;
  }
};

// Calculate metrics for previous month
export const calculatePreviousMonthMetrics = async (clients: Client[], previousDate: Date): Promise<PreviousMetrics> => {
  const monthStart = startOfMonth(previousDate);
  const monthEnd = endOfMonth(previousDate);

  // Calculate active clients for previous month
  const activeClientsPrevious = clients.filter(client => {
    const firstPayment = parseISO(client.first_payment_date);
    const lastPayment = client.last_payment_date ? parseISO(client.last_payment_date) : null;
    return firstPayment <= monthEnd && (!lastPayment || lastPayment >= monthStart);
  });
  const activeClientsCountPrevious = activeClientsPrevious.length;

  // Calculate MRR for previous month
  const { monthlyRevenue: previousMrr } = await calculatePaymentBasedMRR(monthStart, monthEnd);

  // Calculate average ticket for previous month
  const averageTicketPrevious = activeClientsCountPrevious > 0 ? previousMrr / activeClientsCountPrevious : 0;

  // Calculate new clients for previous month
  const newClientsCountPrevious = clients.filter(client => isClientNewInMonth(client, monthStart, monthEnd)).length;

  // Calculate churn rate for previous month
  const churned = clients.filter(client => 
    client.status === "inactive" && 
    client.last_payment_date && 
    parseISO(client.last_payment_date) >= monthStart &&
    parseISO(client.last_payment_date) <= monthEnd
  );
  const churnRatePrevious = activeClientsPrevious.length > 0 ? (churned.length / activeClientsPrevious.length) * 100 : 0;

  // Calculate total costs for previous month
  const { data: previousCosts } = await supabase
    .from('costs')
    .select('amount')
    .gte('date', monthStart.toISOString().split('T')[0])
    .lte('date', monthEnd.toISOString().split('T')[0]);

  const totalCostsPrevious = previousCosts?.reduce((sum, cost) => sum + Number(cost.amount), 0) || 0;

  // Calculate CAC for previous month
  const cacPrevious = await calculateCAC(clients, previousDate);

  // Calculate average retention (simplified for previous month)
  const averageRetentionPrevious = activeClientsPrevious.length > 0 
    ? activeClientsPrevious.reduce((sum, client) => {
        const months = differenceInMonths(previousDate, parseISO(client.first_payment_date));
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

// Calculate trend percentage and direction
export const calculateTrend = (current: number, previous: number, lowerIsBetter: boolean = false): { value: number; isPositive: boolean } => {
  if (previous === 0) {
    return { value: 0, isPositive: true };
  }

  const change = ((current - previous) / previous) * 100;
  const isPositive = lowerIsBetter ? change < 0 : change > 0;

  return {
    value: Math.abs(change),
    isPositive,
  };
};