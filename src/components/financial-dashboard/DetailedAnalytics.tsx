
import { CostFilters } from "@/types/cost";
import { InteractiveCharts } from "./components/InteractiveCharts";
import { ComparativeAnalysis } from "./components/ComparativeAnalysis";
import { TrendAnalysis } from "./components/TrendAnalysis";

interface DetailedAnalyticsProps {
  filters: CostFilters;
}

export const DetailedAnalytics = ({ filters }: DetailedAnalyticsProps) => {
  return (
    <div className="space-y-8">
      {/* Gráficos Interativos */}
      <InteractiveCharts filters={filters} />

      {/* Análise Comparativa */}
      <ComparativeAnalysis filters={filters} />

      {/* Análise de Tendências */}
      <TrendAnalysis filters={filters} />
    </div>
  );
};
