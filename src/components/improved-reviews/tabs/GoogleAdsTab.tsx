import { useState, useEffect } from "react";
import { ClientsList } from "../clients/ClientsList";
import { FilterBar } from "../filters/FilterBar";
import { MetricsPanel } from "../dashboard/MetricsPanel";
import { useGoogleAdsData } from "../hooks/useGoogleAdsData";
import { ImprovedLoadingState } from "../common/ImprovedLoadingState";
import { EmptyState } from "../common/EmptyState";
import { NoReviewsWarning } from "../common/NoReviewsWarning";
import { BatchProgressBar } from "../dashboard/BatchProgressBar";
import { useBatchOperations } from "../hooks/useBatchOperations";
import { useRealTimeDataService } from "../services/realTimeDataService";
import { useTodayReviewsCheck } from "../hooks/useTodayReviewsCheck";
import { DataDebugPanel } from "../debug/DataDebugPanel";
import { AlertTriangle } from "lucide-react";

interface GoogleAdsTabProps {
  onRefreshCompleted?: () => void;
}

export function GoogleAdsTab({ onRefreshCompleted }: GoogleAdsTabProps = {}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("");
  const [showWithoutAccount, setShowWithoutAccount] = useState(false);
  const [budgetCalculationMode, setBudgetCalculationMode] = useState<"weighted" | "current">(() => {
    return (localStorage.getItem("googleAds_budgetCalculationMode") as "weighted" | "current") || "weighted";
  });
  
  const { data, isLoading, error, metrics, refreshData } = useGoogleAdsData(budgetCalculationMode);
  const { data: todayReviews, refetch: refetchTodayCheck } = useTodayReviewsCheck();
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
      await refetchTodayCheck();
      if (onRefreshCompleted) onRefreshCompleted();
    },
    onIndividualComplete: async () => {
      console.log("✅ Revisão individual do Google Ads concluída. Atualizando dados...");
      await forceDataRefresh();
      await refreshData();
      await refetchTodayCheck();
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
  const handleActiveFilterChange = (filter: string) => setActiveFilter(filter);
  const handleAccountFilterChange = (showWithoutAccount: boolean) => setShowWithoutAccount(showWithoutAccount);
  const handleBudgetCalculationModeChange = (mode: "weighted" | "current") => {
    setBudgetCalculationMode(mode);
    localStorage.setItem("googleAds_budgetCalculationMode", mode);
  };

  const handleBatchReview = () => {
    console.log("🚀 Iniciando revisão em lote do Google Ads...");
    if (data && data.length > 0) {
      reviewAllClients(data);
    }
  };

  // Mostrar debug panel apenas se não há dados ou há erro
  const shouldShowDebug = !isLoading && (error || !data || data.length === 0);

  if (isLoading) {
    return <ImprovedLoadingState />;
  }

  // Se não há reviews para hoje, mostrar apenas o aviso
  if (!isLoading && !error && !todayReviews.hasGoogleReviews) {
    return (
      <div className="space-y-6">
        <NoReviewsWarning 
          platform="google" 
          onRefresh={handleBatchReview}
          isRefreshing={isProcessing}
        />
        {isProcessing && (
          <BatchProgressBar
            progress={progress}
            total={total}
            currentClientName={currentClientName}
            platform="google"
            onCancel={cancelBatchProcessing}
          />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Debug Panel - mostra automaticamente apenas se há problemas */}
      {shouldShowDebug && <DataDebugPanel />}

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
            activeFilter={activeFilter}
            showWithoutAccount={showWithoutAccount}
            budgetCalculationMode={budgetCalculationMode}
            onSearchChange={handleSearchChange}
            onActiveFilterChange={handleActiveFilterChange}
            onAccountFilterChange={handleAccountFilterChange}
            onBudgetCalculationModeChange={handleBudgetCalculationModeChange}
            platform="google"
          />
          
          <ClientsList 
            data={data}
            searchQuery={searchQuery}
            activeFilter={activeFilter}
            showWithoutAccount={showWithoutAccount}
            budgetCalculationMode={budgetCalculationMode}
            platform="google"
          />
        </>
      )}
    </div>
  );
}