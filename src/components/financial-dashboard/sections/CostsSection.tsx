
import { CreditCard, TrendingDown, AlertTriangle, Calculator } from "lucide-react";
import { Card } from "@/components/ui/card";
import { CostFilters } from "@/types/cost";
import { InteractiveMetricCard } from "../components/InteractiveMetricCard";
import { useFinancialMetrics } from "@/components/clients/metrics/hooks/useFinancialMetrics";

interface CostsSectionProps {
  filters: CostFilters;
}

export const CostsSection = ({ filters }: CostsSectionProps) => {
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

  const costPerClient = metrics?.activeClientsCount ? (metrics?.totalCosts || 0) / metrics.activeClientsCount : 0;
  const costToRevenueRatio = metrics?.mrr ? ((metrics?.totalCosts || 0) / metrics.mrr) * 100 : 0;

  return (
    <Card className="p-3 border-l-2 border-l-red-500">
      <div className="flex items-center gap-2 mb-3">
        <div className="p-1.5 bg-red-100 rounded-lg">
          <CreditCard className="h-4 w-4 text-red-600" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-foreground">Análise de Custos</h3>
          <p className="text-xs text-muted-foreground">Gastos e eficiência</p>
        </div>
      </div>

      <div className="space-y-2">
        <InteractiveMetricCard
          title="Total de Custos"
          value={formatCurrency(metrics?.totalCosts || 0)}
          icon={CreditCard}
          trend={{ value: -3.2, isPositive: false }}
          color="bg-red-500"
          description="Custos totais do período"
        />

        <InteractiveMetricCard
          title="CAC"
          value={formatCurrency(1250)}
          icon={TrendingDown}
          trend={{ value: -8.1, isPositive: true }}
          color="bg-orange-500"
          description="Custo de Aquisição de Cliente"
        />

        <InteractiveMetricCard
          title="Custo por Cliente"
          value={formatCurrency(costPerClient)}
          icon={Calculator}
          trend={{ value: 2.3, isPositive: false }}
          color="bg-yellow-500"
          description="Custo médio por cliente ativo"
        />

        <InteractiveMetricCard
          title="Custo vs Receita"
          value={`${costToRevenueRatio.toFixed(1)}%`}
          icon={AlertTriangle}
          trend={{ value: -1.5, isPositive: true }}
          color={costToRevenueRatio <= 30 ? "bg-green-500" : costToRevenueRatio <= 50 ? "bg-yellow-500" : "bg-red-500"}
          description="Percentual dos custos sobre receita"
        />
      </div>
    </Card>
  );
};
