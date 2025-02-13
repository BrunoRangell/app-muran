
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
  'jan-pt': 0, 'fev': 1, 'mar-pt': 2, 'abr': 3, 'mai': 4, 'jun-pt': 5,
  'jul-pt': 6, 'ago': 7, 'set': 8, 'out': 9, 'nov-pt': 10, 'dez': 11,
  // Meses em inglês
  'jan-en': 0, 'feb': 1, 'mar-en': 2, 'apr': 3, 'may': 4, 'jun-en': 5,
  'jul-en': 6, 'aug': 7, 'sep': 8, 'oct': 9, 'nov-en': 10, 'dec': 11
};

export const useClientFiltering = () => {
  const getMonthIndex = (monthStr: string): number => {
    const normalizedMonth = monthStr.toLowerCase();
    
    // Tenta encontrar o mês em português primeiro
    let monthIndex = MONTH_MAPPINGS[`${normalizedMonth}-pt`] ?? MONTH_MAPPINGS[normalizedMonth];
    
    // Se não encontrar, tenta em inglês
    if (monthIndex === undefined) {
      monthIndex = MONTH_MAPPINGS[`${normalizedMonth}-en`];
    }

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
