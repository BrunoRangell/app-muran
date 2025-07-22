
import { Activity, Target, Zap, Award } from "lucide-react";
import { Card } from "@/components/ui/card";
import { CostFilters } from "@/types/cost";
import { InteractiveMetricCard } from "../components/InteractiveMetricCard";
import { useFinancialMetrics } from "@/components/clients/metrics/hooks/useFinancialMetrics";

interface PerformanceSectionProps {
  filters: CostFilters;
  metrics: any;
  isLoading: boolean;
}

export const PerformanceSection = ({ filters, metrics, isLoading }: PerformanceSectionProps) => {

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const averageLTV = metrics?.totalClients ? (metrics?.ltv || 0) / metrics.totalClients : 0;
  const ltvcacRatio = averageLTV > 0 ? averageLTV / 1250 : 0; // CAC fixo em 1250

  return (
    <Card className="p-6 border-l-4 border-l-purple-500">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-purple-100 rounded-lg">
          <Activity className="h-5 w-5 text-purple-600" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-muran-dark">Performance KPIs</h3>
          <p className="text-gray-600">Indicadores de desempenho chave</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <InteractiveMetricCard
          title="LTV Médio"
          value={formatCurrency(averageLTV)}
          icon={Target}
          trend={{ value: 14.8, isPositive: true }}
          color="bg-purple-500"
          description="Lifetime Value médio por cliente"
        />

        <InteractiveMetricCard
          title="LTV:CAC Ratio"
          value={`${ltvcacRatio.toFixed(1)}x`}
          icon={Zap}
          trend={{ value: 22.3, isPositive: true }}
          color={ltvcacRatio >= 3 ? "bg-green-500" : ltvcacRatio >= 2 ? "bg-yellow-500" : "bg-red-500"}
          description="Rel. Lifetime Value vs CAC"
        />

        <InteractiveMetricCard
          title="Crescimento MRR"
          value="15.7%"
          icon={Award}
          trend={{ value: 15.7, isPositive: true }}
          color="bg-green-500"
          description="Crescimento mensal da receita"
        />

        <InteractiveMetricCard
          title="Score de Saúde"
          value="87/100"
          icon={Activity}
          trend={{ value: 5.2, isPositive: true }}
          color="bg-green-500"
          description="Indicador geral de saúde financeira"
        />
      </div>
    </Card>
  );
};
