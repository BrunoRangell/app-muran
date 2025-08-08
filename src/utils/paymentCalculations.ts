import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

export interface PaymentBasedMetrics {
  monthlyRevenue: number;
  totalPayments: number;
  uniqueClients: number;
}

export const calculatePaymentBasedMRR = async (
  monthStart: Date, 
  monthEnd: Date
): Promise<PaymentBasedMetrics> => {
  try {
    const monthStr = format(monthStart, 'yyyy-MM');
    const nextMonth = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 1);
    
    console.log(`Calculating payment-based MRR for ${monthStr}`, {
      monthStart: monthStart.toISOString(),
      monthEnd: monthEnd.toISOString(),
      nextMonth: nextMonth.toISOString()
    });
    
    // Buscar todos os pagamentos do mês específico usando range de datas
    const { data: payments, error } = await supabase
      .from("payments")
      .select("amount, client_id, reference_month")
      .gte("reference_month", monthStart.toISOString().split('T')[0])
      .lt("reference_month", nextMonth.toISOString().split('T')[0])
      .gt('amount', 0); // Only get payments with positive amounts

    if (error) {
      console.error("Error fetching payments:", error);
      return { monthlyRevenue: 0, totalPayments: 0, uniqueClients: 0 };
    }

    if (!payments || payments.length === 0) {
      console.log(`No payments found for ${monthStr}`);
      return { monthlyRevenue: 0, totalPayments: 0, uniqueClients: 0 };
    }

    // Calcular métricas baseadas em pagamentos reais
    const monthlyRevenue = payments.reduce((sum, payment) => sum + Number(payment.amount), 0);
    const totalPayments = payments.length;
    const uniqueClients = new Set(payments.map(p => p.client_id)).size;

    console.log(`Payment-based metrics for ${monthStr}:`, {
      monthlyRevenue,
      totalPayments,
      uniqueClients
    });

    return {
      monthlyRevenue,
      totalPayments,
      uniqueClients
    };
  } catch (error) {
    console.error("Error in calculatePaymentBasedMRR:", error);
    return { monthlyRevenue: 0, totalPayments: 0, uniqueClients: 0 };
  }
};

export const calculateCurrentMRR = async (): Promise<number> => {
  try {
    const currentDate = new Date();
    const currentMonthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const nextMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
    
    console.log('Calculating current MRR for:', {
      currentMonthStart: currentMonthStart.toISOString(),
      nextMonth: nextMonth.toISOString()
    });
    
    const { data: payments, error } = await supabase
      .from("payments")
      .select("amount")
      .gte("reference_month", currentMonthStart.toISOString().split('T')[0])
      .lt("reference_month", nextMonth.toISOString().split('T')[0])
      .gt('amount', 0); // Only get payments with positive amounts

    if (error) {
      console.error("Error fetching current month payments:", error);
      return 0;
    }

    return payments?.reduce((sum, payment) => sum + Number(payment.amount), 0) || 0;
  } catch (error) {
    console.error("Error calculating current MRR:", error);
    return 0;
  }
};