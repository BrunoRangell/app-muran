
import { useState, useEffect } from "react";
import { ClientsList } from "../clients/ClientsList";
import { FilterBar } from "../filters/FilterBar";
import { MetricsPanel } from "../dashboard/MetricsPanel";
import { useGoogleAdsData } from "../hooks/useGoogleAdsData";
import { ImprovedLoadingState } from "../common/ImprovedLoadingState";
import { EmptyState } from "../common/EmptyState";
import { useBatchOperations } from "../hooks/useBatchOperations";
import { AlertTriangle } from "lucide-react";
import { useTabVisibility } from "../hooks/useTabVisibility";
import { supabase } from "@/lib/supabase";
import { useQueryClient } from "@tanstack/react-query";

interface GoogleAdsTabProps {
  onRefreshCompleted?: () => void;
  isActive?: boolean;
}

// Chave para armazenamento local do estado do filtro
const FILTER_STATE_KEY = "google_ads_filters_state";

export function GoogleAdsTab({ onRefreshCompleted, isActive = true }: GoogleAdsTabProps = {}) {
  // Estado para controle da UI
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"cards" | "table" | "list">("cards");
  const [showOnlyAdjustments, setShowOnlyAdjustments] = useState(false);
  const queryClient = useQueryClient();
  
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

  // Monitorar mudanças na tabela custom_budgets para Google Ads
  useEffect(() => {
    if (!isActive) return; // Só monitorar quando a aba estiver ativa

    console.log("Configurando monitoramento de orçamentos personalizados na aba Google Ads");
    
    // Inscrever no canal realtime para a tabela custom_budgets
    const channel = supabase
      .channel('google_ads_tab_custom_budgets')
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'custom_budgets',
          filter: 'platform=eq.google' 
        },
        (payload) => {
          console.log('GoogleAdsTab: Detectada mudança em orçamentos personalizados:', payload);
          // Invalidar o cache do React Query para forçar uma nova consulta
          queryClient.invalidateQueries({ queryKey: ["improved-google-reviews"] });
        }
      )
      .subscribe();

    // Limpar inscrição ao desmontar
    return () => {
      console.log("Removendo monitoramento de orçamentos personalizados na aba Google Ads");
      supabase.removeChannel(channel);
    };
  }, [isActive, queryClient]);

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

  // Usar o hook de visibilidade da aba
  useTabVisibility({
    isActive,
    onBecomeVisible: () => {
      console.log("Tab GoogleAds se tornou visível!");
      // Ao se tornar visível, forçar atualização dos dados
      queryClient.invalidateQueries({ queryKey: ["improved-google-reviews"] });
    }
  });

  const { data, isLoading, error, metrics, refreshData, isFetching } = useGoogleAdsData();
  
  const { reviewAllClients, isProcessing, processingIds } = useBatchOperations({
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

  // Handle filter changes
  const handleFilterChange = (showAdjustments: boolean) => {
    setShowOnlyAdjustments(showAdjustments);
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

  // Renderização condicional baseada no estado de carregamento
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

  // Verificar se temos dados válidos
  const hasValidData = data && data.length > 0;
  
  return (
    <div className="space-y-6">
      {/* Sempre exibir o MetricsPanel, mesmo durante atualizações */}
      <MetricsPanel 
        metrics={metrics} 
        onBatchReview={handleBatchReview}
        isProcessing={isProcessing || isFetching}
      />
      
      <FilterBar 
        searchQuery={searchQuery}
        viewMode={viewMode}
        showOnlyAdjustments={showOnlyAdjustments}
        onSearchChange={handleSearchChange}
        onViewModeChange={handleViewModeChange}
        onFilterChange={handleFilterChange}
        onRefresh={handleRefresh}
        isRefreshing={isFetching}
        platform="google"
      />
      
      {isFetching && !data ? (
        <ImprovedLoadingState />
      ) : (
        <ClientsList 
          data={data}
          viewMode={viewMode}
          searchQuery={searchQuery}
          showOnlyAdjustments={showOnlyAdjustments}
          platform="google"
        />
      )}
    </div>
  );
}
