
import { useState, useEffect } from "react";
import { ClientsList } from "../clients/ClientsList";
import { FilterBar } from "../filters/FilterBar";
import { MetricsPanel } from "../dashboard/MetricsPanel";
import { useUnifiedReviewsData } from "../hooks/useUnifiedReviewsData";
import { ImprovedLoadingState } from "../common/ImprovedLoadingState";
import { EmptyState } from "../common/EmptyState";
import { useBatchOperations } from "../hooks/useBatchOperations";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

interface GoogleAdsTabProps {
  onRefreshCompleted?: () => void;
  isActive?: boolean;
}

export function GoogleAdsTab({ onRefreshCompleted, isActive = true }: GoogleAdsTabProps = {}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"cards" | "table" | "list">("cards");
  const [showOnlyAdjustments, setShowOnlyAdjustments] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { data, isLoading, error, metrics, refreshData } = useUnifiedReviewsData("google");
  const { reviewAllClients, isProcessing, lastError } = useBatchOperations({
    platform: "google",
    onComplete: () => {
      console.log("Revisão em lote do Google Ads concluída. Atualizando dados...");
      refreshData();
      if (onRefreshCompleted) onRefreshCompleted();
    }
  });

  // Diagnóstico de dados quando a aba se torna ativa
  useEffect(() => {
    if (isActive && !isLoading && !data?.length) {
      console.log("GoogleAdsTab ativa sem dados disponíveis");
      
      // Se não houver dados e não estivermos carregando, tente refrescar
      if (!isRefreshing) {
        console.log("Tentando recarregar dados automaticamente...");
        refreshData();
      }
    }
  }, [isActive, data, isLoading, isRefreshing, refreshData]);

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
    setIsRefreshing(true);
    try {
      await refreshData();
      if (onRefreshCompleted) onRefreshCompleted();
      toast({
        title: "Dados atualizados",
        description: "Os dados do Google Ads foram atualizados com sucesso."
      });
    } catch (refreshError) {
      console.error("Erro ao atualizar dados:", refreshError);
      toast({
        title: "Erro ao atualizar",
        description: "Ocorreu um erro ao atualizar os dados. Por favor, tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  // Handle batch review
  const handleBatchReview = () => {
    console.log("Iniciando revisão em lote do Google Ads...");
    if (data && data.length > 0) {
      reviewAllClients(data);
    } else {
      toast({
        title: "Sem dados para revisão",
        description: "Não há contas Google disponíveis para revisar. Verifique se os clientes possuem contas Google configuradas.",
        variant: "destructive"
      });
    }
  };

  // Se há erro com o último erro de operação em lote
  const displayError = error || lastError;

  // Quando não há dados disponíveis, mostra estado vazio específico
  if (!isLoading && (!data || data.length === 0) && !displayError) {
    return (
      <div className="space-y-6">
        <MetricsPanel 
          metrics={metrics} 
          onBatchReview={handleBatchReview}
          isProcessing={isProcessing}
          platform="google"
        />
        
        <div className="bg-white p-8 rounded-md shadow-sm border border-gray-100 flex flex-col items-center justify-center">
          <div className="text-center space-y-4 max-w-lg">
            <h2 className="text-lg font-medium text-gray-800">Nenhum dado disponível</h2>
            <p className="text-gray-600">
              Não há dados de revisão disponíveis. Clique em "Analisar Todos" para iniciar a análise das contas Google ou verifique se os clientes possuem contas Google configuradas.
            </p>
            <Button 
              onClick={handleBatchReview}
              className="bg-[#ff6e00] hover:bg-[#e66300] text-white mt-4"
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="animate-spin mr-2 h-5 w-5" />
                  Analisando...
                </>
              ) : (
                "Analisar Todos"
              )}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return <ImprovedLoadingState message="Carregando dados do Google Ads..." />;
  }

  if (displayError) {
    return (
      <EmptyState
        title="Erro ao carregar dados"
        description={`Ocorreu um erro ao carregar os dados: ${displayError instanceof Error ? displayError.message : displayError}`}
        icon={<AlertTriangle className="h-16 w-16 text-red-500 mb-4" />}
        actionButton={
          <Button 
            onClick={handleRefresh}
            className="bg-[#ff6e00] hover:bg-[#e66300] text-white mt-4"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Tentar novamente
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <MetricsPanel 
        metrics={metrics} 
        onBatchReview={handleBatchReview}
        isProcessing={isProcessing}
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
