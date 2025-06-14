
import { CompactHealthFilters } from "@/components/campaign-health/CompactHealthFilters";
import { CompactHealthMetrics } from "@/components/campaign-health/CompactHealthMetrics";
import { HealthTableView } from "@/components/campaign-health/HealthTableView";

export default function CampaignHealth() {
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
        
        {/* Filtros Compactos */}
        <CompactHealthFilters />
        
        {/* Tabela Principal */}
        <HealthTableView />
      </div>
    </div>
  );
}
