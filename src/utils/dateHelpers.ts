import { differenceInDays } from "date-fns";

export const isValidDate = (dateString: string | null | undefined): boolean => {
  if (!dateString) return false;
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
};

/**
 * Parse uma data no formato YYYY-MM-DD para o timezone local
 * Evita problemas de conversão UTC que podem resultar em dia anterior
 */
export const parseLocalDate = (dateString: string): Date => {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
};

export const getNextOccurrence = (dateString: string): Date => {
  // Extrair componentes da data sem conversão de timezone
  const [year, month, day] = dateString.split('-').map(Number);
  const today = new Date();
  
  // Criar data no timezone local (month é 0-indexed)
  let nextOccurrence = new Date(
    today.getFullYear(), 
    month - 1, 
    day
  );
  
  if (nextOccurrence <= today) {
    nextOccurrence = new Date(
      today.getFullYear() + 1,
      month - 1,
      day
    );
  }
  
  return nextOccurrence;
};

export const getDaysUntil = (date: Date): number => {
  const today = new Date();
  return differenceInDays(date, today) + 1;
};

export const getYearsSince = (dateString: string): number => {
  const date = parseLocalDate(dateString);
  const today = new Date();
  let years = today.getFullYear() - date.getFullYear();
  
  // Ajustar se ainda não passou o aniversário neste ano
  const hasPassedThisYear = 
    today.getMonth() > date.getMonth() ||
    (today.getMonth() === date.getMonth() && today.getDate() >= date.getDate());
  
  if (!hasPassedThisYear) {
    years--;
  }
  
  return years;
};

export const getYearsToComplete = (originalDateString: string, nextOccurrence: Date): number => {
  // Extrair ano da string diretamente para evitar problemas de timezone
  const originalYear = parseInt(originalDateString.split('-')[0]);
  return nextOccurrence.getFullYear() - originalYear;
};

export const isDateToday = (date: Date): boolean => {
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
};

export const isDateTomorrow = (date: Date): boolean => {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  return (
    date.getDate() === tomorrow.getDate() &&
    date.getMonth() === tomorrow.getMonth() &&
    date.getFullYear() === tomorrow.getFullYear()
  );
};
