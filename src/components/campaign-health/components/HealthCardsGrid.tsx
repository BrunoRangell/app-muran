
import { useActiveCampaignHealth } from "../hooks/useActiveCampaignHealth";
import { ClientHealthCard } from "../ClientHealthCard";
import { LoadingCardsGrid } from "../LoadingCardsGrid";
import { EmptyStateCard } from "../EmptyStateCard";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HealthMetricsPanel } from "./HealthMetricsPanel";

export function HealthCardsGrid() {
  const {
    data,
    isLoading,
    error,
    handleAction,
    handleRefresh,
    isFetching,
    filterValue,
    statusFilter,
    platformFilter
  } = useActiveCampaignHealth();

  if (error) {
    return (
      <div className="space-y-4">
        <Alert variant="destructive" className="mx-auto max-w-2xl">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="ml-2">
            <div className="font-semibold mb-2">Erro ao carregar dados</div>
            <div className="text-sm mb-3">{error}</div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isFetching}
              className="mt-2"
            >
              {isFetching ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              Tentar novamente
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (isLoading) {
    return <LoadingCardsGrid />;
  }

  if (!data || data.length === 0) {
    const hasFilters = filterValue !== "" || statusFilter !== "all" || platformFilter !== "all";
    return (
      <EmptyStateCard 
        onRefresh={handleRefresh}
        isRefreshing={isFetching}
        hasFilters={hasFilters}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Painel de Métricas */}
      <HealthMetricsPanel data={data} />

      {/* Header com contador */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">
          {data.length} {data.length === 1 ? 'cliente encontrado' : 'clientes encontrados'}
        </h2>
        
        <Button 
          variant="outline" 
          onClick={handleRefresh}
          disabled={isFetching}
          className="h-10"
        >
          {isFetching ? (
            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4 mr-2" />
          )}
          {isFetching ? "Atualizando..." : "Atualizar"}
        </Button>
      </div>

      {/* Grid de Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {data.map((client) => (
          <ClientHealthCard
            key={client.clientId}
            client={client}
            onAction={handleAction}
          />
        ))}
      </div>
    </div>
  );
}
