
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toZonedTime } from "date-fns-tz";

/**
 * Formata uma data para o timezone de Brasília (America/Sao_Paulo)
 * @param date - A data a ser formatada
 * @param formatString - O formato desejado (padrão date-fns)
 * @param locale - Locale a ser usado (opcional, padrão pt-BR)
 * @returns A data formatada como string
 */
export const formatDateInBrasiliaTz = (
  date: Date | string, 
  formatString: string, 
  locale: any = ptBR
): string => {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  
  // Converte para o timezone de Brasília
  const zonedDate = toZonedTime(dateObj, "America/Sao_Paulo");
  
  // Formata a data usando o locale especificado
  return format(zonedDate, formatString, { locale });
};
