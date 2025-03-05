
import { formatCurrency } from "@/utils/formatters";
import { getDaysInMonth } from 'date-fns';
import { formatInTimeZone } from "date-fns-tz";

// Função para calcular o orçamento diário ideal
export const calculateIdealDailyBudget = (monthlyBudget: number, date: Date) => {
  if (!monthlyBudget) return 0;
  
  // Convertemos a data para o fuso horário de Brasília
  const brasiliaTz = 'America/Sao_Paulo';
  const dateInBrasilia = new Date(formatInTimeZone(date, brasiliaTz, 'yyyy-MM-dd'));
  
  const daysInMonth = getDaysInMonth(dateInBrasilia);
  return monthlyBudget / daysInMonth;
};

// Função para gerar recomendação
export const generateRecommendation = (currentDaily: number, idealDaily: number) => {
  if (!currentDaily || !idealDaily) return null;
  
  const percentDifference = ((currentDaily - idealDaily) / idealDaily) * 100;
  
  if (percentDifference < -10) {
    return `Aumentar o orçamento diário em ${Math.abs(Math.round(percentDifference))}%`;
  } else if (percentDifference > 10) {
    return `Diminuir o orçamento diário em ${Math.round(percentDifference)}%`;
  } else {
    return "Manter o orçamento diário atual";
  }
};

// Função para obter a data atual no fuso horário de Brasília
export const getCurrentDateInBrasiliaTz = () => {
  const brasiliaTz = 'America/Sao_Paulo';
  // Criamos um novo objeto Date para garantir que estamos trabalhando com a data atual
  return new Date(formatInTimeZone(new Date(), brasiliaTz, 'yyyy-MM-dd HH:mm:ss'));
};

// Função para formatar uma data no fuso horário de Brasília
export const formatDateInBrasiliaTz = (date: Date | string, format: string) => {
  const brasiliaTz = 'America/Sao_Paulo';
  return formatInTimeZone(new Date(date), brasiliaTz, format);
};
