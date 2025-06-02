
import { useState } from "react";
import { ClientsList } from "../clients/ClientsList";
import { FilterBar } from "../filters/FilterBar";
import { MetricsPanel } from "../dashboard/MetricsPanel";
import { useGoogleAdsData } from "../hooks/useGoogleAdsData";
import { ImprovedLoadingState } from "../common/ImprovedLoadingState";
import { EmptyState } from "../common/EmptyState";
import { useBatchOperations } from "../hooks/useBatchOperations";
import { AlertTriangle } from "lucide-react";

interface GoogleAdsTabProps {
  onRefreshCompleted?: () => void;
}

export function GoogleAdsTab({ onRefreshCompleted }: GoogleAdsTabProps = {}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"cards" | "table" | "list">("cards");
  const [showOnlyAdjustments, setShowOnlyAdjustments] = useState(false);
  const [showWithoutAccount, setShowWithoutAccount] = useState(false);
  const { data, isLoading, error, metrics, refreshData } = useGoogleAdsData();
  const { 
    reviewAllClients, 
    cancelBatchProcessing,
    isProcessing, 
    progress, 
    total, 
    currentClientName 
  } = useBatchOperations({
    platform: "google",
    onComplete: () => {
      console.log("Revisão em lote do Google Ads concluída. Atualizando dados...");
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
    console.log("Atualizando dados do Google Ads...");
    await refreshData();
    if (onRefreshCompleted) onRefreshCompleted();
  };

  // Handle batch review
  const handleBatchReview = () => {
    console.log("Iniciando revisão em lote do Google Ads...");
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
        progress={progress}
        total={total}
        currentClientName={currentClientName}
        platform="google"
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
        platform="google"
      />
      
      <ClientsList 
        data={data}
        viewMode={viewMode}
        searchQuery={searchQuery}
        showOnlyAdjustments={showOnlyAdjustments}
        showWithoutAccount={showWithoutAccount}
        platform="google"
      />
    </div>
  );
}
