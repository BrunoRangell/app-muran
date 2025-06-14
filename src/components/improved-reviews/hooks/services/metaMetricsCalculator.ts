
import { ProcessedMetaClientData } from "./metaDataProcessor";
import { ClientMetrics } from "../useUnifiedReviewsData";

export function calculateMetaMetrics(flattenedClients: ProcessedMetaClientData[]): ClientMetrics {
  const clientsWithAccounts = new Set();
  const clientsWithoutAccount = flattenedClients.filter(client => !client.hasAccount).length;
  
  flattenedClients.forEach(client => {
    if (client.hasAccount) {
      clientsWithAccounts.add(client.id);
    }
  });
  
  const totalBudget = flattenedClients.reduce((sum, client) => sum + (client.budget_amount || 0), 0);
  const totalSpent = flattenedClients.reduce((sum, client) => sum + (client.review?.meta_total_spent || 0), 0);
  
  return {
    totalClients: clientsWithAccounts.size,
    clientsWithoutAccount: clientsWithoutAccount,
    totalBudget: totalBudget,
    totalSpent: totalSpent,
    spentPercentage: totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0
  };
}
