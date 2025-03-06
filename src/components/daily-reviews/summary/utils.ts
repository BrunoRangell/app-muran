
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

    console.log('Data recebida para formatação:', date, typeof date); // Log para depuração

    if (typeof date === 'string') {
      // Para datas do tipo YYYY-MM-DD sem informação de horário,
      // assumimos que é uma data local de Brasília, e definimos como meia-noite
      if (date.match(/^\d{4}-\d{2}-\d{2}$/)) {
        // Data simples do tipo '2025-03-06', sem horário
        console.log('Convertendo data simples para horário de Brasília:', date);
        // Criamos a data especificando que é meia-noite em Brasília (-03:00)
        dateObj = new Date(`${date}T00:00:00-03:00`);
      } else if (date.includes('T') || date.includes('Z') || date.includes('+')) {
        // Data com informação de fuso horário - convertemos para Brasília
        console.log('Convertendo data com timezone para Brasília:', date);
        dateObj = toZonedTime(new Date(date), brasiliaTz);
      } else {
        // Outros formatos de string de data - tentamos converter assumindo local
        console.log('Tentando converter outro formato de data:', date);
        const parsedDate = new Date(date);
        // Se a data for válida, usamos ela; caso contrário, tentamos uma abordagem diferente
        if (!isNaN(parsedDate.getTime())) {
          dateObj = toZonedTime(parsedDate, brasiliaTz);
        } else {
          // Último recurso: tratar como 'YYYY-MM-DD' e definir como meia-noite em Brasília
          console.warn('Formato de data não reconhecido, tentando último recurso:', date);
          dateObj = new Date(`${date}T00:00:00-03:00`);
        }
      }
    } else {
      // Para objetos Date, convertemos diretamente para o fuso de Brasília
      console.log('Convertendo objeto Date para Brasília:', date);
      dateObj = toZonedTime(date, brasiliaTz);
    }

    if (isNaN(dateObj.getTime())) {
      console.error('Data inválida após processamento:', date, dateObj);
      return '';
    }

    const formattedDate = formatInTimeZone(dateObj, brasiliaTz, format, options);
    console.log('Data formatada final:', formattedDate, 'Original:', date);
    return formattedDate;
  } catch (error) {
    console.error('Erro ao formatar data:', error, 'Data original:', date);
    return '';
  }
};
