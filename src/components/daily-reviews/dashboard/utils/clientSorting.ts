
import { ClientWithReview } from "../../hooks/types/reviewTypes";

/**
 * Ordena clientes por nome
 */
export const sortClientsByName = (clients: ClientWithReview[]): ClientWithReview[] => {
  return [...clients].sort((a, b) => a.company_name.localeCompare(b.company_name));
};
