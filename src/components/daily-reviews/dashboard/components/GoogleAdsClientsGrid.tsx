
import { ClientWithReview } from "../../hooks/types/reviewTypes";
import { GoogleAdsClientReviewCardCompact } from "../GoogleAdsClientReviewCardCompact";

interface GoogleAdsClientsGridProps {
  clientsWithGoogleAdsId: ClientWithReview[];
  clientsWithoutGoogleAdsId: ClientWithReview[];
  processingClients: string[];
  onReviewClient: (clientId: string) => void;
  viewMode: string;
}

export const GoogleAdsClientsGrid = ({
  clientsWithGoogleAdsId,
  clientsWithoutGoogleAdsId,
  processingClients,
  onReviewClient,
  viewMode
}: GoogleAdsClientsGridProps) => {
  return (
    <div className={`grid ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1'} gap-4`}>
      {clientsWithGoogleAdsId.map((client) => (
        <GoogleAdsClientReviewCardCompact
          key={client.id}
          client={client}
          onReviewClient={onReviewClient}
          isProcessing={processingClients.includes(client.id)}
          compact={viewMode === 'table'}
        />
      ))}
      
      {clientsWithoutGoogleAdsId.map((client) => (
        <GoogleAdsClientReviewCardCompact
          key={client.id}
          client={client}
          onReviewClient={onReviewClient}
          isProcessing={processingClients.includes(client.id)}
          compact={viewMode === 'table'}
          inactive
        />
      ))}
    </div>
  );
};
