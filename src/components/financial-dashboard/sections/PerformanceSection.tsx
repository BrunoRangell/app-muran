
import { Target, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/card";
import { CostFilters } from "@/types/cost";
import { InteractiveMetricCard } from "../components/InteractiveMetricCard";
import { useFinancialMetrics } from "@/components/clients/metrics/hooks/useFinancialMetrics";

interface PerformanceSectionProps {
  filters: CostFilters;
}

export const PerformanceSection = ({ filters }: PerformanceSectionProps) => {
  const { allClientsMetrics, isLoadingAllClients } = useFinancialMetrics();

  if (isLoadingAllClients) {
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

  const metrics = allClientsMetrics;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const ltvCacRatio = metrics?.ltvCacRatio || 2.5;

  return (
    <Card className="p-3 border-l-2 border-l-green-500">
      <div className="flex items-center gap-2 mb-3">
        <div className="p-1.5 bg-green-100 rounded-lg">
          <Target className="h-4 w-4 text-green-600" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-foreground">Saúde Financeira</h3>
          <p className="text-xs text-muted-foreground">Sustentabilidade</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <InteractiveMetricCard
          title="LTV Médio"
          value={formatCurrency(metrics?.ltv || 0)}
          icon={Target}
          trend={metrics?.trends?.ltvTrend}
          color="bg-green-500"
          description="Valor médio do tempo de vida do cliente"
        />

        <InteractiveMetricCard
          title="LTV:CAC Ratio"
          value={`${ltvCacRatio.toFixed(1)}x`}
          icon={TrendingUp}
          trend={metrics?.trends?.ltvCacRatioTrend}
          color={ltvCacRatio >= 3 ? "bg-green-500" : ltvCacRatio >= 2 ? "bg-yellow-500" : "bg-red-500"}
          description="Relação entre LTV e CAC - ideal acima de 3x"
        />
      </div>
    </Card>
  );
};
