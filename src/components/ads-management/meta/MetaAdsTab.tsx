
import { useState, useEffect, useCallback } from "react";
import { useMeta } from "./hooks/useMeta";
import { FilterBar } from "../common/FilterBar";
import { MetricsPanel } from "../common/MetricsPanel";
import { ClientsList } from "../common/ClientsList";
import { LoadingState } from "../common/LoadingState";
import { ErrorState } from "../common/ErrorState";
import { EmptyState } from "../common/EmptyState";
import { ViewMode } from "../common/types";

interface MetaAdsTabProps {
  onRefreshCompleted?: () => void;
  isActive?: boolean;
}

// Chave para armazenamento local do estado do filtro
const FILTER_STATE_KEY = "meta_ads_filters_state";

export function MetaAdsTab({
  onRefreshCompleted,
  isActive = true
}: MetaAdsTabProps = {}) {
  // Estados de UI
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("cards");
  const [showOnlyAdjustments, setShowOnlyAdjustments] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Buscar dados usando o hook dedicado
  const { 
    data, 
    isLoading, 
    error, 
    metrics, 
    refreshData,
    reviewAllClients,
    isProcessingBatch
  } = useMeta();
  
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
  
  // Diagnóstico de dados quando a aba se torna ativa
  useEffect(() => {
    if (isActive && !isLoading && !data?.length) {
      console.log("MetaAdsTab ativa sem dados disponíveis");
      
      // Se não houver dados e não estivermos carregando, tente refrescar
      if (!isRefreshing) {
        console.log("Tentando recarregar dados automaticamente...");
        handleRefresh();
      }
    }
  }, [isActive, data, isLoading, isRefreshing]);
  
  // Handlers para eventos de UI
  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);
  
  const handleViewModeChange = useCallback((mode: ViewMode) => {
    setViewMode(mode);
  }, []);
  
  const handleFilterChange = useCallback((showAdjustments: boolean) => {
    setShowOnlyAdjustments(showAdjustments);
  }, []);
  
  // Handler para refresh de dados
  const handleRefresh = useCallback(async () => {
    console.log("Atualizando dados do Meta Ads...");
    setIsRefreshing(true);
    try {
      await refreshData();
      if (onRefreshCompleted) onRefreshCompleted();
    } catch (error) {
      console.error("Erro ao atualizar dados:", error);
    } finally {
      setIsRefreshing(false);
    }
  }, [refreshData, onRefreshCompleted]);
  
  // Handler para revisão em lote
  const handleBatchReview = useCallback(() => {
    console.log("Iniciando revisão em lote do Meta Ads...");
    if (data && data.length > 0) {
      reviewAllClients(data);
      if (onRefreshCompleted) {
        setTimeout(onRefreshCompleted, 2000);
      }
    }
  }, [data, reviewAllClients, onRefreshCompleted]);
  
  // Renderização condicional baseada no estado
  if (isLoading) {
    return <LoadingState platform="meta" />;
  }
  
  if (error) {
    return (
      <ErrorState 
        message={error instanceof Error ? error.message : String(error)} 
        onRetry={handleRefresh}
      />
    );
  }
  
  if (!data || data.length === 0) {
    return (
      <div className="space-y-6">
        <MetricsPanel 
          metrics={metrics} 
          onBatchReview={handleBatchReview}
          isProcessing={isProcessingBatch}
          platform="meta"
        />
        
        <EmptyState
          title="Nenhum cliente encontrado"
          description="Não há dados de clientes disponíveis. Clique em 'Analisar Todos' para iniciar a análise das contas Meta."
          actionButton={
            <button
              onClick={handleBatchReview}
              className="bg-[#ff6e00] hover:bg-[#e66300] text-white font-medium px-4 py-2 rounded"
              disabled={isProcessingBatch}
            >
              {isProcessingBatch ? "Analisando..." : "Analisar Todos"}
            </button>
          }
        />
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <MetricsPanel 
        metrics={metrics} 
        onBatchReview={handleBatchReview}
        isProcessing={isProcessingBatch}
        platform="meta"
      />
      
      <FilterBar 
        searchQuery={searchQuery}
        viewMode={viewMode}
        showOnlyAdjustments={showOnlyAdjustments}
        onSearchChange={handleSearchChange}
        onViewModeChange={handleViewModeChange}
        onFilterChange={handleFilterChange}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
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
