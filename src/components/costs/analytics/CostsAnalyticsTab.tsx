import { Cost, CostFilters } from "@/types/cost";
import { CostsMetricsGrid } from "@/components/costs/enhanced/CostsMetricsGrid";
import { CostsVisualization } from "@/components/costs/enhanced/CostsVisualization";

interface CostsAnalyticsTabProps {
  costs: Cost[];
  filters: CostFilters;
}

export function CostsAnalyticsTab({ costs, filters }: CostsAnalyticsTabProps) {
  return (
    <div className="space-y-6">
      {/* Métricas em Grid */}
      <div>
        <CostsMetricsGrid costs={costs} />
      </div>

      {/* Visualizações (gráficos) */}
      <div>
        <CostsVisualization costs={costs} filters={filters} />
      </div>
    </div>
  );
}