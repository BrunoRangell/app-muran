
import { Client } from "../../types";
import { format } from "date-fns";
import { 
  isClientActiveInMonth, 
  isClientNewInMonth, 
  isClientChurnedInMonth,
  getActiveClientsAtStartOfMonth 
} from "./dateFilters";

interface MonthlyMetrics {
  month: string;
  mrr: number;
  clients: number;
  churn: number;
  churnRate: number;
  newClients: number;
}

export const calculateMonthlyMetrics = (
  clients: Client[], 
  currentDate: Date
): MonthlyMetrics => {
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

    const monthStr = format(currentDate, 'M/yy'); // Formato numérico para consistência

    const result = {
      month: monthStr,
      mrr: activeClientsInMonth.reduce((sum, client) => sum + (client.contract_value || 0), 0),
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
