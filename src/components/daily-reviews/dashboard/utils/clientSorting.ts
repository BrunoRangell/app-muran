
import { ClientWithReview } from "../../hooks/types/reviewTypes";

/**
 * Ordena clientes por nome
 */
export const sortClientsByName = (clients: ClientWithReview[]): ClientWithReview[] => {
  return [...clients].sort((a, b) => a.company_name.localeCompare(b.company_name));
};

/**
 * Divide os clientes em dois grupos: com Meta ID e sem Meta ID
 */
export const splitClientsByMetaId = (clients: ClientWithReview[]) => {
  const clientsWithMetaId = clients.filter(client => client.meta_account_id);
  const clientsWithoutMetaId = clients.filter(client => !client.meta_account_id);
  
  return {
    clientsWithMetaId,
    clientsWithoutMetaId
  };
};

/**
 * Divide os clientes em dois grupos: com e sem ID Google Ads
 */
export const splitClientsByGoogleAdsId = (clients: ClientWithReview[]): {
  clientsWithGoogleAdsId: ClientWithReview[];
  clientsWithoutGoogleAdsId: ClientWithReview[];
} => {
  return {
    clientsWithGoogleAdsId: clients.filter(client => client.google_account_id),
    clientsWithoutGoogleAdsId: clients.filter(client => !client.google_account_id)
  };
};
