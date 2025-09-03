import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ClientsList } from "../clients/ClientsList";
import { FilterBar } from "../filters/FilterBar";
import { MetricsPanel } from "../dashboard/MetricsPanel";
import { useUnifiedReviewsData } from "../hooks/useUnifiedReviewsData";
import { ImprovedLoadingState } from "../common/ImprovedLoadingState";
import { EmptyState } from "../common/EmptyState";
import { NoReviewsWarning } from "../common/NoReviewsWarning";
import { BatchProgressBar } from "../dashboard/BatchProgressBar";
import { useBatchOperations } from "../hooks/useBatchOperations";
import { useRealTimeDataService } from "../services/realTimeDataService";
import { useTodayReviewsCheck } from "../hooks/useTodayReviewsCheck";
import { reviewClient } from "@/components/common/services/unifiedReviewService";
import { AlertTriangle } from "lucide-react";

interface MetaAdsTabProps {
  onRefreshCompleted?: () => void;
}

export function MetaAdsTab({ onRefreshCompleted }: MetaAdsTabProps = {}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("");
  const [showWithoutAccount, setShowWithoutAccount] = useState(false);
  
  const { data, isLoading, error, metrics, refreshData } = useUnifiedReviewsData();
  const { data: todayReviews, refetch: refetchTodayCheck } = useTodayReviewsCheck();
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
  const handleAccountFilterChange = (show: boolean) => {
    if (show && activeFilter !== "without-account") {
      setActiveFilter("without-account");
    } else if (!show && activeFilter === "without-account") {
      setActiveFilter("");
    }
  };
  
  const handleClearAllFilters = () => {
    setActiveFilter("");
    setShowWithoutAccount(false);
  };

  const handleBatchReview = () => {
    console.log("🚀 Iniciando revisão em lote Meta Ads...");
    if (data && data.length > 0) {
      // Testar primeiro com um cliente só
      const testClient = data[0];
      console.log("🧪 Testando com cliente:", testClient);
      reviewAllClients([testClient]);
    }
  };

  const handleTestSingleReview = async () => {
    if (data && data.length > 0) {
      const testClient = data[0];
      console.log("🧪 Testando revisão individual:", testClient);
      
      try {
        const result = await reviewClient({
          clientId: testClient.id,
          accountId: testClient.meta_account_id || undefined,
          platform: "meta"
        });
        console.log("✅ Resultado do teste:", result);
      } catch (error) {
        console.error("❌ Erro no teste:", error);
      }
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

  // Se não há reviews para hoje, mostrar apenas o aviso
  if (!isLoading && !error && !todayReviews.hasMetaReviews) {
    return (
      <div className="space-y-6">
        <NoReviewsWarning 
          platform="meta" 
          onRefresh={handleBatchReview}
          isRefreshing={isProcessing}
        />
        {isProcessing && (
          <BatchProgressBar
            progress={progress}
            total={total}
            currentClientName={currentClientName}
            platform="meta"
            onCancel={cancelBatchProcessing}
          />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Botão de teste temporário */}
      <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
        <h3 className="font-medium text-yellow-800 mb-2">🧪 Teste da Unified Review</h3>
        <div className="flex gap-2">
          <Button onClick={handleTestSingleReview} variant="outline" size="sm">
            Testar 1 Cliente
          </Button>
          <Button onClick={handleBatchReview} variant="outline" size="sm">
            Testar Batch
          </Button>
        </div>
      </div>

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
        activeFilter={activeFilter}
        showWithoutAccount={activeFilter === "without-account"}
        onSearchChange={handleSearchChange}
        onActiveFilterChange={handleActiveFilterChange}
        onAccountFilterChange={handleAccountFilterChange}
        platform="meta"
      />
      
      <ClientsList 
        data={data}
        searchQuery={searchQuery}
        activeFilter={activeFilter}
            showWithoutAccount={activeFilter === "without-account"}
        platform="meta"
      />
    </div>
  );
}