
import { Client } from "../../types";
import { format } from "date-fns";
import { 
  isClientActiveInMonth, 
  isClientNewInMonth, 
  isClientChurnedInMonth,
  getActiveClientsAtStartOfMonth 
} from "./dateFilters";
import { calculatePaymentBasedMRR } from "@/utils/paymentCalculations";
import { supabase } from "@/integrations/supabase/client";

export interface PaymentDetail {
  company_name: string;
  amount: number;
  status: string;
}

export interface ClientDetail {
  company_name: string;
  last_payment_date: string | null;
}

interface MonthlyMetrics {
  month: string;
  mrr: number;
  clients: number;
  churn: number;
  churnRate: number;
  newClients: number;
  paymentDetails?: PaymentDetail[];
  clientDetails?: ClientDetail[];
  churnedClients?: string[];
  newClientNames?: string[];
}

export const calculateMonthlyMetrics = async (
  clients: Client[], 
  currentDate: Date
): Promise<MonthlyMetrics> => {
  try {
    console.log(`Calculating metrics for ${format(currentDate, 'yyyy-MM-dd')}`);
    
    const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

    console.log(`Month range: ${format(monthStart, 'yyyy-MM-dd')} to ${format(monthEnd, 'yyyy-MM-dd')}`);

    const activeClientsInMonth = clients.filter(client => 
      isClientActiveInMonth(client, monthStart, monthEnd)
    );

    const newClients = clients.filter(client => 
      isClientNewInMonth(client, monthStart, monthEnd)
    ).length;

    const churned = clients.filter(client => 
      isClientChurnedInMonth(client, monthStart, monthEnd)
    ).length;

    const activeClientsAtStartOfMonth = getActiveClientsAtStartOfMonth(clients, monthStart);

    // Para o gráfico, usar receita real baseada em pagamentos
    const paymentMetrics = await calculatePaymentBasedMRR(monthStart, monthEnd);
    
    // Usar apenas receita real de pagamentos, sem fallback
    let mrrValue = paymentMetrics.monthlyRevenue;

    // Buscar detalhes dos pagamentos para o tooltip
    const { data: payments } = await supabase
      .from("payments")
      .select(`
        amount,
        client_id,
        clients!client_id(company_name)
      `)
      .gte("reference_month", monthStart.toISOString().split('T')[0])
      .lt("reference_month", new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 1).toISOString().split('T')[0]);

    const paymentDetails: PaymentDetail[] = payments?.map(payment => ({
      company_name: payment.clients?.company_name || 'Cliente não encontrado',
      amount: Number(payment.amount),
      status: 'RECEBIDO' // Todos os pagamentos na tabela são considerados recebidos
    })) || [];

    // Criar detalhes dos clientes ativos com último pagamento
    const clientDetails: ClientDetail[] = activeClientsInMonth.map(client => ({
      company_name: client.company_name,
      last_payment_date: client.last_payment_date
    }));

    // Nomes dos clientes cancelados e novos
    const churnedClientList = clients.filter(client => 
      isClientChurnedInMonth(client, monthStart, monthEnd)
    );
    
    const newClientList = clients.filter(client => 
      isClientNewInMonth(client, monthStart, monthEnd)
    );

    const monthStr = format(currentDate, 'M/yy'); // Formato numérico para consistência

    const result = {
      month: monthStr,
      mrr: mrrValue, // Usar apenas receita real dos pagamentos
      clients: activeClientsInMonth.length,
      churn: churned,
      churnRate: activeClientsAtStartOfMonth > 0 
        ? (churned / activeClientsAtStartOfMonth) * 100 
        : 0,
      newClients: newClients,
      paymentDetails,
      clientDetails,
      churnedClients: churnedClientList.map(c => c.company_name),
      newClientNames: newClientList.map(c => c.company_name)
    };

    console.log(`Results for ${monthStr}:`, result);
    return result;
  } catch (error) {
    console.error("Error in calculateMonthlyMetrics:", error, currentDate);
    
    // Retornar dados padrão em caso de erro
    const fallbackMonth = format(currentDate, 'M/yy');
    return {
      month: fallbackMonth,
      mrr: 0,
      clients: 0,
      churn: 0,
      churnRate: 0,
      newClients: 0
    };
  }
};
