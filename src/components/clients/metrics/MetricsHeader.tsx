import { Users, DollarSign, BarChart, Calendar, CreditCard, Percent } from "lucide-react";
import { MetricCard } from "./MetricCard";
import { FinancialMetricsData } from "../types";

interface MetricsHeaderProps {
  metrics: FinancialMetricsData;
  formatCurrency: (value: number) => string;
  formatDecimal: (value: number) => string;
}

export const MetricsHeader = ({ metrics, formatCurrency, formatDecimal }: MetricsHeaderProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <MetricCard
        icon={Users}
        title="Total de Clientes Ativos"
        value={metrics.activeClientsCount || 0}
        tooltip="Número total de clientes ativos cadastrados no sistema"
        formatter={(value) => value.toString()}
      />

      <MetricCard
        icon={DollarSign}
        title="MRR"
        value={metrics.mrr || 0}
        tooltip="Monthly Recurring Revenue - Receita mensal recorrente total dos clientes ativos. Soma dos valores de contrato de todos os clientes ativos"
        formatter={formatCurrency}
      />

      <MetricCard
        icon={BarChart}
        title="ARR"
        value={metrics.arr || 0}
        tooltip="Annual Recurring Revenue - Receita anual recorrente. Calculado multiplicando o MRR por 12"
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
        icon={CreditCard}
        title="LTV Médio"
        value={(metrics.ltv || 0) / (metrics.totalClients || 1)}
        tooltip="Lifetime Value Médio - Valor médio gerado por cliente durante sua permanência. Calculado dividindo o LTV total pelo número de clientes"
        formatter={formatCurrency}
      />

      <MetricCard
        icon={Percent}
        title="Churn Rate"
        value={metrics.churnRate || 0}
        tooltip="Taxa de cancelamento mensal de clientes. Porcentagem de clientes que cancelaram em relação ao total"
        formatter={(value) => `${formatDecimal(value)}%`}
      />
    </div>
  );
};