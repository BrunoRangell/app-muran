
import { ClientWithReview } from "../../hooks/types/reviewTypes";
import { ClientReviewCard } from "../ClientReviewCard";
import { ClientReviewCardCompact } from "../ClientReviewCardCompact";
import { ClientAltCard } from "../ClientAltCard";

interface ClientsGridProps {
  clientsWithMetaId: ClientWithReview[];
  clientsWithoutMetaId: ClientWithReview[];
  processingClients: string[];
  onReviewClient: (clientId: string) => void;
  viewMode: string;
  accountIdField?: string;
}

export const ClientsGrid = ({ 
  clientsWithMetaId, 
  clientsWithoutMetaId, 
  processingClients, 
  onReviewClient,
  viewMode,
  accountIdField = "meta_account_id"
}: ClientsGridProps) => {
  const hasClients = clientsWithMetaId.length > 0;
  const hasClientsWithoutMetaId = clientsWithoutMetaId.length > 0;
  
  return (
    <div className="space-y-8">
      {hasClients && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-muran-dark">
            Clientes com conta configurada ({clientsWithMetaId.length})
          </h3>
          
          {viewMode === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {clientsWithMetaId.map(client => (
                <ClientReviewCard
                  key={client.id}
                  client={client}
                  onViewDetails={() => {}}
                  onReviewClient={onReviewClient}
                  isProcessing={processingClients.includes(client.id)}
                  accountIdField={accountIdField}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {clientsWithMetaId.map(client => (
                <ClientReviewCardCompact
                  key={client.id}
                  client={client}
                  onViewDetails={() => {}}
                  onReviewClient={onReviewClient}
                  isProcessing={processingClients.includes(client.id)}
                  accountIdField={accountIdField}
                />
              ))}
            </div>
          )}
        </div>
      )}
      
      {hasClientsWithoutMetaId && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-500">
            Clientes sem conta configurada ({clientsWithoutMetaId.length})
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {clientsWithoutMetaId.map(client => (
              <ClientAltCard
                key={client.id}
                client={client}
                onViewDetails={() => {}}
                accountIdField={accountIdField}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
