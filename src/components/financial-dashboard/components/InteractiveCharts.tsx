
import { CostFilters } from "@/types/cost";
import { MetricsBarExplorer } from "./MetricsBarExplorer";

interface InteractiveChartsProps {
  filters: CostFilters;
}

export const InteractiveCharts = ({ filters }: InteractiveChartsProps) => {
  return (
    <div className="space-y-4">
      <MetricsBarExplorer />
    </div>
  );
};
