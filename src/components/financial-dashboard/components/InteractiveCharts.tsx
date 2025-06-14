
import { Card } from "@/components/ui/card";
import { CostFilters } from "@/types/cost";
import { FinancialMetrics } from "@/components/clients/FinancialMetrics";
import { BarChart3 } from "lucide-react";

interface InteractiveChartsProps {
  filters: CostFilters;
}

export const InteractiveCharts = ({ filters }: InteractiveChartsProps) => {
  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-muran-primary/10 rounded-lg">
          <BarChart3 className="h-5 w-5 text-muran-primary" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-muran-dark">Gráficos Interativos</h3>
          <p className="text-gray-600">Visualização temporal das métricas financeiras</p>
        </div>
      </div>

      <FinancialMetrics />
    </Card>
  );
};
