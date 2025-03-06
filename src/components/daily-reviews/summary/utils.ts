
import { formatCurrency } from "@/utils/formatters";
import { getDaysInMonth } from 'date-fns';
import { formatInTimeZone, toZonedTime, zonedTimeToUtc } from "date-fns-tz";

// Função para calcular o orçamento diário ideal
export const calculateIdealDailyBudget = (monthlyBudget: number, date: Date) => {
  if (!monthlyBudget) return 0;
  
  // Convertemos a data para o fuso horário de Brasília
  const brasiliaTz = 'America/Sao_Paulo';
  const dateInBrasilia = toZonedTime(date, brasiliaTz);
  
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
  // Convertemos explicitamente para o fuso horário de Brasília
  return toZonedTime(new Date(), brasiliaTz);
};

// Função para formatar uma data no fuso horário de Brasília
export const formatDateInBrasiliaTz = (
  date: Date | string,
  format: string,
  options?: any
) => {
  if (!date) return '';

  try {
    const brasiliaTz = 'America/Sao_Paulo';
    let dateObj: Date;

    if (typeof date === 'string') {
      if (date.includes('T') || date.includes('Z')) {
        // Parse datas com timezone explicitamente
        dateObj = zonedTimeToUtc(date, brasiliaTz);
      } else {
        // Assume datas YYYY-MM-DD como meia-noite em Brasília
        dateObj = zonedTimeToUtc(`${date}T00:00:00`, brasiliaTz);
      }
    } else {
      dateObj = date;
    }

    if (isNaN(dateObj.getTime())) {
      console.error('Data inválida:', date);
      return '';
    }

    return formatInTimeZone(dateObj, brasiliaTz, format, options);
  } catch (error) {
    console.error('Erro ao formatar data:', error, date);
    return '';
  }
};
