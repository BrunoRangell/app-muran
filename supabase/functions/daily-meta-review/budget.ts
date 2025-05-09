
// Função para calcular divisão de orçamento diário e gastos
export function calculateDailyBudgetSplit(adAccounts: any) {
  try {
    // Se tivermos um objeto adAccounts com campos diretos
    if (adAccounts.totalDailyBudget !== undefined && adAccounts.totalSpent !== undefined) {
      return {
        totalDailyBudget: Number(adAccounts.totalDailyBudget),
        totalSpent: Number(adAccounts.totalSpent)
      };
    }
    
    // Se tivermos um array de contas
    if (Array.isArray(adAccounts)) {
      let totalDailyBudget = 0;
      let totalSpent = 0;
      
      adAccounts.forEach(account => {
        if (account.totalDailyBudget) {
          totalDailyBudget += Number(account.totalDailyBudget);
        }
        
        if (account.totalSpent) {
          totalSpent += Number(account.totalSpent);
        }
      });
      
      return { totalDailyBudget, totalSpent };
    }
    
    // Caso não tenhamos dados suficientes
    console.error("Dados insuficientes para calcular orçamento");
    return { totalDailyBudget: 0, totalSpent: 0 };
    
  } catch (error) {
    console.error("Erro ao calcular orçamento:", error);
    return { totalDailyBudget: null, totalSpent: null };
  }
}
