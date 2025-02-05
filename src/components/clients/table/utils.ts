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
  
  const startDate = new Date(client.first_payment_date);
  const endDate = client.status === "active" 
    ? new Date()
    : client.last_payment_date 
      ? new Date(client.last_payment_date)
      : new Date();
  
  return Math.max(differenceInMonths(endDate, startDate), 0);
};

export const formatCellContent = (client: Client, columnId: string) => {
  let content = client[columnId as keyof Client];

  if (columnId === 'contract_value') {
    content = formatCurrency(client.contract_value);
  } else if (columnId === 'first_payment_date' || columnId === 'company_birthday' || columnId === 'last_payment_date') {
    if (content) {
      const date = new Date(content as string);
      date.setDate(date.getDate() + 1);
      content = formatDate(date.toISOString());
    } else {
      content = '';
    }
  } else if (columnId === 'payment_type') {
    content = content === 'pre' ? 'Pré-pago' : 'Pós-pago';
  } else if (columnId === 'retention') {
    content = formatRetention(calculateRetention(client));
  }

  return content;
};