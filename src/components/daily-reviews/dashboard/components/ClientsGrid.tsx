
import { ClientReviewCard } from "../ClientReviewCard";

interface ClientsGridProps {
  clientsWithMetaId: any[];
  clientsWithoutMetaId: any[];
  processingClients: string[];
  onReviewClient: (clientId: string) => void;
  viewMode: string;
  platform?: 'meta' | 'google';
}

export const ClientsGrid = ({
  clientsWithMetaId,
  clientsWithoutMetaId,
  processingClients,
  onReviewClient,
  viewMode,
  platform = 'meta'
}: ClientsGridProps) => {
  const accountIdField = platform === 'meta' ? 'meta_account_id' : 'google_account_id';
  
  // Filtra clientes baseado no campo apropriado da plataforma
  const clientsWithAccountId = clientsWithMetaId.filter(client => client[accountIdField]);
  const clientsWithoutAccountId = [
    ...clientsWithMetaId.filter(client => !client[accountIdField]),
    ...clientsWithoutMetaId
  ];

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {clientsWithAccountId.map(client => (
          <ClientReviewCard
            key={client.id}
            client={client}
            onReviewClient={onReviewClient}
            isProcessing={processingClients.includes(client.id)}
            platform={platform}
          />
        ))}
      </div>

      {clientsWithoutAccountId.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-medium mb-3 text-gray-600">
            Clientes sem configuração de {platform === 'meta' ? 'Meta Ads' : 'Google Ads'} ({clientsWithoutAccountId.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 opacity-60">
            {clientsWithoutAccountId.map(client => (
              <ClientReviewCard
                key={client.id}
                client={client}
                onReviewClient={onReviewClient}
                isProcessing={processingClients.includes(client.id)}
                platform={platform}
              />
            ))}
          </div>
        </div>
      )}
    </>
  );
};
