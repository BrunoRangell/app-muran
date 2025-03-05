
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
export const formatDateInBrasiliaTz = (date: Date | string, format: string, options?: any) => {
  if (!date) return '';
  
  try {
    const brasiliaTz = 'America/Sao_Paulo';
    
    // Garante que estamos trabalhando com um objeto Date
    let dateObj: Date;
    if (typeof date === 'string') {
      // Se a data já inclui informação de fuso horário (tem 'T' ou 'Z')
      if (date.includes('T') || date.includes('Z')) {
        dateObj = new Date(date);
      } else {
        // Se é apenas uma data (YYYY-MM-DD), adicionamos um horário padrão
        dateObj = new Date(`${date}T12:00:00Z`);
      }
    } else {
      dateObj = date;
    }
    
    // Verifica se a data é válida
    if (isNaN(dateObj.getTime())) {
      console.error('Data inválida:', date);
      return '';
    }
    
    // Primeiro convertemos a data para o fuso horário de Brasília
    const zonedDate = toZonedTime(dateObj, brasiliaTz);
    
    // Depois formatamos usando a data já convertida para o fuso horário correto
    return formatInTimeZone(zonedDate, brasiliaTz, format);
  } catch (error) {
    console.error('Erro ao formatar data:', error, date);
    return '';
  }
};
