
import { useState, useEffect } from "react";
import { ClientsList } from "../clients/ClientsList";
import { FilterBar } from "../filters/FilterBar";
import { MetricsPanel } from "../dashboard/MetricsPanel";
import { useUnifiedReviewsData } from "../hooks/useUnifiedReviewsData";
import { ImprovedLoadingState } from "../common/ImprovedLoadingState";
import { EmptyState } from "../common/EmptyState";
import { useBatchOperations } from "../hooks/useBatchOperations";
import { useRealTimeDataService } from "../services/realTimeDataService";
import { AlertTriangle } from "lucide-react";

interface MetaAdsTabProps {
  onRefreshCompleted?: () => void;
}

export function MetaAdsTab({ onRefreshCompleted }: MetaAdsTabProps = {}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"cards" | "table" | "list">("cards");
  const [showOnlyAdjustments, setShowOnlyAdjustments] = useState(false);
  const [showWithoutAccount, setShowWithoutAccount] = useState(false);
  
  const { data, isLoading, error, metrics, refreshData } = useUnifiedReviewsData();
  const { forceDataRefresh, startPolling } = useRealTimeDataService();
  const { 
    reviewAllClients, 
    cancelBatchProcessing,
    isProcessing, 
    progress, 
    total, 
    currentClientName 
  } = useBatchOperations({
    platform: "meta",
    onComplete: async () => {
      console.log("✅ Revisão em lote do Meta Ads concluída. Atualizando dados...");
      await forceDataRefresh();
      await refreshData();
      if (onRefreshCompleted) onRefreshCompleted();
    }
  });

  // Iniciar polling para atualizações automáticas
  useEffect(() => {
    const pollingInterval = startPolling(30000);
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [startPolling]);

  // Handlers unificados para reduzir duplicação
  const handleSearchChange = (query: string) => setSearchQuery(query);
  const handleViewModeChange = (mode: "cards" | "table" | "list") => setViewMode(mode);
  const handleAdjustmentFilterChange = (showAdjustments: boolean) => setShowOnlyAdjustments(showAdjustments);
  const handleAccountFilterChange = (showWithoutAccount: boolean) => setShowWithoutAccount(showWithoutAccount);

  const handleRefresh = async () => {
    console.log("🔄 Atualizando dados do Meta Ads...");
    await forceDataRefresh();
    await refreshData();
    if (onRefreshCompleted) onRefreshCompleted();
  };

  const handleBatchReview = () => {
    console.log("🚀 Iniciando revisão em lote do Meta Ads...");
    if (data && data.length > 0) {
      reviewAllClients(data);
    }
  };

  if (isLoading) {
    return <ImprovedLoadingState />;
  }

  if (error) {
    return (
      <EmptyState
        title="Erro ao carregar dados"
        description={`Ocorreu um erro ao carregar os dados: ${error.message}`}
        icon={AlertTriangle}
      />
    );
  }

  return (
    <div className="space-y-6">
      <MetricsPanel 
        metrics={metrics} 
        onBatchReview={handleBatchReview}
        isProcessing={isProcessing}
        progress={progress}
        total={total}
        currentClientName={currentClientName}
        platform="meta"
        onCancelBatchProcessing={cancelBatchProcessing}
      />
      
      <FilterBar 
        searchQuery={searchQuery}
        viewMode={viewMode}
        showOnlyAdjustments={showOnlyAdjustments}
        showWithoutAccount={showWithoutAccount}
        onSearchChange={handleSearchChange}
        onViewModeChange={handleViewModeChange}
        onAdjustmentFilterChange={handleAdjustmentFilterChange}
        onAccountFilterChange={handleAccountFilterChange}
        onRefresh={handleRefresh}
        isRefreshing={isLoading}
      />
      
      <ClientsList 
        data={data}
        viewMode={viewMode}
        searchQuery={searchQuery}
        showOnlyAdjustments={showOnlyAdjustments}
        showWithoutAccount={showWithoutAccount}
        platform="meta"
      />
    </div>
  );
}
