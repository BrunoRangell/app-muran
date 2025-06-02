
import { useState } from "react";
import { ClientsList } from "../clients/ClientsList";
import { FilterBar } from "../filters/FilterBar";
import { MetricsPanel } from "../dashboard/MetricsPanel";
import { useUnifiedReviewsData } from "../hooks/useUnifiedReviewsData";
import { ImprovedLoadingState } from "../common/ImprovedLoadingState";
import { EmptyState } from "../common/EmptyState";
import { useBatchOperations } from "../hooks/useBatchOperations";
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
  const { reviewAllClients, isProcessing } = useBatchOperations({
    platform: "meta",
    onComplete: () => {
      console.log("Revisão em lote do Meta Ads concluída. Atualizando dados...");
      refreshData();
      if (onRefreshCompleted) onRefreshCompleted();
    }
  });

  // Handle search query changes
  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
  };

  // Handle view mode changes
  const handleViewModeChange = (mode: "cards" | "table" | "list") => {
    setViewMode(mode);
  };

  // Handle adjustment filter changes
  const handleAdjustmentFilterChange = (showAdjustments: boolean) => {
    setShowOnlyAdjustments(showAdjustments);
  };

  // Handle account filter changes
  const handleAccountFilterChange = (showWithoutAccount: boolean) => {
    setShowWithoutAccount(showWithoutAccount);
  };

  // Handle refresh
  const handleRefresh = async () => {
    console.log("Atualizando dados do Meta Ads...");
    await refreshData();
    if (onRefreshCompleted) onRefreshCompleted();
  };

  // Handle batch review
  const handleBatchReview = () => {
    console.log("Iniciando revisão em lote do Meta Ads...");
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
        icon={<AlertTriangle className="h-16 w-16 text-red-500 mb-4" />}
      />
    );
  }

  return (
    <div className="space-y-6">
      <MetricsPanel 
        metrics={metrics} 
        onBatchReview={handleBatchReview}
        isProcessing={isProcessing}
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
