
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
  const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

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

  return {
    month: format(currentDate, 'MMM/yy'),
    mrr: activeClientsInMonth.reduce((sum, client) => sum + (client.contract_value || 0), 0),
    clients: activeClientsInMonth.length,
    churn: churned,
    churnRate: activeClientsAtStartOfMonth > 0 
      ? (churned / activeClientsAtStartOfMonth) * 100 
      : 0,
    newClients: newClients
  };
};
