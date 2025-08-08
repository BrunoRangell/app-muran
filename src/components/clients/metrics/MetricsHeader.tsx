
import { Users, DollarSign, Calendar, CreditCard, Percent, TrendingUp, Tag, TrendingDown, PieChart } from "lucide-react";
import { MetricCard } from "./MetricCard";
import { FinancialMetricsData } from "../types";

interface MetricsHeaderProps {
  metrics: FinancialMetricsData;
  formatCurrency: (value: number) => string;
  formatDecimal: (value: number) => string;
}

export const MetricsHeader = ({ metrics, formatCurrency, formatDecimal }: MetricsHeaderProps) => {
  const profit = (metrics.mrr || 0) - (metrics.totalCosts || 0);
  const marginProfit = metrics.mrr ? (profit / metrics.mrr) * 100 : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <MetricCard
        icon={Users}
        title="Clientes ativos"
        value={metrics.activeClientsCount || 0}
        tooltip="Número total de clientes ativos cadastrados no sistema"
        formatter={(value) => value.toString()}
      />

      <MetricCard
        icon={DollarSign}
        title="Receita Mensal Prevista"
        value={metrics.mrr || 0}
        tooltip="Receita mensal prevista baseada na soma dos valores de contrato dos clientes ativos"
        formatter={formatCurrency}
      />

      <MetricCard
        icon={Tag}
        title="Ticket Médio"
        value={metrics.averageTicket || 0}
        tooltip="Valor médio mensal por cliente ativo. Calculado dividindo a receita mensal pelo número de clientes ativos"
        formatter={formatCurrency}
      />

      <MetricCard
        icon={CreditCard}
        title="LTV Médio"
        value={(metrics.ltv || 0) / (metrics.totalClients || 1)}
        tooltip="Lifetime Value Médio - Valor médio gerado por cliente durante sua permanência. Calculado dividindo o LTV total pelo número de clientes"
        formatter={formatCurrency}
      />

      <MetricCard
        icon={TrendingUp}
        title="CAC"
        value={1250}
        tooltip="Custo de Aquisição de Clientes - Valor médio investido para conquistar cada novo cliente"
        formatter={formatCurrency}
      />

      <MetricCard
        icon={Calendar}
        title="Retenção Média"
        value={metrics.averageRetention || 0}
        tooltip="Tempo médio que os clientes permanecem ativos na plataforma, calculado desde a data do primeiro pagamento"
        formatter={(value) => `${formatDecimal(value)} meses`}
      />

      <MetricCard
        icon={Percent}
        title="Churn Rate"
        value={metrics.churnRate || 0}
        tooltip="Taxa de cancelamento mensal de clientes. Porcentagem de clientes que cancelaram em relação ao total"
        formatter={(value) => `${formatDecimal(value)}%`}
      />

      <MetricCard
        icon={DollarSign}
        title="Total de Custos"
        value={metrics.totalCosts || 0}
        tooltip="Soma total dos custos no período selecionado"
        formatter={formatCurrency}
      />

      <MetricCard
        icon={profit >= 0 ? TrendingUp : TrendingDown}
        title="Lucro"
        value={profit}
        tooltip="Lucro total no período (Receita - Custos)"
        formatter={formatCurrency}
      />

      <MetricCard
        icon={PieChart}
        title="Margem de Lucro"
        value={marginProfit}
        tooltip="Percentual do lucro em relação à receita total"
        formatter={(value) => `${formatDecimal(value)}%`}
      />
    </div>
  );
};
