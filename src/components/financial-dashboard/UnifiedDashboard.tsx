
import { CostFilters } from "@/types/cost";
import { FinancialSection } from "./sections/FinancialSection";
import { ClientsSection } from "./sections/ClientsSection";
import { CostsSection } from "./sections/CostsSection";
import { PerformanceSection } from "./sections/PerformanceSection";
import { InteractiveCharts } from "./components/InteractiveCharts";

interface UnifiedDashboardProps {
  filters: CostFilters;
}

export const UnifiedDashboard = ({ filters }: UnifiedDashboardProps) => {
  return (
    <div className="space-y-6">
      {/* Layout Horizontal dos Painéis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4">
        <FinancialSection filters={filters} />
        <ClientsSection filters={filters} />
        <CostsSection filters={filters} />
        <PerformanceSection filters={filters} />
      </div>

      {/* Gráficos Interativos */}
      <InteractiveCharts filters={filters} />
    </div>
  );
};
