
import { CostFilters } from "@/types/cost";
import { FinancialSection } from "./sections/FinancialSection";
import { ClientsSection } from "./sections/ClientsSection";
import { CostsSection } from "./sections/CostsSection";
import { PerformanceSection } from "./sections/PerformanceSection";
import { InteractiveCharts } from "./components/InteractiveCharts";

interface UnifiedDashboardProps {
  filters: CostFilters;
  financialData: {
    clients: any[];
    costs: any[];
    payments: any[];
    metrics: any;
  };
}

export const UnifiedDashboard = ({ filters, financialData }: UnifiedDashboardProps) => {
  return (
    <div className="space-y-8">
      {/* Grid de Métricas Principais */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Seção Financeira */}
        <div className="space-y-6">
          <FinancialSection 
            filters={filters} 
            metrics={financialData.metrics}
            isLoading={false}
          />
          <CostsSection 
            filters={filters}
            metrics={financialData.metrics}
            costs={financialData.costs}
            isLoading={false}
          />
        </div>

        {/* Seção de Clientes e Performance */}
        <div className="space-y-6">
          <ClientsSection 
            filters={filters}
            metrics={financialData.metrics}
            clients={financialData.clients}
            isLoading={false}
          />
          <PerformanceSection 
            filters={filters}
            metrics={financialData.metrics}
            isLoading={false}
          />
        </div>
      </div>

      {/* Gráficos Interativos */}
      <InteractiveCharts 
        filters={filters} 
        financialData={financialData}
      />
    </div>
  );
};
