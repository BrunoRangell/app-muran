
import { useState, useCallback, useEffect } from "react";
import { useGoogleAdsBatchReview } from "../hooks/useGoogleAdsBatchReview";
import { Card } from "@/components/ui/card";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/ui/use-toast";
import { GoogleAdsDashboardHeader } from "./components/GoogleAdsDashboardHeader";
import { AnalysisProgress } from "./components/AnalysisProgress";
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
    reviewClient, 
    reviewAllClients,
    isReviewingBatch,
    lastBatchReviewDate
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
  
  // Calcular variáveis de progresso com base nas informações disponíveis
  const batchProgress = processingClients ? processingClients.length : 0;
  const totalClientsToAnalyze = clients.filter(c => c.google_account_id).length;
  const progressPercentage = totalClientsToAnalyze > 0 
    ? Math.round((batchProgress / totalClientsToAnalyze) * 100) 
    : 0;
  
  const filteredByName = clients ? filterClientsByName(clients, searchQuery) : [];
  const filteredByAdjustment = filterClientsByAdjustment(filteredByName, showOnlyAdjustments);
  
  const sortedClients = filteredByAdjustment.sort((a, b) => 
    a.company_name.localeCompare(b.company_name)
  );
  
  const { clientsWithGoogleAdsId, clientsWithoutGoogleAdsId } = splitClientsByGoogleAdsId(sortedClients);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  }, []);

  const handleReviewClient = useCallback((clientId: string) => {
    console.log("Iniciando revisão Google Ads para cliente:", clientId);
    reviewClient(clientId);
  }, [reviewClient]);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <GoogleAdsDashboardHeader 
          lastBatchReviewTime={lastBatchReviewDate ? new Date(lastBatchReviewDate) : null}
          isBatchAnalyzing={isReviewingBatch}
          isLoading={isLoading}
          onAnalyzeAll={reviewAllClients}
        />
        
        <AnalysisProgress 
          isBatchAnalyzing={isReviewingBatch}
          batchProgress={processingClients.length}
          totalClientsToAnalyze={totalClientsToAnalyze}
          progressPercentage={progressPercentage}
        />
        
        <div className="flex flex-col md:flex-row items-center gap-4 mb-3">
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
