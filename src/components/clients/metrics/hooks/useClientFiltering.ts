
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Client } from "../../types";
import { isClientActiveInMonth, isClientNewInMonth, isClientChurnedInMonth } from "../utils/dateFilters";

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
    console.log('Filtrando clientes para:', { monthStr, yearStr, metric, clientsCount: clients?.length });
    
    if (!clients) {
      console.log('Nenhum cliente fornecido');
      return [];
    }

    // monthStr vem como número (ex: "6"), yearStr como "25"
    const month = parseInt(monthStr);
    const year = parseInt(yearStr);
    
    if (isNaN(month) || isNaN(year)) {
      console.error('Mês ou ano inválido:', { monthStr, yearStr });
      return [];
    }

    const fullYear = year < 50 ? 2000 + year : 1900 + year;
    const startDate = new Date(fullYear, month - 1, 1);
    const endDate = new Date(fullYear, month, 0);

    console.log('Período calculado:', {
      month, year: fullYear,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      metric
    });

    let filteredClients = [];

    switch (metric) {
      case 'Clientes Adquiridos':
        filteredClients = clients.filter(client => {
          const isNew = isClientNewInMonth(client, startDate, endDate);
          if (isNew) {
            console.log('Cliente adquirido encontrado:', client.company_name, client.first_payment_date);
          }
          // Debug específico para Orientista
          if (client.company_name?.toLowerCase().includes('orientista')) {
            console.log('🔍 DEBUG ORIENTISTA - Novo Cliente:', {
              company: client.company_name,
              first_payment: client.first_payment_date,
              startDate: startDate.toISOString(),
              endDate: endDate.toISOString(),
              isNew,
              calculatedDate: client.first_payment_date ? new Date(client.first_payment_date).toISOString() : 'null'
            });
          }
          return isNew;
        });
        break;
        
      case 'Clientes Cancelados':
        filteredClients = clients.filter(client => {
          const isChurned = isClientChurnedInMonth(client, startDate, endDate) && client.status === 'inactive';
          if (isChurned) {
            console.log('Cliente cancelado encontrado:', client.company_name, client.last_payment_date);
          }
          return isChurned;
        });
        break;
        
      case 'Receita Mensal':
      case 'Total de Clientes':
      default:
        filteredClients = clients.filter(client => {
          const isActive = isClientActiveInMonth(client, startDate, endDate);
          if (isActive && metric === 'Total de Clientes') {
            console.log('Cliente ativo encontrado:', client.company_name, {
              first_payment: client.first_payment_date,
              last_payment: client.last_payment_date,
              status: client.status
            });
          }
          // Debug específico para Orientista
          if (client.company_name?.toLowerCase().includes('orientista')) {
            console.log('🔍 DEBUG ORIENTISTA - Cliente Ativo:', {
              company: client.company_name,
              first_payment: client.first_payment_date,
              last_payment: client.last_payment_date,
              status: client.status,
              startDate: startDate.toISOString(),
              endDate: endDate.toISOString(),
              isActive,
              calculatedStartDate: client.first_payment_date ? (() => {
                const date = new Date(client.first_payment_date);
                date.setDate(date.getDate() + 1);
                return date.toISOString();
              })() : 'null'
            });
          }
          return isActive;
        });
        break;
    }

    console.log(`Clientes filtrados para ${metric}:`, filteredClients.length);
    return filteredClients;
  };

  return { getClientsForPeriod };
};
