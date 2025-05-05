
// Calcula orçamento diário ideal
export function calculateIdealDailyBudget(budgetAmount: number, totalSpent: number): number {
  const currentDate = new Date();
  const lastDayOfMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth() + 1,
    0
  );
  const remainingDays = lastDayOfMonth.getDate() - currentDate.getDate() + 1;

  const idealDailyBudget = remainingDays > 0
    ? (budgetAmount - totalSpent) / remainingDays
    : 0;

  // Arredondar para duas casas decimais
  return Math.round(idealDailyBudget * 100) / 100;
}
