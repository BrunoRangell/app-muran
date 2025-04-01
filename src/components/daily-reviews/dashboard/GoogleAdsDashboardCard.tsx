
import { useState, useCallback, useEffect } from "react";
import { useGoogleAdsBatchReview } from "../hooks/useGoogleAdsBatchReview";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/ui/use-toast";
import { SearchControls } from "./components/SearchControls";
import { FilterOptions } from "./components/FilterOptions";
import { GoogleAdsClientsGrid } from "./components/GoogleAdsClientsGrid";
import { EmptyStateView } from "./components/EmptyStateView";
import { LoadingView } from "./components/LoadingView";
import { filterClientsByName, filterClientsByAdjustment } from "./utils/clientFiltering";
import { splitClientsByGoogleAdsId } from "./utils/clientSorting";

interface GoogleAdsDashboardCardProps {
  onViewClientDetails: (clientId: string) => void;
}

export const GoogleAdsDashboardCard = ({ onViewClientDetails }: GoogleAdsDashboardCardProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState("grid");
  const [showOnlyAdjustments, setShowOnlyAdjustments] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const { 
    clients, 
    isLoading, 
    processingClients, 
    reviewClient
  } = useGoogleAdsBatchReview();
  
  useEffect(() => {
    const unsubscribe = queryClient.getQueryCache().subscribe(event => {
      if (
        event.type === 'updated' || 
        event.type === 'added' || 
        event.type === 'removed'
      ) {
        if (
          (event.query.queryKey && 
           Array.isArray(event.query.queryKey) &&
           event.query.queryKey[0] === "clients-with-custom-budgets") ||
          (Array.isArray(event.query.queryKey) && 
           event.query.queryKey.length > 0 &&
           Array.isArray(event.query.queryKey[0]) && 
           event.query.queryKey[0].includes && 
           event.query.queryKey[0].includes("custom-budget"))
        ) {
          console.log("Mudança detectada em orçamentos personalizados, atualizando...");
          queryClient.invalidateQueries({ queryKey: ["google-ads-clients-with-reviews"] });
          toast({
            title: "Orçamentos atualizados",
            description: "O painel foi atualizado com as alterações nos orçamentos personalizados.",
            duration: 3000,
          });
        }
      }
    });

    queryClient.invalidateQueries({ queryKey: ["google-ads-clients-with-reviews"] });
    
    return () => {
      unsubscribe();
    };
  }, [queryClient, toast]);
  
  const filteredByName = clients ? filterClientsByName(clients, searchQuery) : [];
  const filteredByAdjustment = filterClientsByAdjustment(filteredByName, showOnlyAdjustments);
  
  const sortedClients = filteredByAdjustment.sort((a, b) => 
    a.company_name.localeCompare(b.company_name)
  );
  
  const { clientsWithGoogleAdsId, clientsWithoutGoogleAdsId } = splitClientsByGoogleAdsId(sortedClients);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  }, []);

  const handleViewModeChange = useCallback((value: string) => {
    setViewMode(value);
  }, []);

  const handleReviewClient = useCallback((clientId: string) => {
    console.log("Iniciando revisão Google Ads para cliente:", clientId);
    reviewClient(clientId);
  }, [reviewClient]);

  return (
    <div className="space-y-6">
      <SearchControls
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        viewMode={viewMode}
        onViewModeChange={handleViewModeChange}
      />
      
      <FilterOptions 
        showOnlyAdjustments={showOnlyAdjustments}
        onShowOnlyAdjustmentsChange={setShowOnlyAdjustments}
      />

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
