
import { format, endOfMonth, differenceInDays, getDaysInMonth } from "date-fns";
import { toZonedTime, fromZonedTime } from "date-fns-tz";

// Timezone de Brasília
const BRASILIA_TIMEZONE = "America/Sao_Paulo";

/**
 * Retorna o número de dias restantes no mês atual,
 * considerando o fuso horário de Brasília
 */
export function getRemainingDaysInMonth(): number {
  const today = getCurrentDateInBrasiliaTz();
  const endOfCurrentMonth = endOfMonth(today);
  
  return differenceInDays(endOfCurrentMonth, today) + 1; // +1 para incluir o dia atual
}

/**
 * Formata uma data usando o fuso horário de Brasília
 */
export function formatDateInBrasiliaTz(date: Date | string, formatString: string): string {
  // Converter string para objeto Date se necessário
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const dateInBrasilia = toZonedTime(dateObj, BRASILIA_TIMEZONE);
  return format(dateInBrasilia, formatString);
}

/**
 * Retorna a data atual no fuso horário de Brasília
 */
export function getCurrentDateInBrasiliaTz(): Date {
  const now = new Date();
  return toZonedTime(now, BRASILIA_TIMEZONE);
}

/**
 * Calcula o orçamento diário ideal com base no orçamento mensal e data atual
 */
export function calculateIdealDailyBudget(monthlyBudget: number, currentDate: Date): number {
  // Obter a data atual em Brasília
  const today = toZonedTime(currentDate, BRASILIA_TIMEZONE);
  
  // Obter dias no mês atual
  const daysInMonth = getDaysInMonth(today);
  const currentDay = today.getDate();
  
  // Calcular dias restantes (incluindo o dia atual)
  const remainingDays = daysInMonth - currentDay + 1;
  
  // Calcular quanto já deveria ter sido gasto até agora (dias passados)
  const daysPassed = currentDay - 1; // -1 para não contar o dia atual
  const idealDailyAmount = monthlyBudget / daysInMonth;
  const idealSpentSoFar = idealDailyAmount * daysPassed;
  
  // Orçamento restante
  const remainingBudget = monthlyBudget - idealSpentSoFar;
  
  // Orçamento diário ideal para os dias restantes
  return remainingDays > 0 ? remainingBudget / remainingDays : monthlyBudget;
}

/**
 * Gera uma recomendação com base no orçamento diário atual e ideal
 */
export function generateRecommendation(currentBudget: number, idealBudget: number): string | null {
  const diff = idealBudget - currentBudget;
  const percentDiff = currentBudget > 0 ? (Math.abs(diff) / currentBudget) * 100 : 100;
  
  // Se a diferença for menor que 5% ou R$5,00, não recomendamos mudança
  if (Math.abs(diff) < 5 || percentDiff < 5) {
    return "Manter orçamento atual";
  }
  
  if (diff > 0) {
    return `Aumentar orçamento em R$${diff.toFixed(2)}`;
  } else {
    return `Diminuir orçamento em R$${Math.abs(diff).toFixed(2)}`;
  }
}
