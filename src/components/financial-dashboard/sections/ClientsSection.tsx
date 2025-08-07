
import { useState } from "react";
import { Users, UserPlus, UserMinus, Clock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { CostFilters } from "@/types/cost";
import { InteractiveMetricCard } from "../components/InteractiveMetricCard";
import { MetricExplanationDialog } from "../components/MetricExplanationDialog";
import { useFinancialMetrics } from "@/components/clients/metrics/hooks/useFinancialMetrics";

interface ClientsSectionProps {
  filters: CostFilters;
}

export const ClientsSection = ({ filters }: ClientsSectionProps) => {
  const { allClientsMetrics, isLoadingAllClients } = useFinancialMetrics();
  const [selectedMetric, setSelectedMetric] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const getMetricExplanation = (metricType: string, value: string) => {
    const explanations = {
      activeClients: {
        title: "Clientes Ativos",
        value,
        explanation: "Número total de clientes que estão atualmente ativos na base. Considera clientes com contratos vigentes e que realizaram pagamentos recentes.",
        calculation: "Conta todos os clientes com status 'ativo' ou que realizaram pagamentos nos últimos meses",
        dataSource: "Tabela 'clients' com status ativo e tabela 'payments' para validação de atividade"
      },
      newClients: {
        title: "Novos Clientes",
        value,
        explanation: "Número de clientes que fizeram seu primeiro pagamento no mês atual. Esta métrica mostra a capacidade de aquisição de novos clientes da agência.",
        calculation: "Conta clientes cujo primeiro pagamento (reference_month) ocorreu no mês em análise",
        dataSource: "Tabela 'payments' - identifica primeiro pagamento por cliente_id"
      },
      churnRate: {
        title: "Churn Rate",
        value,
        explanation: "Taxa de cancelamento mensal, representa o percentual de clientes que cancelaram em relação ao total de clientes ativos no início do mês.",
        calculation: "(Clientes que cancelaram no mês ÷ Clientes ativos no início do mês) × 100",
        dataSource: "Baseado na data do último pagamento registrado na tabela 'payments'"
      },
      retention: {
        title: "Retenção Média",
        value,
        explanation: "Tempo médio que os clientes permanecem ativos na base antes de cancelar. Indica a qualidade do relacionamento e satisfação dos clientes.",
        calculation: "Média da diferença entre primeiro e último pagamento de todos os clientes",
        dataSource: "Calculado a partir das datas de primeiro e último pagamento na tabela 'payments'"
      }
    };
    return explanations[metricType as keyof typeof explanations];
  };

  const handleMetricClick = (metricType: string, value: string) => {
    const explanation = getMetricExplanation(metricType, value);
    setSelectedMetric(explanation);
    setIsDialogOpen(true);
  };

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
          onClick={() => handleMetricClick('activeClients', metrics?.activeClientsCount?.toString() || "0")}
        />

        <InteractiveMetricCard
          title="Novos Clientes"
          value="12"
          icon={UserPlus}
          trend={{ value: 18.5, isPositive: true }}
          color="bg-green-500"
          description="Adquiridos este mês"
          onClick={() => handleMetricClick('newClients', "12")}
        />

        <InteractiveMetricCard
          title="Churn Rate"
          value={`${formatDecimal(metrics?.churnRate || 0)}%`}
          icon={UserMinus}
          trend={{ value: 2.1, isPositive: false }}
          color={(metrics?.churnRate || 0) <= 5 ? "bg-green-500" : (metrics?.churnRate || 0) <= 10 ? "bg-yellow-500" : "bg-red-500"}
          description="Taxa de cancelamento mensal"
          onClick={() => handleMetricClick('churnRate', `${formatDecimal(metrics?.churnRate || 0)}%`)}
        />

        <InteractiveMetricCard
          title="Retenção Média"
          value={`${formatDecimal(metrics?.averageRetention || 0)} meses`}
          icon={Clock}
          trend={{ value: 8.7, isPositive: true }}
          color="bg-purple-500"
          description="Tempo médio de permanência"
          onClick={() => handleMetricClick('retention', `${formatDecimal(metrics?.averageRetention || 0)} meses`)}
        />
      </div>

      <MetricExplanationDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        metric={selectedMetric}
      />
    </Card>
  );
};
