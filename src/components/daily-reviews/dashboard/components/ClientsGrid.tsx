
import { ScrollArea } from "@/components/ui/scroll-area";
import { ClientWithReview } from "../../hooks/types/reviewTypes";
import { ClientReviewCardCompact } from "../ClientReviewCardCompact";

interface ClientsGridProps {
  clientsWithMetaId: ClientWithReview[];
  clientsWithoutMetaId: ClientWithReview[];
  processingClients: string[];
  onReviewClient: (clientId: string) => void;
  viewMode: string;
  platform: "meta" | "google";
}

export const ClientsGrid = ({
  clientsWithMetaId,
  clientsWithoutMetaId,
  processingClients,
  onReviewClient,
  viewMode,
  platform
}: ClientsGridProps) => {
  return (
    <ScrollArea className="h-[calc(100vh-350px)]">
      <div className={`grid ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1'} gap-4`}>
        {clientsWithMetaId.map((client) => (
          <ClientReviewCardCompact
            key={client.id}
            client={client}
            onReviewClient={onReviewClient}
            isProcessing={processingClients.includes(client.id)}
            compact={viewMode === 'table'}
            platform={platform}
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
            platform={platform}
          />
        ))}
      </div>
    </ScrollArea>
  );
};
