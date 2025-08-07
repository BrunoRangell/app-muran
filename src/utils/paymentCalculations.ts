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
    
    console.log(`Calculating payment-based MRR for ${monthStr}`);
    
    // Buscar todos os pagamentos do mês específico
    const { data: payments, error } = await supabase
      .from("payments")
      .select("amount, client_id, reference_month")
      .eq("reference_month", monthStr);

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

export const calculateNewClientsFromPayments = async (
  monthStart: Date, 
  monthEnd: Date
): Promise<number> => {
  try {
    const monthStr = format(monthStart, 'yyyy-MM');
    console.log(`Calculating new clients from payments for ${monthStr}`);
    
    // Buscar todos os pagamentos do mês
    const { data: monthPayments, error } = await supabase
      .from("payments")
      .select("client_id, reference_month")
      .eq("reference_month", monthStr);

    if (error) {
      console.error("Error fetching payments for new clients:", error);
      return 0;
    }

    if (!monthPayments || monthPayments.length === 0) {
      console.log("No payments found for the month");
      return 0;
    }

    // Para cada cliente que pagou no mês, verificar se é o primeiro pagamento
    const newClientsSet = new Set();
    
    for (const payment of monthPayments) {
      // Verificar se há pagamentos anteriores para este cliente
      const { data: earlierPayments, error: earlierError } = await supabase
        .from("payments")
        .select("reference_month")
        .eq("client_id", payment.client_id)
        .lt("reference_month", monthStr)
        .limit(1);

      if (earlierError) {
        console.error("Error checking earlier payments:", earlierError);
        continue;
      }

      // Se não há pagamentos anteriores, este é um novo cliente
      if (!earlierPayments || earlierPayments.length === 0) {
        newClientsSet.add(payment.client_id);
      }
    }

    console.log(`Found ${newClientsSet.size} new clients from payments`);
    return newClientsSet.size;
    
  } catch (error) {
    console.error("Error in calculateNewClientsFromPayments:", error);
    return 0;
  }
};

export const calculateCurrentMRR = async (): Promise<number> => {
  try {
    const currentDate = new Date();
    const currentMonthStr = format(currentDate, 'yyyy-MM');
    
    const { data: payments, error } = await supabase
      .from("payments")
      .select("amount")
      .eq("reference_month", currentMonthStr);

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