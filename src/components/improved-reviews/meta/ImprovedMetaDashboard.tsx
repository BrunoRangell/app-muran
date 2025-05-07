
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader, RefreshCw, Search, BarChart3, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { useReviewsData } from "../hooks/useReviewsData";
import { useBatchAnalysis } from "../context/BatchAnalysisContext";
import { ClientsViewGrid } from "./components/ClientsViewGrid";
import { ClientsViewTable } from "./components/ClientsViewTable";
import { ClientsViewList } from "./components/ClientsViewList";
import { LoadingView } from "./components/LoadingView";
import { EmptyStateView } from "./components/EmptyStateView";
import { MetaAnalysisProgress } from "./components/MetaAnalysisProgress";
import { MetricsCards } from "./components/MetricsCards";
import { formatDateInBrasiliaTz } from "../../daily-reviews/summary/utils";

export const ImprovedMetaDashboard = () => {
  const {
    searchQuery,
    setSearchQuery,
    showOnlyAdjustments,
    setShowOnlyAdjustments,
    viewMode,
    setViewMode,
    filteredClients,
    clientsWithMetaId,
    clientsWithoutMetaId,
    isLoading,
    lastReviewTime,
    metrics,
    refetch
  } = useReviewsData({ platformFilter: "meta" });

  const {
    isBatchAnalyzing,
    batchProgress,
    totalClientsToAnalyze,
    reviewSingleClient,
    startBatchAnalysis,
    isProcessingClient
  } = useBatchAnalysis();

  // Periodicamente atualizar quando uma análise em lote estiver em andamento
  useEffect(() => {
    if (isBatchAnalyzing) {
      const interval = setInterval(() => {
        refetch();
      }, 5000); // Atualizar a cada 5 segundos durante análises em lote
      
      return () => clearInterval(interval);
    }
  }, [isBatchAnalyzing, refetch]);

  const lastReviewTimeFormatted = lastReviewTime 
    ? formatDateInBrasiliaTz(lastReviewTime, "'Última revisão em' dd 'de' MMMM 'às' HH:mm")
    : "Nenhuma revisão realizada";

  return (
    <div className="space-y-6">
      {/* Cabeçalho com métricas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricsCards 
          totalClients={metrics.totalClients}
          clientsWithAdjustments={metrics.clientsWithAdjustments}
          adjustmentPercentage={metrics.adjustmentPercentage}
        />
      </div>

      {/* Controles principais */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <BarChart3 className="text-[#ff6e00]" size={20} />
                Dashboard Meta Ads
              </h2>
              <p className="text-sm text-gray-500">
                {lastReviewTimeFormatted}
              </p>
            </div>

            <Button
              onClick={() => startBatchAnalysis("meta")}
              disabled={isBatchAnalyzing}
              className="bg-[#ff6e00] hover:bg-[#ff6e00]/90"
            >
              {isBatchAnalyzing ? (
                <>
                  <Loader className="mr-2 h-4 w-4 animate-spin" />
                  Analisando...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Analisar Todos
                </>
              )}
            </Button>
          </div>

          {/* Barra de progresso */}
          {isBatchAnalyzing && (
            <MetaAnalysisProgress 
              batchProgress={batchProgress} 
              totalClientsToAnalyze={totalClientsToAnalyze} 
            />
          )}

          <Separator className="my-4" />

          {/* Controles de busca e visualização */}
          <div className="flex flex-col md:flex-row justify-between gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar cliente por nome..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
              <div className="flex items-center space-x-2">
                <Switch
                  id="show-adjustments"
                  checked={showOnlyAdjustments}
                  onCheckedChange={setShowOnlyAdjustments}
                />
                <Label htmlFor="show-adjustments" className="flex items-center">
                  <Filter className="mr-1 h-4 w-4" />
                  Apenas com ajustes
                </Label>
              </div>

              <RadioGroup 
                value={viewMode} 
                onValueChange={(value) => setViewMode(value as "grid" | "table" | "list")}
                className="flex space-x-2"
              >
                <div className="flex items-center space-x-1">
                  <RadioGroupItem value="grid" id="view-grid" />
                  <Label htmlFor="view-grid">Grade</Label>
                </div>
                <div className="flex items-center space-x-1">
                  <RadioGroupItem value="table" id="view-table" />
                  <Label htmlFor="view-table">Tabela</Label>
                </div>
                <div className="flex items-center space-x-1">
                  <RadioGroupItem value="list" id="view-list" />
                  <Label htmlFor="view-list">Lista</Label>
                </div>
              </RadioGroup>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Conteúdo principal */}
      {isLoading ? (
        <LoadingView />
      ) : filteredClients.length === 0 ? (
        <EmptyStateView />
      ) : (
        <>
          {viewMode === "grid" && (
            <ClientsViewGrid
              clientsWithMetaId={clientsWithMetaId}
              clientsWithoutMetaId={clientsWithoutMetaId}
              isProcessingClient={isProcessingClient}
              onReviewClient={reviewSingleClient}
            />
          )}
          
          {viewMode === "table" && (
            <ClientsViewTable
              clientsWithMetaId={clientsWithMetaId}
              clientsWithoutMetaId={clientsWithoutMetaId}
              isProcessingClient={isProcessingClient}
              onReviewClient={reviewSingleClient}
            />
          )}
          
          {viewMode === "list" && (
            <ClientsViewList
              clientsWithMetaId={clientsWithMetaId}
              clientsWithoutMetaId={clientsWithoutMetaId}
              isProcessingClient={isProcessingClient}
              onReviewClient={reviewSingleClient}
            />
          )}
        </>
      )}
    </div>
  );
};
