
import { ScrollArea } from "@/components/ui/scroll-area";
import { ClientWithReview } from "../../hooks/types/reviewTypes";
import { ClientReviewCardCompact } from "../ClientReviewCardCompact";

interface ClientsGridProps {
  clientsWithMetaId: ClientWithReview[];
  clientsWithoutMetaId: ClientWithReview[];
  processingClients: string[];
  onReviewClient: (clientId: string) => void;
  viewMode: string;
}

export const ClientsGrid = ({
  clientsWithMetaId,
  clientsWithoutMetaId,
  processingClients,
  onReviewClient,
  viewMode
}: ClientsGridProps) => {
  return (
    <ScrollArea className="h-[calc(100vh-350px)]">
      <div className={`grid ${viewMode === 'grid' ? 'grid-cols-1 lg:grid-cols-2 gap-4' : 'grid-cols-1 divide-y'}`}>
        {clientsWithMetaId.map((client) => (
          <ClientReviewCardCompact
            key={client.id}
            client={client}
            onReviewClient={onReviewClient}
            isProcessing={processingClients.includes(client.id)}
            compact={viewMode === 'table'}
          />
        ))}
        
        {clientsWithoutMetaId.map((client) => (
          <ClientReviewCardCompact
            key={client.id}
            client={client}
            onReviewClient={onReviewClient}
            isProcessing={processingClients.includes(client.id)}
            compact={viewMode === 'table'}
            inactive
          />
        ))}
      </div>
    </ScrollArea>
  );
};
