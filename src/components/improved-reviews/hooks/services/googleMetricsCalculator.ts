
import { ProcessedClientData } from "./googleAdsDataProcessor";
import { ClientMetrics } from "../useUnifiedReviewsData";

export function calculateGoogleMetrics(flattenedClients: ProcessedClientData[]): ClientMetrics {
  const clientsWithAccounts = new Set();
  flattenedClients.forEach(client => {
    if (client.hasAccount) {
      clientsWithAccounts.add(client.id);
    }
  });
  
  const totalBudget = flattenedClients.reduce((sum, client) => sum + (client.budget_amount || 0), 0);
  const totalSpent = flattenedClients.reduce((sum, client) => sum + (client.review?.google_total_spent || 0), 0);
  
  return {
    totalClients: clientsWithAccounts.size,
    clientsWithoutAccount: flattenedClients.filter(client => !client.hasAccount).length,
    totalBudget: totalBudget,
    totalSpent: totalSpent,
    spentPercentage: totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0
  };
}
