
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
    <Card className="p-6 border-l-4 border-l-blue-500">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-blue-100 rounded-lg">
          <Users className="h-5 w-5 text-blue-600" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-muran-dark">Base de Clientes</h3>
          <p className="text-gray-600">Crescimento e retenção de clientes</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <InteractiveMetricCard
          title="Clientes Ativos"
          value={metrics?.activeClientsCount?.toString() || "0"}
          icon={Users}
          trend={{ value: 5.2, isPositive: true }}
          color="bg-blue-500"
          description="Total de clientes ativos"
        />

        <InteractiveMetricCard
          title="Novos Clientes"
          value="12"
          icon={UserPlus}
          trend={{ value: 18.5, isPositive: true }}
          color="bg-green-500"
          description="Adquiridos este mês"
        />

        <InteractiveMetricCard
          title="Churn Rate"
          value={`${formatDecimal(metrics?.churnRate || 0)}%`}
          icon={UserMinus}
          trend={{ value: 2.1, isPositive: false }}
          color={(metrics?.churnRate || 0) <= 5 ? "bg-green-500" : (metrics?.churnRate || 0) <= 10 ? "bg-yellow-500" : "bg-red-500"}
          description="Taxa de cancelamento mensal"
        />

        <InteractiveMetricCard
          title="Retenção Média"
          value={`${formatDecimal(metrics?.averageRetention || 0)} meses`}
          icon={Clock}
          trend={{ value: 8.7, isPositive: true }}
          color="bg-purple-500"
          description="Tempo médio de permanência"
        />
      </div>
    </Card>
  );
};
