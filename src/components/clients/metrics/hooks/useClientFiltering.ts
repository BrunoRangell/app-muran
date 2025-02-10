
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Client } from "../../types";

interface FilterParams {
  monthStr: string;
  yearStr: string;
  metric: string;
  clients?: Client[];
}

export const useClientFiltering = () => {
  const getClientsForPeriod = ({ monthStr, yearStr, metric, clients }: FilterParams) => {
    if (!clients) return [];

    const monthName = monthStr.charAt(0).toUpperCase() + monthStr.slice(1).toLowerCase();
    const year = Number(`20${yearStr}`);

    let monthIndex = -1;
    for (let i = 0; i < 12; i++) {
      const formattedMonth = format(new Date(2024, i, 1), 'MMM', { locale: ptBR })
        .split('')
        .map((char, index) => index === 0 ? char.toUpperCase() : char.toLowerCase())
        .join('');
      
      if (formattedMonth === monthName) {
        monthIndex = i;
        break;
      }
    }

    if (monthIndex === -1) {
      console.error('Mês não encontrado:', monthName);
      return [];
    }

    const startDate = new Date(year, monthIndex, 1);
    const endDate = new Date(year, monthIndex + 1, 0);

    console.log('Período selecionado:', {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      metric
    });

    switch (metric) {
      case 'Clientes Adquiridos':
        return clients.filter(client => {
          if (!client.first_payment_date) return false;
          const date = new Date(client.first_payment_date);
          return date >= startDate && date <= endDate;
        });
      case 'Clientes Cancelados':
        return clients.filter(client => {
          if (!client.last_payment_date) return false;
          const date = new Date(client.last_payment_date);
          return date >= startDate && date <= endDate && client.status === 'inactive';
        });
      case 'Churn Rate':
        return clients.filter(client => {
          if (!client.last_payment_date) return false;
          const date = new Date(client.last_payment_date);
          return date >= startDate && date <= endDate && client.status === 'inactive';
        });
      default:
        return clients.filter(client => {
          if (!client.first_payment_date) return false;
          const startClient = new Date(client.first_payment_date);
          const endClient = client.last_payment_date ? new Date(client.last_payment_date) : new Date();
          return startClient <= endDate && endClient >= startDate;
        });
    }
  };

  return { getClientsForPeriod };
};
