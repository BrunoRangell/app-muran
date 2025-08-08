
import { DollarSign, TrendingUp, PieChart, Target, CreditCard, Wallet, BarChart3 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { CostFilters } from "@/types/cost";
import { InteractiveMetricCard } from "../components/InteractiveMetricCard";
import { useFinancialMetrics } from "@/components/clients/metrics/hooks/useFinancialMetrics";

interface FinancialSectionProps {
  filters: CostFilters;
}

export const FinancialSection = ({ filters }: FinancialSectionProps) => {
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
  const profit = (metrics?.mrr || 0) - (metrics?.totalCosts || 0);
  const marginProfit = metrics?.mrr ? (profit / metrics.mrr) * 100 : 0;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDecimal = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).format(value);
  };

  return (
    <Card className="p-3 border-l-2 border-l-muran-primary">
      <div className="flex items-center gap-2 mb-3">
        <div className="p-1.5 bg-muran-primary/10 rounded-lg">
          <DollarSign className="h-4 w-4 text-muran-primary" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-foreground">Métricas Financeiras</h3>
          <p className="text-xs text-muted-foreground">Indicadores de receita</p>
        </div>
      </div>

      <div className="space-y-2">
        <InteractiveMetricCard
          title="MRR"
          value={formatCurrency(metrics?.mrr || 0)}
          icon={DollarSign}
          trend={metrics?.trends?.mrrTrend}
          color="bg-muran-primary"
          description="Receita Recorrente Mensal dos clientes ativos"
        />

        <InteractiveMetricCard
          title="Ticket Médio"
          value={formatCurrency(metrics?.averageTicket || 0)}
          icon={CreditCard}
          trend={metrics?.trends?.averageTicketTrend}
          color="bg-green-500"
          description="Valor médio pago por cliente"
        />

        <InteractiveMetricCard
          title="Lucro Líquido"
          value={formatCurrency(profit)}
          icon={Wallet}
          trend={metrics?.trends?.totalCostsTrend ? { 
            value: metrics.trends.totalCostsTrend.value, 
            isPositive: !metrics.trends.totalCostsTrend.isPositive // Invert for profit (lower costs = better)
          } : undefined}
          color="bg-blue-500"
          description="Receita menos custos totais"
        />

        <InteractiveMetricCard
          title="Margem de Lucro"
          value={formatDecimal(marginProfit) + "%"}
          icon={TrendingUp}
          trend={metrics?.trends?.totalCostsTrend ? { 
            value: metrics.trends.totalCostsTrend.value, 
            isPositive: !metrics.trends.totalCostsTrend.isPositive // Invert for margin (lower costs = better margin)
          } : undefined}
          color="bg-purple-500"
          description="Percentual de lucro sobre receita"
        />
      </div>
    </Card>
  );
};
