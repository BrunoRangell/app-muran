
import { DollarSign, TrendingDown, PieChart, AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { CostFilters } from "@/types/cost";
import { InteractiveMetricCard } from "../components/InteractiveMetricCard";

interface CostsSectionProps {
  filters: CostFilters;
  metrics: any;
  costs?: any[];
  isLoading: boolean;
}

export const CostsSection = ({ filters, metrics, costs = [], isLoading }: CostsSectionProps) => {
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

  const totalCosts = costs.reduce((sum, cost) => sum + Number(cost.amount || 0), 0);
  const monthlyAverage = totalCosts / Math.max(1, new Set(costs.map(c => c.date?.substring(0, 7) || '')).size);
  const costEfficiency = metrics?.mrr ? ((metrics.mrr - totalCosts) / metrics.mrr) * 100 : 0;

  return (
    <Card className="p-6 border-l-4 border-l-red-500">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-red-100 rounded-lg">
          <TrendingDown className="h-5 w-5 text-red-600" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-muran-dark">Gestão de Custos</h3>
          <p className="text-gray-600">Controle e otimização de gastos</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <InteractiveMetricCard
          title="Total de Custos"
          value={formatCurrency(totalCosts)}
          icon={DollarSign}
          trend={{ value: -8.2, isPositive: false }}
          color="bg-red-500"
          description="Custos totais no período"
        />

        <InteractiveMetricCard
          title="Média Mensal"
          value={formatCurrency(monthlyAverage)}
          icon={PieChart}
          trend={{ value: -5.1, isPositive: false }}
          color="bg-orange-500"
          description="Custo médio por mês"
        />

        <InteractiveMetricCard
          title="Eficiência de Custos"
          value={`${Math.round(costEfficiency)}%`}
          icon={AlertTriangle}
          trend={{ value: 12.3, isPositive: true }}
          color={costEfficiency >= 70 ? "bg-green-500" : costEfficiency >= 50 ? "bg-yellow-500" : "bg-red-500"}
          description="Margem de lucro sobre receita"
        />

        <InteractiveMetricCard
          title="Registros de Custos"
          value={costs.length.toString()}
          icon={TrendingDown}
          trend={{ value: 15.7, isPositive: true }}
          color="bg-blue-500"
          description="Total de registros no período"
        />
      </div>
    </Card>
  );
};
