
import { formatCurrency } from "@/utils/formatters";
import { getDaysInMonth, endOfMonth, differenceInDays } from 'date-fns';
import { formatInTimeZone, toZonedTime } from "date-fns-tz";
import { ptBR } from 'date-fns/locale'; // Adicionei o locale ptBR para formatação em português

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

// Função para calcular dias restantes no mês
export const getRemainingDaysInMonth = () => {
  const brasiliaTz = 'America/Sao_Paulo';
  const today = toZonedTime(new Date(), brasiliaTz);
  const lastDayOfMonth = endOfMonth(today);
  const lastDayOfMonthInBrasilia = toZonedTime(lastDayOfMonth, brasiliaTz);
  
  // Calcula a diferença em dias e adiciona 1 para incluir o dia atual
  return differenceInDays(lastDayOfMonthInBrasilia, today) + 1;
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
        // Para datas com horário e offset explícito (ex.: '2025-03-06 11:49:04+00')
        dateObj = new Date(date); // Cria o Date com o offset original
        dateObj = toZonedTime(dateObj, brasiliaTz); // Converte para Brasília
      } else {
        // Para datas simples (ex.: '2025-03-06'), assume que é uma data LOCAL em Brasília
        // Define como meia-noite em Brasília (GMT-03:00)
        dateObj = new Date(`${date}T00:00:00-03:00`);
      }
    } else {
      // Para objetos Date, assume que já está no fuso correto ou converte para Brasília
      dateObj = toZonedTime(date, brasiliaTz);
    }

    if (isNaN(dateObj.getTime())) {
      console.error('Data inválida:', date);
      return '';
    }

    // Formata a data no fuso de Brasília com locale em português
    const formattedDate = formatInTimeZone(dateObj, brasiliaTz, format, {
      locale: ptBR, // Locale fixo para português do Brasil
      ...options,   // Permite sobrescrever opções, se necessário
    });

    console.log('Data formatada:', formattedDate); // Log para depuração
    return formattedDate;
  } catch (error) {
    console.error('Erro ao formatar data:', error, date);
    return '';
  }
};

// Exemplo de uso (para referência, pode remover depois):
// console.log(formatDateInBrasiliaTz('2025-03-06', "dd 'de' MMMM 'às' HH:mm")); // "06 de março às 00:00"
// console.log(formatDateInBrasiliaTz('2025-03-06 11:49:04+00', "dd 'de' MMMM 'às' HH:mm")); // "06 de março às 08:49"
