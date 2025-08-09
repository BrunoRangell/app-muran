
import { Users, UserPlus, UserMinus, Clock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { CostFilters } from "@/types/cost";
import { InteractiveMetricCard } from "../components/InteractiveMetricCard";
import { useFinancialMetrics } from "@/components/clients/metrics/hooks/useFinancialMetrics";

interface ClientsSectionProps {
  filters: CostFilters;
}

export const ClientsSection = ({ filters }: ClientsSectionProps) => {
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

  const formatDecimal = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).format(value);
  };


  return (
    <Card className="p-3 border-l-2 border-l-blue-500">
      <div className="flex items-center gap-2 mb-3">
        <div className="p-1.5 bg-blue-100 rounded-lg">
          <Users className="h-4 w-4 text-blue-600" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-foreground">Base de Clientes</h3>
          <p className="text-xs text-muted-foreground">Crescimento e retenção</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <InteractiveMetricCard
          title="Clientes Ativos"
          value={metrics?.activeClientsCount?.toString() || "0"}
          icon={Users}
          trend={metrics?.trends?.newClientsTrend} // Using new clients trend as proxy for growth
          color="bg-blue-500"
          description="Total de clientes ativos no período"
        />

        <InteractiveMetricCard
          title="Novos clientes este mês"
          value={metrics?.newClientsCount?.toString() || "0"}
          icon={UserPlus}
          trend={metrics?.trends?.newClientsTrend}
          color="bg-green-500"
          description="Clientes adquiridos no mês atual"
        />

        <InteractiveMetricCard
          title="Churn Rate"
          value={formatDecimal(metrics?.churnRate || 0) + "%"}
          icon={UserMinus}
          trend={metrics?.trends?.churnRateTrend}
          color={(metrics?.churnRate || 0) <= 5 ? "bg-green-500" : (metrics?.churnRate || 0) <= 10 ? "bg-yellow-500" : "bg-red-500"}
          description="Taxa de cancelamento mensal"
        />

        <InteractiveMetricCard
          title="Retenção Média"
          value={formatDecimal(metrics?.averageRetention || 0) + " meses"}
          icon={Clock}
          trend={metrics?.trends?.ltvTrend} // LTV is related to retention
          color="bg-purple-500"
          description="Tempo médio de permanência dos clientes"
        />
      </div>
    </Card>
  );
};
