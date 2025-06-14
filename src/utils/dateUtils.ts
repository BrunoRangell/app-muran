
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { zonedTimeToUtc, utcToZonedTime } from "date-fns-tz";

/**
 * Formata uma data para o timezone de Brasília (America/Sao_Paulo)
 * @param date - A data a ser formatada
 * @param formatString - O formato desejado (padrão date-fns)
 * @returns A data formatada como string
 */
export const formatDateInBrasiliaTz = (date: Date | string, formatString: string): string => {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  
  // Converte para o timezone de Brasília
  const zonedDate = utcToZonedTime(dateObj, "America/Sao_Paulo");
  
  // Formata a data usando o locale brasileiro
  return format(zonedDate, formatString, { locale: ptBR });
};
