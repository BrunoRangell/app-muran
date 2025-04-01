
import { ClientWithReview } from "../../hooks/types/reviewTypes";
import { GoogleAdsClientReviewCardCompact } from "../GoogleAdsClientReviewCardCompact";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

interface GoogleAdsClientsGridProps {
  clientsWithGoogleAdsId: ClientWithReview[];
  clientsWithoutGoogleAdsId: ClientWithReview[];
  processingClients: string[];
  onReviewClient: (clientId: string) => void;
  viewMode: string;
  onVerifyTokens: () => void;
  isTokenVerifying: boolean;
}

export const GoogleAdsClientsGrid = ({
  clientsWithGoogleAdsId,
  clientsWithoutGoogleAdsId,
  processingClients,
  onReviewClient,
  viewMode,
  onVerifyTokens,
  isTokenVerifying
}: GoogleAdsClientsGridProps) => {
  return (
    <>
      <div className="mb-4 flex justify-between items-center">
        <div className="flex gap-2">
          <Button 
            onClick={onVerifyTokens} 
            disabled={isTokenVerifying}
            variant="outline" 
            size="sm"
            className="text-[#ff6e00] hover:text-[#ff6e00] border-[#ff6e00] hover:border-[#ff6e00] hover:bg-orange-50"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isTokenVerifying ? 'animate-spin' : ''}`} />
            {isTokenVerifying ? 'Verificando tokens...' : 'Verificar/Renovar tokens'}
          </Button>
        </div>
      </div>
      
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
    </>
  );
};
