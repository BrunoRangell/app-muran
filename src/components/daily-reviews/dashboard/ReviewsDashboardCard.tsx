import { useState, useCallback, useEffect } from "react";
import { useBatchReview } from "../hooks/useBatchReview";
import { Card } from "@/components/ui/card";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/ui/use-toast";
import { DashboardHeader } from "./components/DashboardHeader";
import { AnalysisProgress } from "./components/AnalysisProgress";
import { SearchControls } from "./components/SearchControls";
import { FilterOptions } from "./components/FilterOptions";
import { ClientsGrid } from "./components/ClientsGrid";
import { EmptyStateView } from "./components/EmptyStateView";
import { LoadingView } from "./components/LoadingView";
import { filterClientsByName, filterClientsByAdjustment } from "./utils/clientFiltering";
import { sortClients, splitClientsByMetaId } from "./utils/clientSorting";

interface ReviewsDashboardCardProps {
  onViewClientDetails: (clientId: string) => void;
}

export const ReviewsDashboardCard = ({ onViewClientDetails }: ReviewsDashboardCardProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState("grid");
  const [sortBy, setSortBy] = useState("adjustments");
  const [showOnlyAdjustments, setShowOnlyAdjustments] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const { 
    clientsWithReviews, 
    isLoading, 
    processingClients, 
    reviewSingleClient, 
    reviewAllClients,
    lastReviewTime,
    isBatchAnalyzing,
    refetchClients,
    batchProgress,
    totalClientsToAnalyze
  } = useBatchReview();
  
  useEffect(() => {
    console.log("Estado atual dos dados:", {
      temClientes: !!clientsWithReviews,
      numeroClientes: clientsWithReviews?.length || 0,
      isLoading,
      lastReviewTime
    });
    
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
          queryClient.invalidateQueries({ queryKey: ["clients-with-reviews"] });
          toast({
            title: "Orçamentos atualizados",
            description: "O painel foi atualizado com as alterações nos orçamentos personalizados.",
            duration: 3000,
          });
        }
      }
    });

    queryClient.invalidateQueries({ queryKey: ["clients-with-reviews"] });
    
    return () => {
      unsubscribe();
    };
  }, [queryClient, toast, clientsWithReviews, isLoading]);
  
  // Calcular porcentagem de progresso
  const progressPercentage = totalClientsToAnalyze > 0 
    ? Math.round((batchProgress / totalClientsToAnalyze) * 100) 
    : 0;
  
  // Filtragem e ordenação de clientes
  const filteredByName = clientsWithReviews ? filterClientsByName(clientsWithReviews, searchQuery) : [];
  const filteredByAdjustment = filterClientsByAdjustment(filteredByName, showOnlyAdjustments);
  const sortedClients = sortClients(filteredByAdjustment, sortBy);
  const { clientsWithMetaId, clientsWithoutMetaId } = splitClientsByMetaId(sortedClients);

  // Handlers
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  }, []);

  const handleReviewClient = useCallback((clientId: string) => {
    console.log("Iniciando revisão para cliente:", clientId);
    reviewSingleClient(clientId);
  }, [reviewSingleClient]);

  const handleRefresh = useCallback(() => {
    refetchClients();
  }, [refetchClients]);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <DashboardHeader 
          lastReviewTime={lastReviewTime}
          isBatchAnalyzing={isBatchAnalyzing}
          isLoading={isLoading}
          onRefresh={handleRefresh}
          onAnalyzeAll={reviewAllClients}
        />
        
        <AnalysisProgress 
          isBatchAnalyzing={isBatchAnalyzing}
          batchProgress={batchProgress}
          totalClientsToAnalyze={totalClientsToAnalyze}
          progressPercentage={progressPercentage}
        />
        
        <SearchControls 
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          sortBy={sortBy}
          onSortChange={setSortBy}
        />
        
        <FilterOptions 
          showOnlyAdjustments={showOnlyAdjustments}
          onShowOnlyAdjustmentsChange={setShowOnlyAdjustments}
        />
      </div>

      {isLoading ? (
        <LoadingView />
      ) : !clientsWithReviews || sortedClients.length === 0 ? (
        <EmptyStateView />
      ) : (
        <ClientsGrid 
          clientsWithMetaId={clientsWithMetaId}
          clientsWithoutMetaId={clientsWithoutMetaId}
          processingClients={processingClients}
          onReviewClient={handleReviewClient}
          viewMode={viewMode}
        />
      )}
    </div>
  );
};
