import { formatCurrency } from "@/utils/formatters";
import { getDaysInMonth } from 'date-fns';
import { formatInTimeZone, toZonedTime } from "date-fns-tz";

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
        // Converte datas com timezone explícito
        dateObj = toZonedTime(new Date(date), brasiliaTz);
      } else {
        // TRATAMENTO CORRETO PARA DATAS DO BANCO (YYYY-MM-DD):
        // 1. Assume que a data está em Brasília (meia-noite)
        // 2. Converte para UTC+00:00 (para evitar deslocamento)
        const dateInBrasilia = new Date(`${date}T00:00:00-03:00`);
        // 3. Converte para o fuso de Brasília novamente (ajuste final)
        dateObj = toZonedTime(dateInBrasilia, brasiliaTz);
      }
    } else {
      dateObj = toZonedTime(date, brasiliaTz);
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
