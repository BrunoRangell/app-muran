
import { useState, useEffect } from "react";
import { ClientsList } from "../clients/ClientsList";
import { FilterBar } from "../filters/FilterBar";
import { MetricsPanel } from "../dashboard/MetricsPanel";
import { useGoogleAdsData } from "../hooks/useGoogleAdsData";
import { ImprovedLoadingState } from "../common/ImprovedLoadingState";
import { EmptyState } from "../common/EmptyState";
import { useBatchOperations } from "../hooks/useBatchOperations";
import { useRealTimeDataService } from "../services/realTimeDataService";
import { DataDebugPanel } from "../debug/DataDebugPanel";
import { AlertTriangle } from "lucide-react";

interface GoogleAdsTabProps {
  onRefreshCompleted?: () => void;
}

export function GoogleAdsTab({ onRefreshCompleted }: GoogleAdsTabProps = {}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"cards" | "table" | "list">("cards");
  const [showOnlyAdjustments, setShowOnlyAdjustments] = useState(false);
  const [showWithoutAccount, setShowWithoutAccount] = useState(false);
  const [showDebugPanel, setShowDebugPanel] = useState(false);
  
  const { data, isLoading, error, metrics, refreshData } = useGoogleAdsData();
  const { forceDataRefresh, startPolling } = useRealTimeDataService();
  
  // Log detalhado para debug
  useEffect(() => {
    console.log("🔍 GoogleAdsTab - Estado atual:", {
      dataLength: data?.length || 0,
      isLoading,
      error: error?.message,
      metrics,
      timestamp: new Date().toISOString()
    });
  }, [data, isLoading, error, metrics]);
  
  const { 
    reviewAllClients, 
    cancelBatchProcessing,
    isProcessing, 
    progress, 
    total, 
    currentClientName 
  } = useBatchOperations({
    platform: "google",
    onComplete: async () => {
      console.log("✅ Revisão em lote do Google Ads concluída. Atualizando dados...");
      await forceDataRefresh();
      await refreshData();
      if (onRefreshCompleted) onRefreshCompleted();
    },
    onIndividualComplete: async () => {
      console.log("✅ Revisão individual do Google Ads concluída. Atualizando dados...");
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

  // Handlers unificados
  const handleSearchChange = (query: string) => setSearchQuery(query);
  const handleViewModeChange = (mode: "cards" | "table" | "list") => setViewMode(mode);
  const handleAdjustmentFilterChange = (showAdjustments: boolean) => setShowOnlyAdjustments(showAdjustments);
  const handleAccountFilterChange = (showWithoutAccount: boolean) => setShowWithoutAccount(showWithoutAccount);

  const handleRefresh = async () => {
    console.log("🔄 Atualizando dados do Google Ads...");
    await forceDataRefresh();
    await refreshData();
    if (onRefreshCompleted) onRefreshCompleted();
  };

  const handleBatchReview = () => {
    console.log("🚀 Iniciando revisão em lote do Google Ads...");
    if (data && data.length > 0) {
      reviewAllClients(data);
    }
  };

  // Mostrar debug panel se não há dados ou há erro
  const shouldShowDebug = !isLoading && (error || !data || data.length === 0);

  if (isLoading) {
    return <ImprovedLoadingState />;
  }

  return (
    <div className="space-y-6">
      {/* Debug Panel - mostra automaticamente se há problemas */}
      {(shouldShowDebug || showDebugPanel) && <DataDebugPanel />}
      
      {/* Toggle Debug Panel */}
      <div className="flex justify-end">
        <button
          onClick={() => setShowDebugPanel(!showDebugPanel)}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          {showDebugPanel ? 'Ocultar' : 'Mostrar'} Debug Panel
        </button>
      </div>

      {error && (
        <EmptyState
          title="Erro ao carregar dados"
          description={`Ocorreu um erro ao carregar os dados: ${error.message}`}
          icon={<AlertTriangle className="h-16 w-16 text-red-500 mb-4" />}
        />
      )}

      {!error && (
        <>
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
        </>
      )}
    </div>
  );
}
