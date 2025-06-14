
import { CompactHealthFilters } from "@/components/campaign-health/CompactHealthFilters";
import { CompactHealthMetrics } from "@/components/campaign-health/CompactHealthMetrics";
import { HealthTableView } from "@/components/campaign-health/HealthTableView";
import { useActiveCampaignHealth } from "@/components/campaign-health/hooks/useActiveCampaignHealth";

export default function CampaignHealth() {
  const {
    data,
    isLoading,
    isFetching,
    error,
    filterValue,
    setFilterValue,
    statusFilter,
    setStatusFilter,
    platformFilter,
    setPlatformFilter,
    handleAction,
    handleRefresh,
    lastRefresh,
    stats
  } = useActiveCampaignHealth();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header Simplificado */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#321e32] mb-2">
            Saúde de Campanhas
          </h1>
          <p className="text-gray-600 text-sm">
            Monitoramento em tempo real • Dados atualizados automaticamente
          </p>
        </div>
        
        {/* Métricas Compactas */}
        <CompactHealthMetrics />
        
        {/* Filtros Compactos - agora recebe props */}
        <CompactHealthFilters 
          filterValue={filterValue}
          setFilterValue={setFilterValue}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          platformFilter={platformFilter}
          setPlatformFilter={setPlatformFilter}
          handleRefresh={handleRefresh}
          isFetching={isFetching}
        />
        
        {/* Tabela Principal - agora recebe props */}
        <HealthTableView 
          data={data}
          isLoading={isLoading}
          error={error}
          handleAction={handleAction}
        />
      </div>
    </div>
  );
}
