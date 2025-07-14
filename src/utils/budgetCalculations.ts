
import { differenceInDays, parseISO, isAfter, isBefore, startOfDay } from "date-fns";

/**
 * Calcula os dias restantes para um orçamento, considerando se é personalizado ou mensal
 */
export function calculateRemainingDays(
  customBudgetEndDate?: string,
  customBudgetStartDate?: string
): number {
  const today = startOfDay(new Date());
  
  // Se há orçamento personalizado, usar o período dele
  if (customBudgetEndDate && customBudgetStartDate) {
    const endDate = startOfDay(parseISO(customBudgetEndDate));
    const startDate = startOfDay(parseISO(customBudgetStartDate));
    
    // Se hoje é antes da data de início, calcular desde o início
    if (isBefore(today, startDate)) {
      return differenceInDays(endDate, startDate) + 1;
    }
    
    // Se hoje é depois da data final, não há dias restantes
    if (isAfter(today, endDate)) {
      return 0;
    }
    
    // Calcular dias restantes desde hoje até o final
    return differenceInDays(endDate, today) + 1;
  }
  
  // Lógica tradicional para orçamento mensal
  const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  return lastDayOfMonth.getDate() - today.getDate() + 1;
}

/**
 * Calcula o orçamento diário ideal baseado no tipo de orçamento
 */
export function calculateIdealDailyBudget(
  totalBudget: number,
  totalSpent: number,
  customBudgetEndDate?: string,
  customBudgetStartDate?: string
): number {
  const remainingDays = calculateRemainingDays(customBudgetEndDate, customBudgetStartDate);
  const remainingBudget = Math.max(0, totalBudget - totalSpent);
  
  if (remainingDays <= 0) {
    return 0;
  }
  
  return Math.round((remainingBudget / remainingDays) * 100) / 100;
}

/**
 * Determina se um orçamento personalizado está ativo hoje
 */
export function isCustomBudgetActive(startDate?: string, endDate?: string): boolean {
  if (!startDate || !endDate) return false;
  
  const today = startOfDay(new Date());
  const start = startOfDay(parseISO(startDate));
  const end = startOfDay(parseISO(endDate));
  
  return !isBefore(today, start) && !isAfter(today, end);
}
