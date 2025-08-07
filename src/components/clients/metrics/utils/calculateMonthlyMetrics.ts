
import { Client } from "../../types";
import { format } from "date-fns";
import { 
  isClientActiveInMonth, 
  isClientNewInMonth, 
  isClientChurnedInMonth,
  getActiveClientsAtStartOfMonth 
} from "./dateFilters";
import { calculatePaymentBasedMRR } from "@/utils/paymentCalculations";

interface MonthlyMetrics {
  month: string;
  mrr: number;
  clients: number;
  churn: number;
  churnRate: number;
  newClients: number;
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

    // Para o gráfico, usar APENAS receita real baseada em pagamentos
    const paymentMetrics = await calculatePaymentBasedMRR(monthStart, monthEnd);
    
    // Usar apenas dados reais de pagamentos - se não há dados, fica 0
    const mrrValue = paymentMetrics.monthlyRevenue;

    const monthStr = format(currentDate, 'M/yy'); // Formato numérico para consistência

    const result = {
      month: monthStr,
      mrr: mrrValue, // Usar apenas receita real dos pagamentos
      clients: activeClientsInMonth.length,
      churn: churned,
      churnRate: activeClientsAtStartOfMonth > 0 
        ? (churned / activeClientsAtStartOfMonth) * 100 
        : 0,
      newClients: newClients
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
