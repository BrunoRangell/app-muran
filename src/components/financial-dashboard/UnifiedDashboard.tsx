
import { CostFilters } from "@/types/cost";
import { FinancialSection } from "./sections/FinancialSection";
import { ClientsSection } from "./sections/ClientsSection";
import { CostsSection } from "./sections/CostsSection";
import { PerformanceSection } from "./sections/PerformanceSection";
import { InteractiveCharts } from "./components/InteractiveCharts";
import { useFinancialMetrics } from "@/components/clients/metrics/hooks/useFinancialMetrics";

interface UnifiedDashboardProps {
  filters: CostFilters;
}

export const UnifiedDashboard = ({ filters }: UnifiedDashboardProps) => {
  const { financialData, isLoadingFinancialData } = useFinancialMetrics();

  return (
    <div className="space-y-8">
      {/* Grid de Métricas Principais */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Seção Financeira */}
        <div className="space-y-6">
          <FinancialSection 
            filters={filters} 
            metrics={financialData}
            isLoading={isLoadingFinancialData}
          />
          <CostsSection 
            filters={filters}
            metrics={financialData}
            isLoading={isLoadingFinancialData}
          />
        </div>

        {/* Seção de Clientes e Performance */}
        <div className="space-y-6">
          <ClientsSection 
            filters={filters}
            metrics={financialData}
            isLoading={isLoadingFinancialData}
          />
          <PerformanceSection 
            filters={filters}
            metrics={financialData}
            isLoading={isLoadingFinancialData}
          />
        </div>
      </div>

      {/* Gráficos Interativos */}
      <InteractiveCharts filters={filters} />
    </div>
  );
};
