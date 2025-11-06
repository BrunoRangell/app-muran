import { parseISO, differenceInDays } from "date-fns";

export const isValidDate = (dateString: string | null | undefined): boolean => {
  if (!dateString) return false;
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
};

export const getNextOccurrence = (dateString: string): Date => {
  const date = parseISO(dateString);
  const today = new Date();
  let nextOccurrence = new Date(
    today.getFullYear(), 
    date.getMonth(), 
    date.getDate()
  );
  
  if (nextOccurrence <= today) {
    nextOccurrence = new Date(
      today.getFullYear() + 1,
      date.getMonth(),
      date.getDate()
    );
  }
  
  return nextOccurrence;
};

export const getDaysUntil = (date: Date): number => {
  const today = new Date();
  return differenceInDays(date, today) + 1;
};

export const getYearsSince = (dateString: string): number => {
  const date = parseISO(dateString);
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
  const originalDate = parseISO(originalDateString);
  return nextOccurrence.getFullYear() - originalDate.getFullYear();
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
