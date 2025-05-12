
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ClientCard } from "../components/ClientCard";
import { useClientReviews } from "../hooks/useClientReviews";
import { useBatchOperations } from "../hooks/useBatchOperations";
import { ClientsList } from "../components/ClientsList";
import { FilterBar } from "../components/FilterBar";

interface MetaAdsTabProps {
  onRefreshCompleted?: () => void;
  isActive: boolean;
}

export function MetaAdsTab({ onRefreshCompleted, isActive }: MetaAdsTabProps) {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  
  const {
    clients,
    isLoading,
    refetch,
    searchQuery,
    setSearchQuery,
    showOnlyAdjustments,
    setShowOnlyAdjustments,
    showOnlyWithAccounts,
    setShowOnlyWithAccounts
  } = useClientReviews('meta');
  
  const { 
    batchAnalyze,
    isProcessingBatch,
    processingIds,
    analyzeClient
  } = useBatchOperations('meta', () => {
    refetch();
    if (onRefreshCompleted) onRefreshCompleted();
  });
  
  const handleViewDetails = (clientId: string) => {
    navigate(`/cliente/${clientId}`);
  };
  
  // Se não está ativa, não renderizar o conteúdo completo
  if (!isActive) {
    return <div className="hidden">Aba Meta Ads</div>;
  }
  
  return (
    <div className="space-y-6">
      {/* Barra de filtros e controles */}
      <FilterBar 
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        showOnlyAdjustments={showOnlyAdjustments}
        setShowOnlyAdjustments={setShowOnlyAdjustments}
        showOnlyWithAccounts={showOnlyWithAccounts}
        setShowOnlyWithAccounts={setShowOnlyWithAccounts}
        viewMode={viewMode}
        setViewMode={setViewMode}
        onAnalyzeAll={() => batchAnalyze(clients?.map(c => c.id) || [])}
        isProcessingBatch={isProcessingBatch}
        clientCount={clients?.length || 0}
      />
      
      {/* Lista de clientes */}
      <ClientsList
        clients={clients || []}
        isLoading={isLoading}
        processingIds={processingIds}
        onReviewClient={analyzeClient}
        onViewDetails={handleViewDetails}
        viewMode={viewMode}
        platform="meta"
      />
    </div>
  );
}
