
import { CostFilters } from "@/types/cost";
import { InteractiveCharts } from "./components/InteractiveCharts";
import { ComparativeAnalysis } from "./components/ComparativeAnalysis";
import { TrendAnalysis } from "./components/TrendAnalysis";

interface DetailedAnalyticsProps {
  filters: CostFilters;
  financialData: {
    clients: any[];
    costs: any[];
    payments: any[];
    metrics: any;
  };
}

export const DetailedAnalytics = ({ filters, financialData }: DetailedAnalyticsProps) => {
  return (
    <div className="space-y-8">
      {/* Gráficos Interativos */}
      <InteractiveCharts filters={filters} financialData={financialData} />

      {/* Análise Comparativa */}
      <ComparativeAnalysis filters={filters} />

      {/* Análise de Tendências */}
      <TrendAnalysis filters={filters} />
    </div>
  );
};
