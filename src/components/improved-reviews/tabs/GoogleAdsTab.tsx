
import { useState, useEffect, useRef } from "react";
import { ClientsList } from "../clients/ClientsList";
import { FilterBar } from "../filters/FilterBar";
import { MetricsPanel } from "../dashboard/MetricsPanel";
import { useGoogleAdsData } from "../hooks/useGoogleAdsData";
import { ImprovedLoadingState } from "../common/ImprovedLoadingState";
import { EmptyState } from "../common/EmptyState";
import { useBatchOperations } from "../hooks/useBatchOperations";
import { AlertTriangle, AlertCircle } from "lucide-react";
import { useTabVisibility } from "../hooks/useTabVisibility";
import { supabase } from "@/lib/supabase";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface GoogleAdsTabProps {
  onRefreshCompleted?: () => void;
  isActive?: boolean;
}

// Chave para armazenamento local do estado do filtro
const FILTER_STATE_KEY = "google_ads_filters_state";
// Tempo mínimo entre notificações de atualizações (5 segundos)
const MIN_NOTIFICATION_INTERVAL = 5000;

export function GoogleAdsTab({ onRefreshCompleted, isActive = true }: GoogleAdsTabProps = {}) {
  // Estado para controle da UI
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"cards" | "table" | "list">("cards");
  const [showOnlyAdjustments, setShowOnlyAdjustments] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const lastNotificationTime = useRef<number>(0);
  const realtimeChannelRef = useRef<any>(null);
  
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
          const now = Date.now();
          
          // Verificar se já passou tempo suficiente desde a última notificação
          if (now - lastNotificationTime.current < MIN_NOTIFICATION_INTERVAL) {
            console.log('GoogleAdsTab: Ignorando notificação de mudança (muito frequente)');
            return;
          }
          
          console.log('GoogleAdsTab: Detectada mudança em orçamentos personalizados:', payload);
          lastNotificationTime.current = now;
          
          // Atualizar data para forçar React Query a refetchear
          setLastCustomBudgetUpdate(new Date());
          
          // Notificar usuário
          toast({
            title: "Orçamentos atualizados",
            description: "Os orçamentos personalizados do Google Ads foram atualizados.",
            duration: 3000,
          });
        }
      )
      .subscribe((status) => {
        console.log("Status da inscrição do canal realtime:", status);
      });
      
    // Armazenar referência ao canal
    realtimeChannelRef.current = channel;

    // Limpar inscrição ao desmontar
    return () => {
      console.log("Removendo monitoramento de orçamentos personalizados na aba Google Ads");
      if (realtimeChannelRef.current) {
        supabase.removeChannel(realtimeChannelRef.current);
        realtimeChannelRef.current = null;
      }
    };
  }, [isActive, toast]);

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

  // Usar o hook de visibilidade da aba com debounce
  useTabVisibility({
    isActive,
    onBecomeVisible: () => {
      console.log("Tab GoogleAds se tornou visível!");
      // Ao se tornar visível, forçar atualização dos dados apenas se não tiver atualizado recentemente
      queryClient.invalidateQueries({ queryKey: ["improved-google-reviews"] });
    },
    debounceTime: 10000 // 10 segundos para evitar atualizações muito frequentes
  });

  const { 
    data, 
    isLoading, 
    error, 
    metrics, 
    refreshData, 
    isFetching, 
    setLastCustomBudgetUpdate 
  } = useGoogleAdsData();
  
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
    try {
      const result = await refreshData();
      if (result.error) {
        throw result.error;
      }
      
      toast({
        title: "Dados atualizados",
        description: "Os dados do Google Ads foram atualizados com sucesso.",
        duration: 3000,
      });
      
      if (onRefreshCompleted) onRefreshCompleted();
    } catch (err) {
      console.error("Erro ao atualizar dados:", err);
      toast({
        title: "Erro na atualização",
        description: "Ocorreu um erro ao atualizar os dados do Google Ads.",
        variant: "destructive",
      });
    }
  };

  // Handle batch review
  const handleBatchReview = () => {
    console.log("Iniciando revisão em lote do Google Ads...");
    if (data && data.length > 0) {
      reviewAllClients(data);
    } else {
      toast({
        title: "Sem clientes para revisar",
        description: "Não há clientes disponíveis para revisão em lote.",
        variant: "destructive",
      });
    }
  };

  // Renderização condicional baseada no estado de carregamento
  if (isLoading) {
    return <ImprovedLoadingState message="Carregando dados do Google Ads..." />;
  }

  if (error) {
    return (
      <EmptyState
        title="Erro ao carregar dados"
        description={`Ocorreu um erro ao carregar os dados: ${error.message}`}
        icon={<AlertTriangle className="h-16 w-16 text-red-500 mb-4" />}
        action={{
          label: "Tentar novamente",
          onClick: () => refreshData()
        }}
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
        <ImprovedLoadingState message="Atualizando dados do Google Ads..." />
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
