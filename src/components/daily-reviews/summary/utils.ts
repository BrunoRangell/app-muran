import { format, endOfMonth, differenceInDays } from "date-fns";
import { utcToZonedTime, zonedTimeToUtc } from "date-fns-tz";

/**
 * Retorna o número de dias restantes no mês atual,
 * considerando o fuso horário de Brasília
 */
export function getRemainingDaysInMonth(): number {
  const timeZone = "America/Sao_Paulo"; // Fuso horário de Brasília
  const today = new Date();
  const todayInBrasilia = utcToZonedTime(today, timeZone);
  const endOfCurrentMonth = endOfMonth(todayInBrasilia);
  
  return differenceInDays(endOfCurrentMonth, todayInBrasilia) + 1; // +1 para incluir o dia atual
}

/**
 * Formata uma data usando o fuso horário de Brasília
 */
export function formatDateInBrasiliaTz(date: Date, formatString: string): string {
  const timeZone = "America/Sao_Paulo"; // Fuso horário de Brasília
  const dateInBrasilia = utcToZonedTime(date, timeZone);
  return format(dateInBrasilia, formatString);
}
