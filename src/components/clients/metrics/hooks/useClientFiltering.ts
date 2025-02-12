
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Client } from "../../types";

interface FilterParams {
  monthStr: string;
  yearStr: string;
  metric: string;
  clients?: Client[];
}

const MONTH_MAPPINGS = {
  // Meses em português
  'jan': 0, 'fev': 1, 'mar': 2, 'abr': 3, 'mai': 4, 'jun': 5,
  'jul': 6, 'ago': 7, 'set': 8, 'out': 9, 'nov': 10, 'dez': 11,
  // Meses em inglês
  'jan': 0, 'feb': 1, 'mar': 2, 'apr': 3, 'may': 4, 'jun': 5,
  'jul': 6, 'aug': 7, 'sep': 8, 'oct': 9, 'nov': 10, 'dec': 11
};

export const useClientFiltering = () => {
  const getMonthIndex = (monthStr: string): number => {
    const normalizedMonth = monthStr.toLowerCase();
    const monthIndex = MONTH_MAPPINGS[normalizedMonth];

    if (monthIndex === undefined) {
      console.error('Mês não reconhecido:', monthStr);
      return -1;
    }

    return monthIndex;
  };

  const getClientsForPeriod = ({ monthStr, yearStr, metric, clients }: FilterParams) => {
    if (!clients) return [];

    const monthIndex = getMonthIndex(monthStr);
    if (monthIndex === -1) return [];

    const year = Number(`20${yearStr}`);
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
