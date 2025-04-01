
import { useCallback } from "react";
import { useGoogleAdsBatchReview } from "../hooks/useGoogleAdsBatchReview";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/ui/use-toast";
import { GoogleAdsClientsGrid } from "./components/GoogleAdsClientsGrid";
import { EmptyStateView } from "./components/EmptyStateView";
import { LoadingView } from "./components/LoadingView";
import { filterClientsByName, filterClientsByAdjustment } from "./utils/clientFiltering";
import { splitClientsByGoogleAdsId } from "./utils/clientSorting";

interface GoogleAdsDashboardCardProps {
  onViewClientDetails: (clientId: string) => void;
  searchQuery: string;
  viewMode: string;
  showOnlyAdjustments: boolean;
}

export const GoogleAdsDashboardCard = ({ 
  onViewClientDetails,
  searchQuery,
  viewMode,
  showOnlyAdjustments
}: GoogleAdsDashboardCardProps) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const { 
    clients, 
    isLoading, 
    processingClients, 
    reviewClient
  } = useGoogleAdsBatchReview();
  
  // Filtrar clientes por nome e necessidade de ajuste
  const filteredByName = clients ? filterClientsByName(clients, searchQuery) : [];
  const filteredByAdjustment = filterClientsByAdjustment(filteredByName, showOnlyAdjustments);
  
  // Ordenar clientes por nome
  const sortedClients = filteredByAdjustment.sort((a, b) => 
    a.company_name.localeCompare(b.company_name)
  );
  
  // Separar clientes com e sem ID do Google Ads
  const { clientsWithGoogleAdsId, clientsWithoutGoogleAdsId } = splitClientsByGoogleAdsId(sortedClients);

  const handleReviewClient = useCallback((clientId: string) => {
    console.log("Iniciando revisão Google Ads para cliente:", clientId);
    reviewClient(clientId);
  }, [reviewClient]);

  return (
    <div className="space-y-6">
      {isLoading ? (
        <LoadingView />
      ) : sortedClients.length === 0 ? (
        <EmptyStateView />
      ) : (
        <GoogleAdsClientsGrid 
          clientsWithGoogleAdsId={clientsWithGoogleAdsId}
          clientsWithoutGoogleAdsId={clientsWithoutGoogleAdsId}
          processingClients={processingClients}
          onReviewClient={handleReviewClient}
          viewMode={viewMode}
        />
      )}
    </div>
  );
};
