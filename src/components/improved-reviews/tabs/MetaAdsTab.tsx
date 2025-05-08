
import { useState, useEffect } from "react";
import { ClientsList } from "../clients/ClientsList";
import { FilterBar } from "../filters/FilterBar";
import { MetricsPanel } from "../dashboard/MetricsPanel";
import { useUnifiedReviewsData } from "../hooks/useUnifiedReviewsData";
import { ImprovedLoadingState } from "../common/ImprovedLoadingState";
import { EmptyState } from "../common/EmptyState";
import { useBatchOperations } from "../hooks/useBatchOperations";
import { AlertTriangle } from "lucide-react";
import { useTabVisibility } from "../hooks/useTabVisibility";

interface MetaAdsTabProps {
  onRefreshCompleted?: () => void;
  isActive?: boolean;
}

// Chave para armazenamento local do estado do filtro
const FILTER_STATE_KEY = "meta_ads_filters_state";

export function MetaAdsTab({ onRefreshCompleted, isActive = true }: MetaAdsTabProps = {}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"cards" | "table" | "list">("cards");
  const [showOnlyAdjustments, setShowOnlyAdjustments] = useState(false);
  
  // Usar o hook de visibilidade da aba
  useTabVisibility({
    isActive,
    onBecomeVisible: () => {
      console.log("Tab Meta Ads se tornou visível!");
    }
  });
  
  // Recuperar estado de filtros do localStorage ao inicializar
  useEffect(() => {
    try {
      const savedFilters = localStorage.getItem(FILTER_STATE_KEY);
      if (savedFilters) {
        const parsedFilters = JSON.parse(savedFilters);
        setSearchQuery(parsedFilters.searchQuery || "");
        setViewMode(parsedFilters.viewMode || "cards");
        setShowOnlyAdjustments(parsedFilters.showOnlyAdjustments || false);
      }
    } catch (err) {
      console.error("Erro ao recuperar estado dos filtros:", err);
    }
  }, []);

  // Salvar estado dos filtros no localStorage quando mudar
  useEffect(() => {
    try {
      localStorage.setItem(FILTER_STATE_KEY, JSON.stringify({
        searchQuery,
        viewMode,
        showOnlyAdjustments
      }));
    } catch (err) {
      console.error("Erro ao salvar estado dos filtros:", err);
    }
  }, [searchQuery, viewMode, showOnlyAdjustments]);
  
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

  // Handle filter changes
  const handleFilterChange = (showAdjustments: boolean) => {
    setShowOnlyAdjustments(showAdjustments);
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
        onSearchChange={handleSearchChange}
        onViewModeChange={handleViewModeChange}
        onFilterChange={handleFilterChange}
        onRefresh={handleRefresh}
        isRefreshing={isLoading}
        platform="meta"
      />
      
      <ClientsList 
        data={data}
        viewMode={viewMode}
        searchQuery={searchQuery}
        showOnlyAdjustments={showOnlyAdjustments}
        platform="meta"
      />
    </div>
  );
}
