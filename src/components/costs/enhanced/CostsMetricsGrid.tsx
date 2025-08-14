import { Cost } from "@/types/cost";
import { MetricCard } from "@/components/clients/metrics/MetricCard";
import { DollarSign, TrendingUp, Receipt, Target } from "lucide-react";

interface CostsMetricsGridProps {
  costs: Cost[];
}

export function CostsMetricsGrid({ costs }: CostsMetricsGridProps) {
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', { 
      style: 'currency', 
      currency: 'BRL' 
    }).format(value);
  };

  const totalCosts = costs.reduce((sum, cost) => sum + cost.amount, 0);
  
  const uniqueMonths = new Set(costs.map(c => c.date.substring(0, 7))).size;
  const monthlyAverage = uniqueMonths > 0 ? totalCosts / uniqueMonths : 0;
  
  const categoriesCount = new Set(
    costs.flatMap(cost => cost.categories || [])
  ).size;
  
  const highestCost = costs.length > 0 ? Math.max(...costs.map(c => c.amount)) : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <MetricCard
        icon={DollarSign}
        title="Total de Custos"
        value={totalCosts}
        tooltip="Soma total de todos os custos registrados"
        formatter={formatCurrency}
      />
      
      <MetricCard
        icon={TrendingUp}
        title="Média Mensal"
        value={monthlyAverage}
        tooltip="Média de custos por mês baseada nos dados disponíveis"
        formatter={formatCurrency}
      />
      
      <MetricCard
        icon={Receipt}
        title="Registros"
        value={costs.length}
        tooltip="Quantidade total de registros de custos"
        formatter={(v) => v.toString()}
      />
      
      <MetricCard
        icon={Target}
        title="Maior Custo"
        value={highestCost}
        tooltip="O maior valor individual registrado"
        formatter={formatCurrency}
      />
    </div>
  );
}