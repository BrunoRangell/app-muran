
import { ClientWithReview } from "../../hooks/types/reviewTypes";

/**
 * Divide os clientes entre os que têm Meta ID e os que não têm
 */
export const splitClientsByMetaId = (clients: ClientWithReview[]) => {
  const clientsWithMetaId = clients.filter(client => client.meta_account_id);
  const clientsWithoutMetaId = clients.filter(client => !client.meta_account_id);
  
  return { clientsWithMetaId, clientsWithoutMetaId };
};

/**
 * Ordena clientes por nome (função utilitária, caso seja necessário no futuro)
 */
export const sortClientsByName = (clients: ClientWithReview[]): ClientWithReview[] => {
  return [...clients].sort((a, b) => a.company_name.localeCompare(b.company_name));
};
