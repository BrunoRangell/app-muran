
import { HealthCardsGrid } from "@/components/campaign-health/components/HealthCardsGrid";
import { ImprovedHealthFilters } from "@/components/campaign-health/ImprovedHealthFilters";

export default function CampaignHealth() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#321e32] mb-3">
            Saúde de Campanhas
          </h1>
          <p className="text-gray-600 max-w-3xl">
            Monitoramento em tempo real de todas as campanhas ativas dos clientes. 
            Dados atualizados automaticamente para acompanhar performance, gastos e status.
          </p>
        </div>
        
        {/* Filtros */}
        <ImprovedHealthFilters />
        
        {/* Grid de Cards com Métricas */}
        <HealthCardsGrid />
      </div>
    </div>
  );
}
