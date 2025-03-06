import { formatCurrency } from "@/utils/formatters";
import { getDaysInMonth } from 'date-fns';
import { formatInTimeZone, toZonedTime } from "date-fns-tz";

// Função para calcular o orçamento diário ideal
export const calculateIdealDailyBudget = (monthlyBudget: number, date: Date) => {
  if (!monthlyBudget) return 0;

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

    console.log('Data recebida:', date); // Log para depuração

    if (typeof date === 'string') {
      if (date.includes('T') || date.includes('Z') || date.includes('+')) {
        // Para datas com horário e offset (ex.: '2025-03-06 11:49:04+00')
        dateObj = toZonedTime(new Date(date), brasiliaTz);
      } else {
        // Para datas simples (ex.: '2025-03-06'), assume que é uma data LOCAL em Brasília
        // Construímos como meia-noite em Brasília e ajustamos para UTC corretamente
        const dateInBrasilia = new Date(`${date}T00:00:00-03:00`);
        dateObj = dateInBrasilia; // Não precisamos de toZonedTime aqui, já está correto
      }
    } else {
      // Para objetos Date, converte diretamente para Brasília
      dateObj = toZonedTime(date, brasiliaTz);
    }

    if (isNaN(dateObj.getTime())) {
      console.error('Data inválida:', date);
      return '';
    }

    const formattedDate = formatInTimeZone(dateObj, brasiliaTz, format, options);
    console.log('Data formatada:', formattedDate); // Log para depuração
    return formattedDate;
  } catch (error) {
    console.error('Erro ao formatar data:', error, date);
    return '';
  }
};
