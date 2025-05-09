
import { useState, useEffect } from "react";
import { ClientsList } from "../clients/ClientsList";
import { FilterBar } from "../filters/FilterBar";
import { MetricsPanel } from "../dashboard/MetricsPanel";
import { useUnifiedReviewsData } from "../hooks/useUnifiedReviewsData";
import { ImprovedLoadingState } from "../common/ImprovedLoadingState";
import { EmptyState } from "../common/EmptyState";
import { useBatchOperations } from "../hooks/useBatchOperations";
import { AlertTriangle, RefreshCw, AlertCircle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { 
  Card,
  CardContent, 
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Progress } from "@/components/ui/progress";

interface MetaAdsTabProps {
  onRefreshCompleted?: () => void;
  isActive?: boolean;
}

export function MetaAdsTab({ onRefreshCompleted, isActive = true }: MetaAdsTabProps = {}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"cards" | "table" | "list">("cards");
  const [showOnlyAdjustments, setShowOnlyAdjustments] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [showProcessingDetails, setShowProcessingDetails] = useState(false);
  
  const { data, isLoading, error, metrics, refreshData } = useUnifiedReviewsData();
  
  const { 
    reviewAllClients, 
    isProcessing, 
    lastError, 
    processingIds,
    successfulReviews,
    failedReviews,
    resetProcessingState
  } = useBatchOperations({
    platform: "meta",
    onComplete: () => {
      console.log("Revisão em lote do Meta Ads concluída. Atualizando dados...");
      refreshData();
      setProcessingProgress(100);
      if (onRefreshCompleted) onRefreshCompleted();
    }
  });

  // Acompanhar progresso do processamento em lote
  useEffect(() => {
    if (isProcessing && data) {
      const total = data.length;
      const processed = successfulReviews.length + failedReviews.length;
      const progress = total > 0 ? Math.round((processed / total) * 100) : 0;
      setProcessingProgress(progress);
    } else if (!isProcessing) {
      setProcessingProgress(0);
    }
  }, [isProcessing, successfulReviews.length, failedReviews.length, data]);

  // Diagnóstico de dados quando a aba se torna ativa
  useEffect(() => {
    if (isActive && !isLoading && !data?.length) {
      console.log("MetaAdsTab ativa sem dados disponíveis");
      
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
    console.log("Atualizando dados do Meta Ads...");
    setIsRefreshing(true);
    resetProcessingState();
    try {
      await refreshData();
      if (onRefreshCompleted) onRefreshCompleted();
      toast({
        title: "Dados atualizados",
        description: "Os dados do Meta Ads foram atualizados com sucesso."
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
    console.log("Iniciando revisão em lote do Meta Ads...");
    resetProcessingState();
    setShowProcessingDetails(true);
    
    if (data && data.length > 0) {
      reviewAllClients(data);
    } else {
      toast({
        title: "Sem dados para revisão",
        description: "Não há contas Meta disponíveis para revisar. Verifique se os clientes possuem contas Meta configuradas.",
        variant: "destructive"
      });
    }
  };

  // Verificar se há erro com o último erro de operação em lote
  const displayError = error || lastError;

  // Renderizar painel de processamento
  const renderProcessingPanel = () => {
    if (!isProcessing && successfulReviews.length === 0 && failedReviews.length === 0) {
      return null;
    }

    return (
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isProcessing ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin text-[#ff6e00]" />
                  <span>Processamento em andamento</span>
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Processamento concluído</span>
                </>
              )}
            </div>
            <Badge 
              variant={failedReviews.length > 0 ? "destructive" : "outline"}
              className="ml-2"
            >
              {successfulReviews.length} sucesso{successfulReviews.length !== 1 ? 's' : ''}
              {failedReviews.length > 0 ? ` / ${failedReviews.length} falha${failedReviews.length !== 1 ? 's' : ''}` : ''}
            </Badge>
          </CardTitle>
          <CardDescription>
            {isProcessing 
              ? "Analisando contas Meta. Este processo pode levar alguns minutos..."
              : "Processamento concluído. Veja os resultados abaixo."}
          </CardDescription>
          {isProcessing && (
            <Progress value={processingProgress} className="mt-2" />
          )}
        </CardHeader>
        
        {(failedReviews.length > 0 || successfulReviews.length > 0) && (
          <CardContent>
            <Accordion 
              type="single" 
              collapsible 
              defaultValue={failedReviews.length > 0 ? "erros" : undefined}
            >
              {failedReviews.length > 0 && (
                <AccordionItem value="erros">
                  <AccordionTrigger className="text-red-500 font-medium">
                    <div className="flex items-center">
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      Contas com erro ({failedReviews.length})
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2">
                      {failedReviews.map((failure) => (
                        <div 
                          key={failure.id} 
                          className="rounded-md border border-red-200 bg-red-50 p-3"
                        >
                          <p className="font-medium">{failure.name}</p>
                          <p className="text-sm text-red-700">{failure.error}</p>
                          {failure.details?.suggestion && (
                            <p className="text-sm mt-1 text-gray-700">
                              {failure.details.suggestion}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )}
              
              {successfulReviews.length > 0 && (
                <AccordionItem value="sucessos">
                  <AccordionTrigger className="text-green-600 font-medium">
                    <div className="flex items-center">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Contas processadas com sucesso ({successfulReviews.length})
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                      {successfulReviews.map((id) => (
                        <Badge key={id} variant="outline" className="inline-block">
                          {id}
                        </Badge>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )}
            </Accordion>
          </CardContent>
        )}
        
        <CardFooter>
          <div className="flex gap-2 justify-end w-full">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                resetProcessingState();
                setShowProcessingDetails(false);
              }}
            >
              Fechar
            </Button>
            {!isProcessing && (
              <Button
                variant="default"
                size="sm"
                className="bg-[#ff6e00] hover:bg-[#e66300]"
                onClick={handleBatchReview}
              >
                Tentar novamente
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>
    );
  };

  // Quando não há dados disponíveis, mostra estado vazio específico
  if (!isLoading && (!data || data.length === 0) && !displayError) {
    return (
      <div className="space-y-6">
        <MetricsPanel 
          metrics={metrics} 
          onBatchReview={handleBatchReview}
          isProcessing={isProcessing}
        />
        
        <div className="bg-white p-8 rounded-md shadow-sm border border-gray-100 flex flex-col items-center justify-center">
          <div className="text-center space-y-4 max-w-lg">
            <h2 className="text-lg font-medium text-gray-800">Nenhum dado disponível</h2>
            <p className="text-gray-600">
              Não há dados de revisão disponíveis. Clique em "Analisar Todos" para iniciar a análise das contas Meta ou verifique se os clientes possuem contas Meta configuradas.
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
    return <ImprovedLoadingState message="Carregando dados do Meta Ads..." />;
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
      />
      
      {(showProcessingDetails || isProcessing || successfulReviews.length > 0 || failedReviews.length > 0) && 
        renderProcessingPanel()}
      
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
