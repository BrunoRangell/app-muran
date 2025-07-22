
import { CostFilters } from "@/types/cost";
import { FinancialSection } from "./sections/FinancialSection";
import { ClientsSection } from "./sections/ClientsSection";
import { CostsSection } from "./sections/CostsSection";
import { PerformanceSection } from "./sections/PerformanceSection";
import { QuickInsights } from "./components/QuickInsights";
import { useFinancialMetrics } from "@/components/clients/metrics/hooks/useFinancialMetrics";

interface MetricsOverviewProps {
  filters: CostFilters;
}

export const MetricsOverview = ({ filters }: MetricsOverviewProps) => {
  // Centralizar o hook aqui também
  const { allClientsMetrics, isLoadingAllClients } = useFinancialMetrics();

  return (
    <div className="space-y-8">
      {/* Insights Rápidos */}
      <QuickInsights filters={filters} />

      {/* Grid de Seções */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Seção Financeira */}
        <div className="space-y-6">
          <FinancialSection 
            filters={filters} 
            metrics={allClientsMetrics}
            isLoading={isLoadingAllClients}
          />
          <CostsSection 
            filters={filters}
            metrics={allClientsMetrics}
            isLoading={isLoadingAllClients}
          />
        </div>

        {/* Seção de Clientes e Performance */}
        <div className="space-y-6">
          <ClientsSection 
            filters={filters}
            metrics={allClientsMetrics}
            isLoading={isLoadingAllClients}
          />
          <PerformanceSection 
            filters={filters}
            metrics={allClientsMetrics}
            isLoading={isLoadingAllClients}
          />
        </div>
      </div>
    </div>
  );
};
