
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
    totalClientsToAnalyze,
    error // Adicionamos o erro para exibição e diagnóstico
  } = useBatchReview();
  
  // Log de diagnóstico com mais informações
  useEffect(() => {
    console.log("Estado atual dos dados (detalhado):", {
      temClientes: !!clientsWithReviews,
      numeroClientes: clientsWithReviews?.length || 0,
      isLoading,
      lastReviewTime,
      errorMessage: error,
      clientesProc: processingClients.length,
      isBatchAnalyzing
    });
    
    // Se houver erro, mostrar toast com o erro
    if (error) {
      console.error("Erro ao buscar clientes:", error);
      toast({
        title: "Erro ao carregar clientes",
        description: typeof error === 'string' ? error : "Ocorreu um erro ao buscar os clientes. Verifique o console para mais detalhes.",
        variant: "destructive",
      });
    }
    
    // Reiniciar automaticamente a busca após 5 segundos em caso de erro
    if (error && !isLoading) {
      const timer = setTimeout(() => {
        console.log("Tentando buscar clientes novamente após erro...");
        refetchClients();
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [clientsWithReviews, isLoading, lastReviewTime, error, processingClients, isBatchAnalyzing, toast, refetchClients]);
  
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
  }, [queryClient, toast]);
  
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
    console.log("Forçando atualização manual dos clientes...");
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

      {/* Exibir mensagem de erro caso exista */}
      {error && !isLoading && (
        <Card className="p-4 bg-red-50 border-red-200 mb-4">
          <p className="text-red-700 font-medium">Erro ao carregar clientes:</p>
          <p className="text-red-600">{typeof error === 'string' ? error : 'Verifique o console para mais detalhes.'}</p>
          <div className="flex justify-end mt-2">
            <button 
              onClick={handleRefresh} 
              className="text-sm underline text-red-700 hover:text-red-900"
            >
              Tentar novamente
            </button>
          </div>
        </Card>
      )}

      {isLoading ? (
        <LoadingView />
      ) : !clientsWithReviews || (clientsWithReviews.length === 0 && !error) ? (
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
