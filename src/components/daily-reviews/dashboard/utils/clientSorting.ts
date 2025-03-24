
import { ClientWithReview } from "../../hooks/types/reviewTypes";

export const sortClientsByName = (clients: ClientWithReview[]) => {
  return [...clients].sort((a, b) => 
    a.company_name.localeCompare(b.company_name)
  );
};

export const splitClientsByMetaId = (
  clients: ClientWithReview[], 
  platform: "meta" | "google" = "meta"
) => {
  // Determinar o campo de ID de conta com base na plataforma
  const accountIdField = platform === "meta" ? "meta_account_id" : "google_account_id";

  const clientsWithMetaId = clients.filter(client => client[accountIdField]);
  const clientsWithoutMetaId = clients.filter(client => !client[accountIdField]);

  return {
    clientsWithMetaId,
    clientsWithoutMetaId
  };
};
