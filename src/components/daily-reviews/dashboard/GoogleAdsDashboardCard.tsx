
import { useCallback } from "react";
import { useGoogleAdsBatchReview } from "../hooks/useGoogleAdsBatchReview";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
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
    reviewClient,
    testGoogleAdsTokens,
    isTokenVerifying
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

  const handleVerifyTokens = useCallback(async () => {
    const result = await testGoogleAdsTokens();
    if (!result) {
      toast({
        title: "Configuração necessária",
        description: "Acesse a página de configurações para verificar os tokens do Google Ads.",
      });
    }
  }, [testGoogleAdsTokens, toast]);

  if (isLoading) {
    return <LoadingView />;
  }
  
  if (sortedClients.length === 0) {
    return <EmptyStateView />;
  }

  return (
    <GoogleAdsClientsGrid 
      clientsWithGoogleAdsId={clientsWithGoogleAdsId}
      clientsWithoutGoogleAdsId={clientsWithoutGoogleAdsId}
      processingClients={processingClients}
      onReviewClient={handleReviewClient}
      viewMode={viewMode}
      onVerifyTokens={handleVerifyTokens}
      isTokenVerifying={isTokenVerifying}
    />
  );
};
