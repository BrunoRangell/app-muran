
import { useState, useEffect, useCallback } from "react";
import { useGoogle } from "./hooks/useGoogle";
import { FilterBar } from "../common/FilterBar";
import { MetricsPanel } from "../common/MetricsPanel";
import { ClientsList } from "../common/ClientsList";
import { LoadingState } from "../common/LoadingState";
import { ErrorState } from "../common/ErrorState";
import { EmptyState } from "../common/EmptyState";
import { ViewMode } from "../common/types";

interface GoogleAdsTabProps {
  onRefreshCompleted?: () => void;
  isActive?: boolean;
}

// Chave para armazenamento local do estado do filtro
const FILTER_STATE_KEY = "google_ads_filters_state";

export function GoogleAdsTab({
  onRefreshCompleted,
  isActive = true
}: GoogleAdsTabProps = {}) {
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
  } = useGoogle();
  
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
      console.log("GoogleAdsTab ativa sem dados disponíveis");
      
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
    console.log("Atualizando dados do Google Ads...");
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
    console.log("Iniciando revisão em lote do Google Ads...");
    if (data && data.length > 0) {
      reviewAllClients(data);
      if (onRefreshCompleted) {
        setTimeout(onRefreshCompleted, 2000);
      }
    }
  }, [data, reviewAllClients, onRefreshCompleted]);
  
  // Renderização condicional baseada no estado
  if (isLoading) {
    return <LoadingState platform="google" />;
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
          platform="google"
        />
        
        <EmptyState
          title="Nenhuma campanha encontrada"
          description="Não há dados de campanhas disponíveis. Clique em 'Analisar Todos' para iniciar a análise das campanhas Google Ads."
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
        platform="google"
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
        platform="google"
      />
      
      <ClientsList 
        data={data}
        viewMode={viewMode}
        searchQuery={searchQuery}
        showOnlyAdjustments={showOnlyAdjustments}
        platform="google"
      />
    </div>
  );
}
