import { useState, useCallback, useEffect } from "react";
import { useBatchReview } from "../hooks/useBatchReview";
import { Card } from "@/components/ui/card";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { DashboardHeader } from "./components/DashboardHeader";
import { AnalysisProgress } from "./components/AnalysisProgress";
import { SearchControls } from "./components/SearchControls";
import { FilterOptions } from "./components/FilterOptions";
import { ClientsGrid } from "./components/ClientsGrid";
import { EmptyStateView } from "./components/EmptyStateView";
import { LoadingView } from "./components/LoadingView";
import { filterClientsByName, filterClientsByAdjustment } from "./utils/clientFiltering";
import { splitClientsByMetaId } from "./utils/clientSorting";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AutoReviewSettings } from "./components/AutoReviewSettings";

interface ReviewsDashboardCardProps {
  onViewClientDetails: (clientId: string) => void;
}

export const ReviewsDashboardCard = ({ onViewClientDetails }: ReviewsDashboardCardProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState("grid");
  const [showOnlyAdjustments, setShowOnlyAdjustments] = useState(false);
  const [activeTab, setActiveTab] = useState("clientes");
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const { 
    clientsWithReviews, 
    isLoading, 
    processingClients, 
    reviewSingleClient, 
    reviewAllClients,
    lastBatchReviewTime,
    isBatchAnalyzing,
    batchProgress,
    totalClientsToAnalyze,
    refetchClients
  } = useBatchReview();
  
  useEffect(() => {
    if (!isBatchAnalyzing && batchProgress > 0) {
      queryClient.invalidateQueries({ queryKey: ["clients-with-reviews"] });
    }
  }, [isBatchAnalyzing, batchProgress, queryClient]);
  
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
    
    return () => {
      unsubscribe();
    };
  }, [queryClient, toast]);
  
  const progressPercentage = totalClientsToAnalyze > 0 
    ? Math.round((batchProgress / totalClientsToAnalyze) * 100) 
    : 0;
  
  const filteredByName = clientsWithReviews ? filterClientsByName(clientsWithReviews, searchQuery) : [];
  const filteredByAdjustment = filterClientsByAdjustment(filteredByName, showOnlyAdjustments);
  
  const sortedClients = filteredByAdjustment.sort((a, b) => 
    a.company_name.localeCompare(b.company_name)
  );
  
  const { clientsWithMetaId, clientsWithoutMetaId } = splitClientsByMetaId(sortedClients);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  }, []);

  const handleReviewClient = useCallback((clientId: string) => {
    console.log("Iniciando revisão para cliente:", clientId);
    reviewSingleClient(clientId).then(() => {
      queryClient.invalidateQueries({ queryKey: ["clients-with-reviews"] });
    });
  }, [reviewSingleClient, queryClient]);

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="clientes">Clientes</TabsTrigger>
          <TabsTrigger value="revisao-automatica">Revisão Automática</TabsTrigger>
        </TabsList>
        
        <TabsContent value="clientes" className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <DashboardHeader 
              lastBatchReviewTime={lastBatchReviewTime}
              isBatchAnalyzing={isBatchAnalyzing}
              isLoading={isLoading}
              onAnalyzeAll={reviewAllClients}
            />
            
            <div className="lg:col-span-2">
              <AnalysisProgress 
                isBatchAnalyzing={isBatchAnalyzing}
                batchProgress={batchProgress}
                totalClientsToAnalyze={totalClientsToAnalyze}
                progressPercentage={progressPercentage}
              />
            </div>
            
            <div className="flex flex-col md:flex-row items-center gap-4 mb-3 mt-4">
              <div className="relative flex-1 w-full">
                <input
                  type="text"
                  placeholder="Buscar cliente por nome..."
                  className="pl-10 w-full h-10 px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-muran-primary focus:border-transparent"
                  value={searchQuery}
                  onChange={handleSearchChange}
                />
                <svg 
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" 
                  width="18" 
                  height="18" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.3-4.3" />
                </svg>
              </div>
              
              <div className="flex gap-2 items-center">
                <select 
                  className="h-10 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-muran-primary focus:border-transparent"
                  value={viewMode}
                  onChange={(e) => setViewMode(e.target.value)}
                >
                  <option value="grid">Grade</option>
                  <option value="table">Tabela</option>
                </select>
              </div>
            </div>
            
            <FilterOptions 
              showOnlyAdjustments={showOnlyAdjustments}
              onShowOnlyAdjustmentsChange={setShowOnlyAdjustments}
            />
          </div>

          {isLoading ? (
            <LoadingView />
          ) : sortedClients.length === 0 ? (
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
        </TabsContent>
        
        <TabsContent value="revisao-automatica">
          <AutoReviewSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}
