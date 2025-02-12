
import { Client } from "../types";
import { formatCurrency, formatDate } from "@/utils/formatters";
import { differenceInMonths } from "date-fns";

export const formatRetention = (months: number) => {
  if (months <= 11) {
    return `${months} ${months === 1 ? 'mês' : 'meses'}`;
  }
  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;
  if (remainingMonths === 0) {
    return `${years} ${years === 1 ? 'ano' : 'anos'}`;
  }
  return `${years} ${years === 1 ? 'ano' : 'anos'} e ${remainingMonths} ${remainingMonths === 1 ? 'mês' : 'meses'}`;
};

export const calculateRetention = (client: Client) => {
  if (!client.first_payment_date) return 0;
  
  try {
    const [year, month, day] = client.first_payment_date.split('T')[0].split('-').map(Number);
    const startDate = new Date(year, month - 1, day, 12, 0, 0);
    
    const endDate = client.status === "active" 
      ? new Date()
      : client.last_payment_date 
        ? (() => {
            const [endYear, endMonth, endDay] = client.last_payment_date.split('T')[0].split('-').map(Number);
            return new Date(endYear, endMonth - 1, endDay, 12, 0, 0);
          })()
        : new Date();
    
    return Math.max(differenceInMonths(endDate, startDate), 0);
  } catch (error) {
    console.error('Erro ao calcular retenção:', error, client);
    return 0;
  }
};

export const formatCellContent = (client: Client, columnId: string) => {
  try {
    let content = client[columnId as keyof Client];

    if (columnId === 'contract_value') {
      content = formatCurrency(client.contract_value);
    } else if (columnId === 'first_payment_date' || columnId === 'company_birthday' || columnId === 'last_payment_date') {
      if (content) {
        content = formatDate(content as string);
      } else {
        content = '';
      }
    } else if (columnId === 'payment_type') {
      content = content === 'pre' ? 'Pré-pago' : 'Pós-pago';
    } else if (columnId === 'retention') {
      content = formatRetention(calculateRetention(client));
    }

    return content;
  } catch (error) {
    console.error('Erro ao formatar conteúdo da célula:', error, { client, columnId });
    return '';
  }
};
