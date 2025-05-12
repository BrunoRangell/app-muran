
import { format, addDays, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';

/**
 * Obtém a data atual no fuso horário de Brasília
 */
export function getCurrentDateInBrasiliaTz() {
  // Cria um objeto Date com a data atual
  const now = new Date();
  
  // Ajusta para o fuso horário de Brasília (UTC-3)
  const brasiliaOffset = -3;
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  return new Date(utc + (3600000 * brasiliaOffset));
}

/**
 * Formata uma data no fuso horário de Brasília
 */
export function formatDateInBrasiliaTz(date: string | Date, formatStr = 'dd/MM/yyyy') {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (!isValid(dateObj)) {
    return 'Data inválida';
  }
  
  return format(dateObj, formatStr, { locale: ptBR });
}

/**
 * Calcula o número de dias restantes no mês atual
 */
export function getRemainingDaysInMonth() {
  const today = getCurrentDateInBrasiliaTz();
  const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  
  // +1 para incluir o dia atual
  return lastDayOfMonth.getDate() - today.getDate() + 1;
}

/**
 * Calcula o primeiro e último dia do mês atual
 */
export function getCurrentMonthDateRange() {
  const today = getCurrentDateInBrasiliaTz();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  
  return {
    start: firstDayOfMonth,
    end: lastDayOfMonth
  };
}

/**
 * Adiciona dias a uma data e retorna em formato ISO
 */
export function addDaysToDate(date: Date, days: number) {
  const newDate = addDays(date, days);
  return newDate.toISOString().split('T')[0];
}
