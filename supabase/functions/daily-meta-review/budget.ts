
/**
 * Função para calcular o orçamento diário ideal com base no orçamento mensal e no gasto atual
 */
export function calculateIdealDailyBudget(monthlyBudget: number, currentSpent: number): number {
  const today = new Date();
  const currentDay = today.getDate();
  
  // Obter o último dia do mês atual
  const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  
  // Calcular dias restantes no mês (incluindo hoje)
  const remainingDays = lastDayOfMonth - currentDay + 1;
  
  // Calcular orçamento restante
  const remainingBudget = monthlyBudget - currentSpent;
  
  if (remainingDays <= 0 || remainingBudget <= 0) {
    // Retornar zero ou um valor mínimo se não houver dias restantes ou orçamento
    return 0;
  }
  
  // Calcular orçamento diário ideal
  const idealDailyBudget = remainingBudget / remainingDays;
  
  // Arredondar para duas casas decimais
  return Math.round(idealDailyBudget * 100) / 100;
}
